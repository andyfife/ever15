'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { uploadData } from 'aws-amplify/storage';
import { toast } from 'sonner';
import VideoMetaDialog, { VideoMeta } from '@/components/VideoMetaDialog';
import { format } from 'date-fns';

interface VideoUploadProps {
  onUploadComplete?: (taskId: string, userMediaId: string) => void;
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // dialog + metadata
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // fetch friends (placeholder) - replace with your real endpoint / store
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/user-and-friends'); // implement this
        if (!res.ok) throw new Error('Failed to load friends');
        const data = await res.json();
        if (mounted) setFriends(Array.isArray(data) ? data : []);
      } catch (e) {
        // silently ignore; we'll let datalist be empty
        console.warn('Could not load friends list', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenMetaAndSelect = () => {
    // open metadata dialog first
    setMetaDialogOpen(true);
  };

  const onMetaSubmit = async (meta: VideoMeta) => {
    // save meta locally and then open the file picker so user can choose file
    setVideoMeta(meta);
    setMetaDialogOpen(false);

    // open file dialog programmatically
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150); // small delay to allow dialog to close
  };

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
      console.log('Starting upload...');

      const result = await uploadData({
        path: ({ identityId }) => {
          if (!identityId)
            throw new Error('No identityId - are you logged in?');
          console.log('Identity ID:', identityId);
          return `private/${identityId}/videos/${Date.now()}-${file.name}`;
        },
        data: file,
        options: {
          contentType: file.type,
          onProgress: (progress) => {
            if (progress.totalBytes) {
              setUploadProgress(
                Math.round(
                  (progress.transferredBytes / progress.totalBytes) * 80
                ) + 10
              );
            }
          },
        },
      }).result;

      console.log('Upload succeeded! S3 path:', result.path);

      // OPTIONAL: send metadata + thumbnail to your API to create processing job
      try {
        const thumb = await generateThumbnail();

        // IMPORTANT: convert Date -> string before serializing
        const metaToSend = videoMeta
          ? {
              ...videoMeta,
              // normalize date: if Date -> ISO string, otherwise pass through (if already a string)
              date:
                videoMeta.date instanceof Date &&
                !isNaN(videoMeta.date.getTime())
                  ? videoMeta.date.toISOString()
                  : (videoMeta.date ?? null),
            }
          : null;

        await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            s3Path: result.path,
            meta: metaToSend,
            thumbnail: thumb,
          }),
        });
      } catch (e) {
        console.warn('Could not create processing job', e);
      }

      // show toast and success UI
      const toastDurationMs = 4500;
      toast.success(
        'Video uploaded successfully. We will notify you when your video has been processed.',
        {
          description: 'Processing has started...',
          duration: toastDurationMs,
        }
      );

      setSuccess('Video uploaded successfully — processing started.');

      if (onUploadComplete) {
        try {
          onUploadComplete('', result.path || '');
        } catch (err) {
          console.warn('onUploadComplete error', err);
        }
      }

      setTimeout(() => {
        try {
          router.refresh();
        } catch {
          try {
            window.location.reload();
          } catch {}
        }
      }, toastDurationMs + 200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed – check console');
      setUploadProgress(0);
      toast.error('Upload failed – something went wrong');
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
          {/* Button opens meta dialog first */}
          <div className="relative">
            <Button
              type="button"
              className="w-full justify-start"
              onClick={handleOpenMetaAndSelect}
              disabled={uploading}
            >
              {file ? `File selected: ${file.name}` : 'Select Video File'}
            </Button>

            {/* real file input is hidden but accessible to screen readers */}
            <input
              ref={fileInputRef}
              id="video-input"
              type="file"
              accept="video/*"
              disabled={uploading}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 pointer-events-none"
              aria-hidden
            />
          </div>
        </div>

        {/* dialog for metadata */}
        <VideoMetaDialog
          open={metaDialogOpen}
          onOpenChange={setMetaDialogOpen}
          mode="create"
          initial={{
            name: '',
            description: '',
            visibility: 'PRIVATE',
            speakers: [''],
          }}
          onSubmit={onMetaSubmit}
          friends={friends}
        />

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
                {videoMeta && (
                  <div className="mt-2 text-xs text-gray-400">
                    <div>
                      <strong>Title:</strong> {videoMeta.name}
                    </div>
                    {videoMeta.speakers?.length > 0 && (
                      <div>
                        <strong>Speakers:</strong>{' '}
                        {videoMeta.speakers.join(', ')}
                      </div>
                    )}
                    {/* Format the Date for display — DO NOT render the raw Date object */}
                    {videoMeta.date && (
                      <div>
                        <strong>Date:</strong>{' '}
                        {videoMeta.date instanceof Date
                          ? format(videoMeta.date, 'PPP')
                          : String(videoMeta.date)}
                      </div>
                    )}
                    {videoMeta.location && (
                      <div>
                        <strong>Location:</strong> {videoMeta.location}
                      </div>
                    )}
                  </div>
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
          className="w-full bg-blue-500 "
          size="lg"
        >
          {uploading ? 'Uploading... Please wait' : 'Upload Video'}
        </Button>
      </CardContent>
    </Card>
  );
}
