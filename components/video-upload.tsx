// components/VideoUpload.tsx
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
import VideoMetaDialog, { VideoMeta } from './VideoMetaDialog';

interface Friend {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  isSelf?: boolean;
}

export function VideoUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch friends + current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/user-and-friends');
        if (!res.ok) throw new Error('Failed to load friends');
        const data: { friends: Friend[] } = await res.json();
        if (!mounted) return;

        const names = data.friends
          .map((f) => [f.firstName, f.lastName].filter(Boolean).join(' '))
          .filter(Boolean);

        setFriends(names);
      } catch (err) {
        console.warn('Could not load friends list', err);
        setFriends([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const generateThumbnail = async (): Promise<string> => {
    if (!videoRef.current) return '';
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    video.currentTime = Math.min(2, video.duration);
    await new Promise((res) => (video.onseeked = res));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!videoMeta) return toast.error('Please fill video metadata first');

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    try {
      const result = await uploadData({
        path: ({ identityId }) => {
          if (!identityId) throw new Error('No identityId');
          return `private/${identityId}/videos/${Date.now()}-${file.name}`;
        },
        data: file,
        options: {
          contentType: file.type,
          onProgress: (progress) => {
            if (progress.totalBytes)
              setUploadProgress(
                Math.round(
                  (progress.transferredBytes / progress.totalBytes) * 80
                ) + 10
              );
          },
        },
      }).result;

      const thumb = await generateThumbnail();

      // TODO: send result.path, thumb, videoMeta to your backend API
      setSuccess('Video uploaded successfully — processing started.');
      toast.success('Video uploaded successfully.', { duration: 4000 });
      setTimeout(() => router.refresh(), 4500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openMetaDialog = () => setMetaDialogOpen(true);

  const handleMetaSubmit = (meta: VideoMeta) => {
    setVideoMeta(meta);
    setMetaDialogOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 150);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Interview Video</CardTitle>
        <CardDescription>
          Max size 5GB. Video will be processed automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={openMetaDialog} disabled={uploading}>
          {videoMeta?.name ? `Edit Metadata` : 'Add Video Metadata'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          disabled={uploading}
          onChange={handleFileChange}
          className="hidden"
        />

        {videoPreview && (
          <div>
            <Label>Preview</Label>
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              onLoadedMetadata={handleVideoLoaded}
              className="w-full max-h-64 rounded-lg border"
            />
          </div>
        )}

        {uploading && <Progress value={uploadProgress} />}
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading || !videoMeta}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </Button>
      </CardContent>

      <VideoMetaDialog
        open={metaDialogOpen}
        onOpenChange={setMetaDialogOpen}
        mode="create"
        initial={{
          name: videoMeta?.name || '',
          description: videoMeta?.description || '',
          visibility: videoMeta?.visibility || 'PRIVATE',
          speakers: videoMeta?.speakers || [{ name: '' }],
        }}
        onSubmit={handleMetaSubmit}
      />
    </Card>
  );
}
