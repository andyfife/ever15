// components/video-upload.tsx
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
import { uploadData } from 'aws-amplify/storage';

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
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];

    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
      setError('File size must be less than 5GB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setVideoPreview(URL.createObjectURL(selectedFile));
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  const generateThumbnail = async (): Promise<string> => {
    if (!videoRef.current) return '';

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Take thumbnail from 2 seconds in (or beginning)
    video.currentTime = Math.min(2, video.duration);
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // 1. Upload directly with Amplify Storage (uses your private/{entity_id}/* rule perfectly)
      const s3Result = await uploadData({
        path: ({ identityId }) =>
          `private/${identityId}/videos/${Date.now()}-${file.name}`,
        data: file,
        options: {
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const percent = Math.round((transferredBytes / totalBytes) * 80); // 0-80%
              setUploadProgress(percent + 10); // leave room for processing steps
            }
          },
        },
      }).result;

      setUploadProgress(85);

      // 2. Generate thumbnail
      const thumbnailBase64 = await generateThumbnail();
      setUploadProgress(90);

      // 3. Tell your backend to start processing
      const processingResponse = await fetch('/api/video/start-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoKey: s3Result.path,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          duration: videoDuration,
          thumbnailUrl: thumbnailBase64,
        }),
      });

      if (!processingResponse.ok) throw new Error('Failed to start processing');

      const { taskId, userMediaId } = await processingResponse.json();

      setUploadProgress(100);
      setSuccess('Upload complete! Processing started...');

      onUploadComplete?.(taskId, userMediaId);

      // Reset
      setFile(null);
      setVideoPreview('');
      setVideoDuration(0);
      setUploadProgress(0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
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
          Maximum file size: 5GB. Your video will be automatically processed.
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
                <p>
                  <strong>File:</strong> {file.name}
                </p>
                <p>
                  <strong>Size:</strong> {formatFileSize(file.size)}
                </p>
                {videoDuration > 0 && (
                  <p>
                    <strong>Duration:</strong> {formatDuration(videoDuration)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress < 85 ? 'Uploading video...' : 'Finalizing...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Uploading... Please wait' : 'Upload Video'}
        </Button>
      </CardContent>
    </Card>
  );
}
