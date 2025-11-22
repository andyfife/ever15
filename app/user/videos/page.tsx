'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
type Video = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  moderationStatus: string;
  approvalStatus: string;
  visibility: string;
  createdAt: string;
  hasTranscript: boolean;
};

export default function MyVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/user/videos');
      const data = await response.json();
      setVideos(data.videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      PENDING: 'secondary',
      APPROVED: 'outline',
      REJECTED: 'destructive',
      DRAFT: 'secondary',
    };

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      PRIVATE: 'secondary',
      FRIENDS: 'default',
      PUBLIC: 'outline',
    };

    return (
      <Badge variant={variants[visibility] || 'secondary'}>{visibility}</Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black">
        {/* Hero Image */}
        <div className="mt-8 flex justify-center w-full">
          <div className="relative w-full max-w-5xl aspect-video">
            <Image
              src="/images/evergreen4.png"
              alt="Evergreen Home"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Text section */}
        <div className="max-w-4xl mx-auto px-6 mt-12 text-left space-y-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center">
            Preserve and share your stories for generations.
          </h1>

          {/* Step 1 */}

          {/* Step 3 */}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage your uploaded oral history videos
          </p>
        </div>
        <Button onClick={() => router.push('/videos/upload')}>
          Upload New Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {videos.filter((v) => v.moderationStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              With Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {videos.filter((v) => v.hasTranscript).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.filter((v) => v.visibility === 'PUBLIC').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      {loading && <div className="text-center py-8">Loading...</div>}

      {!loading && videos.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-muted-foreground mb-4">
              <p className="text-lg mb-2">No videos yet</p>
              <p className="text-sm">
                Upload your first oral history video to get started!
              </p>
            </div>
            <Button onClick={() => router.push('/videos/upload')}>
              Upload Video
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && videos.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              {video.thumbnailUrl ? (
                <div className="aspect-video bg-muted">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <span className="text-4xl">🎥</span>
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 truncate">{video.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {getStatusBadge(video.moderationStatus)}
                  {getVisibilityBadge(video.visibility)}
                  {video.hasTranscript && (
                    <Badge variant="outline">Transcript</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mb-3">
                  <p>Duration: {formatDuration(video.duration)}</p>
                  <p>
                    Uploaded: {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/video/${video.id}`)}
                  >
                    View
                  </Button>
                  {video.hasTranscript && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/video/${video.id}/edit`)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
