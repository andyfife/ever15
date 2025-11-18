'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProps {
  onUploadComplete?: (taskId: string, userMediaId: string) => void;
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }

      // Validate file size (max 5GB)
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 5GB');
        return;
      }

      setFile(selectedFile);
      setError('');
      setSuccess('');

      // Create video preview
      const url = URL.createObjectURL(selectedFile);
      setVideoPreview(url);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  const generateThumbnail = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve('');
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            resolve('');
          }
        }, 'image/jpeg', 0.8);
      } else {
        resolve('');
      }
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Step 1: Get pre-signed URL
      setUploadProgress(10);
      const urlResponse = await fetch('/api/video/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await urlResponse.json();

      // Step 2: Upload to S3 using fetch
      setUploadProgress(20);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setUploadProgress(85);

      // Step 3: Generate thumbnail
      const thumbnailUrl = await generateThumbnail();

      // Step 4: Start processing
      setUploadProgress(90);
      const processingResponse = await fetch('/api/video/start-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoKey: key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          duration: videoDuration,
          thumbnailUrl,
        }),
      });

      if (!processingResponse.ok) {
        const errorData = await processingResponse.json();
        throw new Error(errorData.error || 'Failed to start processing');
      }

      const { taskId, userMediaId } = await processingResponse.json();

      setUploadProgress(100);
      setSuccess('Video uploaded successfully! Processing started...');

      // Reset form
      setFile(null);
      setVideoPreview('');
      setVideoDuration(0);
      const fileInput = document.getElementById('video-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Callback to parent component
      if (onUploadComplete) {
        onUploadComplete(taskId, userMediaId);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Interview Video</CardTitle>
        <CardDescription>
          Upload your interview video for automatic transcription and AI-powered summarization.
          Maximum file size: 5GB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-input">Select Video File</Label>
          <Input
            id="video-input"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {videoPreview && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              className="w-full max-h-64 rounded-lg border"
              onLoadedMetadata={handleVideoLoaded}
            />
            {file && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>File:</strong> {file.name}</p>
                <p><strong>Size:</strong> {formatFileSize(file.size)}</p>
                {videoDuration > 0 && (
                  <p><strong>Duration:</strong> {formatDuration(videoDuration)}</p>
                )}
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {uploadProgress}% - {
                uploadProgress < 20 ? 'Preparing...' :
                uploadProgress < 85 ? 'Uploading...' :
                uploadProgress < 95 ? 'Processing...' :
                'Finalizing...'
              }
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </Button>

        {!file && (
          <p className="text-xs text-muted-foreground text-center">
            Your video will be automatically processed: moderation → audio extraction →
            transcription → AI summarization
          </p>
        )}
      </CardContent>
    </Card>
  );
}
