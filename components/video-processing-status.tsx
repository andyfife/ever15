'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
}

interface VideoProcessingStatusProps {
  taskId: string;
  userMediaId: string;
}

export function VideoProcessingStatus({
  taskId,
  userMediaId,
}: VideoProcessingStatusProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskStatus, setTaskStatus] = useState<{
    task: { id: string; status: string; currentStep?: string; errorMessage?: string };
    video: { id: string; name: string; url?: string; thumbnailUrl?: string; moderationStatus: string; moderationNotes?: string };
    transcript?: { summary?: string; keywords?: string[] };
  } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [polling, setPolling] = useState(true);

  const steps: ProcessingStep[] = useMemo(() => [
    {
      name: 'UPLOAD_COMPLETE',
      status: 'completed',
      description: 'Video uploaded successfully',
    },
    {
      name: 'MODERATION',
      status: 'pending',
      description: 'Checking content for inappropriate material',
    },
    {
      name: 'AUDIO_EXTRACTION',
      status: 'pending',
      description: 'Extracting audio from video',
    },
    {
      name: 'TRANSCRIPTION',
      status: 'pending',
      description: 'Transcribing audio with speaker identification',
    },
    {
      name: 'SUMMARIZATION',
      status: 'pending',
      description: 'Generating AI summary and extracting keywords',
    },
  ], []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/video/status/${taskId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setTaskStatus(data);

      // Update current step index
      if (data.task.currentStep) {
        const stepIndex = steps.findIndex((s) => s.name === data.task.currentStep);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      }

      // Stop polling if completed or failed
      if (data.task.status === 'COMPLETED' || data.task.status === 'FAILED') {
        setPolling(false);
      }

      // Handle moderation rejection
      if (data.video.moderationStatus === 'REJECTED') {
        setPolling(false);
        setError(data.video.moderationNotes || 'Video rejected during moderation');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
      setError(errorMessage);
      setLoading(false);
    }
  }, [taskId, steps]);

  useEffect(() => {
    fetchStatus();

    // Poll every 5 seconds if still processing
    if (polling) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [polling, fetchStatus]);

  const getStepStatus = (index: number): 'pending' | 'processing' | 'completed' | 'failed' => {
    if (!taskStatus) return 'pending';

    if (taskStatus.task.status === 'FAILED') {
      if (index <= currentStepIndex) return 'failed';
      return 'pending';
    }

    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) {
      return taskStatus.task.status === 'PROCESSING' ? 'processing' : 'pending';
    }
    return 'pending';
  };

  const getProgressPercentage = () => {
    if (!taskStatus) return 0;
    if (taskStatus.task.status === 'COMPLETED') return 100;
    if (taskStatus.task.status === 'FAILED') return 0;

    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
  };

  const handleViewTranscript = () => {
    router.push(`/video/${userMediaId}/edit`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Loading status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !taskStatus) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              {taskStatus?.video?.name || 'Your video'}
            </CardDescription>
          </div>
          <Badge
            variant={
              taskStatus?.task?.status === 'COMPLETED'
                ? 'default'
                : taskStatus?.task?.status === 'FAILED'
                ? 'destructive'
                : 'secondary'
            }
          >
            {taskStatus?.task?.status || 'PENDING'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} />
        </div>

        {/* Video Preview */}
        {taskStatus?.video?.url && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Video</Label>
            {taskStatus.video.thumbnailUrl ? (
              <img
                src={taskStatus.video.thumbnailUrl}
                alt={taskStatus.video.name}
                className="w-full max-h-48 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎥</span>
              </div>
            )}
          </div>
        )}

        {/* Processing Steps */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Processing Steps</Label>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={step.name}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <div className="mt-0.5">
                  {status === 'completed' && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {status === 'processing' && (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  )}
                  {status === 'failed' && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✗</span>
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.description}</p>
                  {status === 'processing' && (
                    <p className="text-xs text-blue-600 mt-1">In progress...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {taskStatus?.task?.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-600 mt-1">
              {taskStatus.task.errorMessage}
            </p>
          </div>
        )}

        {/* Moderation Rejection */}
        {taskStatus?.video?.moderationStatus === 'REJECTED' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-900">Video Rejected</p>
            <p className="text-sm text-red-600 mt-1">
              {taskStatus.video.moderationNotes ||
                'This video was rejected during content moderation.'}
            </p>
          </div>
        )}

        {/* Success - Transcript Ready */}
        {taskStatus?.task?.status === 'COMPLETED' && taskStatus?.transcript && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-900">
                ✓ Processing Complete!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Your transcript is ready for review and editing.
              </p>
            </div>

            {/* Transcript Preview */}
            {taskStatus.transcript.summary && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Summary</Label>
                <p className="text-sm text-muted-foreground">
                  {taskStatus.transcript.summary.slice(0, 200)}
                  {taskStatus.transcript.summary.length > 200 && '...'}
                </p>
              </div>
            )}

            {/* Keywords */}
            {taskStatus.transcript.keywords && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {(taskStatus.transcript.keywords as string[]).slice(0, 5).map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleViewTranscript} className="w-full" size="lg">
              Edit Transcript & Publish
            </Button>
          </div>
        )}

        {/* Polling Indicator */}
        {polling && taskStatus?.task?.status === 'PROCESSING' && (
          <p className="text-xs text-center text-muted-foreground">
            Checking status every 5 seconds...
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
