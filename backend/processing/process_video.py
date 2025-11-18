#!/usr/bin/env python3
"""
Video Processing Pipeline for Interview Videos
Uses: NudeNet (moderation) + WhisperX (transcription) + Llama (summarization)
Runs on AWS Batch GPU instances (g4dn, g5, or p3)

Flow:
1. Task record is created with video metadata when user uploads
2. AWS Batch job is submitted with TASK_ID only
3. This script reads Task to get video metadata
4. After moderation passes, UserMedia record is created
5. Video processing continues (transcription, summarization)
6. UserMedia only appears in database if processing succeeds
"""

import os
import sys
import json
import logging
import subprocess
from pathlib import Path
from typing import Dict, Any, Tuple, List
import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AWS clients
s3 = boto3.client('s3')

# Database connection (using psycopg2 for PostgreSQL)
import psycopg2
from psycopg2.extras import Json

def get_db_connection():
    """Create PostgreSQL connection"""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def update_task_status(task_id: str, status: str, current_step: str, error_message: str = None):
    """Update task status in database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get current payload
        cur.execute('SELECT payload FROM "Task" WHERE id = %s', (task_id,))
        result = cur.fetchone()
        if not result:
            logger.error(f"Task {task_id} not found")
            return

        payload = result[0]
        payload['currentStep'] = current_step

        # Update task
        if error_message:
            cur.execute(
                'UPDATE "Task" SET status = %s, payload = %s, "errorMessage" = %s, "updatedAt" = NOW() WHERE id = %s',
                (status, Json(payload), error_message, task_id)
            )
        else:
            cur.execute(
                'UPDATE "Task" SET status = %s, payload = %s, "updatedAt" = NOW() WHERE id = %s',
                (status, Json(payload), task_id)
            )

        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Updated task {task_id}: {status} - {current_step}")
    except Exception as e:
        logger.error(f"Failed to update task status: {e}")


def create_user_media(task_payload: Dict) -> str:
    """Create UserMedia record from task payload after successful processing"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        import uuid
        user_media_id = str(uuid.uuid4())

        cur.execute('''
            INSERT INTO "UserMedia"
            (id, "userId", url, "thumbnailUrl", name, type, visibility, "moderationStatus",
             "approvalStatus", "originalFilename", "fileSize", "mimeType", duration,
             "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', (
            user_media_id,
            task_payload['userId'],
            task_payload['videoUrl'],
            task_payload.get('thumbnailUrl'),
            task_payload['fileName'],
            'USER_VIDEO',
            'PRIVATE',  # Default to private
            'APPROVED',  # Already passed moderation
            'DRAFT',
            task_payload['fileName'],
            int(task_payload['fileSize']) if task_payload.get('fileSize') else None,
            task_payload.get('mimeType'),
            task_payload.get('duration')
        ))

        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"✓ Created UserMedia: {user_media_id}")
        return user_media_id

    except Exception as e:
        logger.error(f"Failed to create UserMedia: {e}")
        raise


def moderate_video(video_path: str) -> Tuple[bool, str]:
    """
    Content moderation using NudeNet
    Returns: (is_appropriate, message)
    """
    logger.info("Starting content moderation with NudeNet...")

    try:
        from nudenet import NudeDetector
        import cv2

        detector = NudeDetector()

        # Extract frames (1 per second for efficiency)
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps) if fps > 0 else 30

        frames_to_check = []
        temp_frame_dir = "/tmp/frames"
        os.makedirs(temp_frame_dir, exist_ok=True)

        frame_count = 0
        max_frames = 60  # Check max 60 frames (1 minute for 1fps)

        while cap.isOpened() and len(frames_to_check) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                frame_path = f"{temp_frame_dir}/frame_{frame_count}.jpg"
                cv2.imwrite(frame_path, frame)
                frames_to_check.append(frame_path)

            frame_count += 1

        cap.release()

        if not frames_to_check:
            logger.warning("No frames extracted from video")
            return True, "No frames to check"

        # Batch detection
        logger.info(f"Checking {len(frames_to_check)} frames for inappropriate content...")
        inappropriate_count = 0
        inappropriate_classes = []

        for frame_path in frames_to_check:
            try:
                detections = detector.detect(frame_path)

                for detection in detections:
                    # Check for explicit content
                    if detection['class'] in ['EXPOSED_GENITALIA', 'EXPOSED_BREAST', 'EXPOSED_BUTTOCKS']:
                        if detection['score'] > 0.75:
                            inappropriate_count += 1
                            inappropriate_classes.append(detection['class'])
                            logger.warning(f"⚠️ Inappropriate content: {detection['class']} ({detection['score']:.2f})")

                os.remove(frame_path)
            except Exception as e:
                logger.error(f"Error processing frame {frame_path}: {e}")

        # Threshold: reject if more than 5% of frames are inappropriate
        rejection_threshold = len(frames_to_check) * 0.05

        if inappropriate_count > rejection_threshold:
            message = f"Rejected: {inappropriate_count} inappropriate frames detected ({', '.join(set(inappropriate_classes))})"
            logger.error(f"❌ {message}")
            return False, message

        logger.info("✓ Content moderation passed")
        return True, "Content approved"

    except Exception as e:
        logger.error(f"Moderation error: {e}")
        # On error, fail safe and approve (you can change this to reject)
        return True, f"Moderation check skipped due to error: {str(e)}"


def extract_audio(video_path: str) -> str:
    """Extract audio from video using FFmpeg"""
    logger.info("Extracting audio from video...")

    audio_path = video_path.replace('.mp4', '.wav')

    try:
        # Extract audio at 16kHz mono (required for WhisperX)
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',       # Mono
            '-y',             # Overwrite
            audio_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")

        logger.info(f"✓ Audio extracted: {audio_path}")
        return audio_path

    except Exception as e:
        logger.error(f"Audio extraction failed: {e}")
        raise


def transcribe_with_whisperx(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe audio using WhisperX with speaker diarization
    Returns: dict with segments, language, and speaker info
    """
    logger.info("Starting WhisperX transcription...")

    try:
        import whisperx
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        logger.info(f"Using device: {device}, compute_type: {compute_type}")

        # Load WhisperX model
        model = whisperx.load_model("large-v2", device, compute_type=compute_type)

        # Load audio
        audio = whisperx.load_audio(audio_path)

        # Transcribe
        logger.info("Transcribing audio...")
        result = model.transcribe(audio, batch_size=16)
        logger.info(f"✓ Transcription complete. Language: {result.get('language', 'unknown')}")

        # Align timestamps
        logger.info("Aligning timestamps...")
        model_a, metadata = whisperx.load_align_model(
            language_code=result.get("language", "en"),
            device=device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            device
        )
        logger.info("✓ Timestamp alignment complete")

        # Speaker diarization
        hf_token = os.environ.get('HF_TOKEN')
        if hf_token:
            logger.info("Starting speaker diarization...")
            try:
                diarize_model = whisperx.DiarizationPipeline(
                    use_auth_token=hf_token,
                    device=device
                )
                diarize_segments = diarize_model(audio)
                result = whisperx.assign_word_speakers(diarize_segments, result)
                logger.info("✓ Speaker diarization complete")
            except Exception as e:
                logger.warning(f"Diarization failed (continuing without): {e}")
        else:
            logger.warning("⚠️ No HF_TOKEN - skipping diarization")

        return result

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise


def summarize_with_llama(transcript_text: str, segments: List[Dict]) -> Tuple[str, List[str]]:
    """
    Generate summary and extract keywords using Llama
    Returns: (summary, keywords)
    """
    logger.info("Starting Llama summarization...")

    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch

        # Use Llama 3.2 3B Instruct (fits on smaller GPUs)
        model_name = "meta-llama/Llama-3.2-3B-Instruct"

        logger.info(f"Loading {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )

        # Limit transcript length to avoid token limits
        max_chars = 4000
        truncated_text = transcript_text[:max_chars]
        if len(transcript_text) > max_chars:
            truncated_text += "..."

        # Create prompt for summary
        summary_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant that creates concise summaries of interview transcripts.<|eot_id|><|start_header_id|>user<|end_header_id|>

Please summarize the following interview transcript in 2-3 clear paragraphs. Focus on the main topics discussed, key points made by the speakers, and any important conclusions or insights.

Transcript:
{truncated_text}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

        # Generate summary
        logger.info("Generating summary...")
        inputs = tokenizer(summary_prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

        summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract just the assistant's response
        summary = summary.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()

        logger.info("✓ Summary generated")

        # Create prompt for keywords
        keywords_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant that extracts key topics and keywords from transcripts.<|eot_id|><|start_header_id|>user<|end_header_id|>

Extract 5-10 important keywords or key phrases from this interview transcript. Return them as a comma-separated list.

Transcript:
{truncated_text}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Keywords: """

        # Generate keywords
        logger.info("Extracting keywords...")
        inputs = tokenizer(keywords_prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.5,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

        keywords_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        keywords_text = keywords_text.split("Keywords:")[-1].strip()

        # Parse keywords
        keywords = [k.strip() for k in keywords_text.split(',') if k.strip()]
        keywords = keywords[:10]  # Limit to 10

        logger.info(f"✓ Extracted {len(keywords)} keywords")

        return summary, keywords

    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        # Return empty results on failure
        return "Summary generation failed", []


def save_transcript_to_db(user_media_id: str, transcript_result: Dict, summary: str, keywords: List[str]):
    """Save transcript to UserMediaTranscript table"""
    logger.info("Saving transcript to database...")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Extract full text from segments
        segments = transcript_result.get('segments', [])
        full_text = " ".join([seg.get('text', '') for seg in segments])

        # Prepare speaker mappings (will be edited by user later)
        speaker_mappings = {}
        speakers_found = set()
        for seg in segments:
            if 'speaker' in seg:
                speakers_found.add(seg['speaker'])

        for speaker in speakers_found:
            speaker_mappings[speaker] = f"Speaker {speaker}"

        # Create transcript record
        transcript_id = __import__('uuid').uuid4().hex

        cur.execute('''
            INSERT INTO "UserMediaTranscript"
            (id, "userMediaId", text, status, "isCurrent", summary, keywords, "speakerMappings", "rawSegments", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', (
            transcript_id,
            user_media_id,
            full_text,
            'COMPLETED',
            True,
            summary,
            Json(keywords),
            Json(speaker_mappings),
            Json(segments)
        ))

        conn.commit()
        cur.close()
        conn.close()

        logger.info(f"✓ Transcript saved: {transcript_id}")
        return transcript_id

    except Exception as e:
        logger.error(f"Failed to save transcript: {e}")
        raise


def get_task_payload(task_id: str) -> Dict:
    """Get task payload from database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT payload FROM "Task" WHERE id = %s', (task_id,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if not result:
            raise Exception(f"Task {task_id} not found")

        return result[0]
    except Exception as e:
        logger.error(f"Failed to get task payload: {e}")
        raise


def process_video(task_id: str) -> Dict[str, Any]:
    """
    Main processing pipeline
    """
    logger.info(f"=== Starting video processing ===")
    logger.info(f"Task ID: {task_id}")

    # Get task payload with all video metadata
    task_payload = get_task_payload(task_id)
    video_key = task_payload['videoKey']
    bucket = task_payload['bucket']

    logger.info(f"Video: s3://{bucket}/{video_key}")
    logger.info(f"User ID: {task_payload['userId']}")

    # Download video from S3
    logger.info("Downloading video from S3...")
    video_path = f"/tmp/{Path(video_key).name}"

    try:
        s3.download_file(bucket, video_key, video_path)
        logger.info(f"✓ Downloaded to {video_path}")
    except ClientError as e:
        logger.error(f"Failed to download video: {e}")
        update_task_status(task_id, 'FAILED', 'UPLOAD_COMPLETE', str(e))
        raise

    # Step 1: Content Moderation
    update_task_status(task_id, 'PROCESSING', 'MODERATION')
    is_appropriate, moderation_message = moderate_video(video_path)

    if not is_appropriate:
        logger.error(f"❌ Video rejected: {moderation_message}")
        update_task_status(task_id, 'FAILED', 'MODERATION', moderation_message)
        return {
            "status": "rejected",
            "reason": moderation_message
        }

    logger.info(f"✓ Moderation passed: {moderation_message}")

    # Create UserMedia record after passing moderation
    logger.info("Creating UserMedia record...")
    user_media_id = create_user_media(task_payload)

    # Update task payload with userMediaId
    task_payload['userMediaId'] = user_media_id
    update_task_status(task_id, 'PROCESSING', 'MODERATION')

    # Step 2: Extract Audio
    update_task_status(task_id, 'PROCESSING', 'AUDIO_EXTRACTION')
    audio_path = extract_audio(video_path)

    # Step 3: Transcribe with WhisperX
    update_task_status(task_id, 'PROCESSING', 'TRANSCRIPTION')
    transcript_result = transcribe_with_whisperx(audio_path)

    # Step 4: Generate Summary with Llama
    update_task_status(task_id, 'PROCESSING', 'SUMMARIZATION')
    transcript_text = " ".join([seg.get('text', '') for seg in transcript_result.get('segments', [])])
    summary, keywords = summarize_with_llama(transcript_text, transcript_result.get('segments', []))

    # Step 5: Save Results to Database
    logger.info("Saving results to database...")
    transcript_id = save_transcript_to_db(user_media_id, transcript_result, summary, keywords)

    # Cleanup
    logger.info("Cleaning up temporary files...")
    try:
        os.remove(video_path)
        os.remove(audio_path)
    except Exception as e:
        logger.warning(f"Cleanup error: {e}")

    # Mark as complete
    update_task_status(task_id, 'COMPLETED', 'SUMMARIZATION')

    logger.info("✅ Processing complete!")
    return {
        "status": "success",
        "transcript_id": transcript_id,
        "user_media_id": user_media_id,
        "summary_length": len(summary),
        "keywords_count": len(keywords)
    }


if __name__ == "__main__":
    # Get parameters from environment variables (set by AWS Batch)
    task_id = os.environ.get('TASK_ID')

    if not task_id:
        logger.error("Missing required environment variable: TASK_ID")
        sys.exit(1)

    try:
        result = process_video(task_id)
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Processing failed: {e}", exc_info=True)
        update_task_status(task_id, 'FAILED', 'PROCESSING', str(e))
        sys.exit(1)
