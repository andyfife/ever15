'use client';

import { useState } from 'react';
import { VideoUpload } from '@/components/video-upload';
import { VideoProcessingStatus } from '@/components/video-processing-status';

export default function VideoUploadPage() {
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentUserMediaId, setCurrentUserMediaId] = useState<string | null>(
    null
  );

  const handleUploadComplete = (taskId: string, userMediaId: string) => {
    setCurrentTaskId(taskId);
    setCurrentUserMediaId(userMediaId);
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
          <p className="text-muted-foreground">
            Upload your interview video for automatic transcription with speaker
            identification, AI-powered summarization, and keyword extraction.
          </p>
        </div>

        {/* Upload Form */}
        {!currentTaskId && (
          <VideoUpload onUploadComplete={handleUploadComplete} />
        )}

        {/* Processing Status */}
        {currentTaskId && currentUserMediaId && (
          <VideoProcessingStatus
            taskId={currentTaskId}
            userMediaId={currentUserMediaId}
          />
        )}

        {/* Info Section */}
        {!currentTaskId && (
          <div className="border rounded-lg p-6 bg-muted/50">
            <h3 className="font-semibold mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>
                  <strong className="text-foreground">Upload your video</strong>{' '}
                  - We accept MP4, MOV, AVI, and WebM formats up to 5GB
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>
                  <strong className="text-foreground">
                    Content moderation
                  </strong>{' '}
                  - Automatic screening for inappropriate content
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>
                  <strong className="text-foreground">Audio extraction</strong>{' '}
                  - We extract high-quality audio from your video
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.</span>
                <span>
                  <strong className="text-foreground">Transcription</strong> -
                  AI-powered transcription with automatic speaker identification
                  (interviewer vs. interviewee)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">5.</span>
                <span>
                  <strong className="text-foreground">AI Analysis</strong> -
                  Generate summary and extract key topics/keywords
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.</span>
                <span>
                  <strong className="text-foreground">Review & Edit</strong> -
                  You can edit the transcript, assign speaker names, and refine
                  details
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">7.</span>
                <span>
                  <strong className="text-foreground">Publish</strong> - Choose
                  visibility (private, friends, or public) and add images/text
                  to create your video page
                </span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
