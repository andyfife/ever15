import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';
import { BatchClient, DescribeJobsCommand } from '@aws-sdk/client-batch';

const prisma = new PrismaClient();

// Initialize AWS Batch client
const batchClient = new BatchClient({
  region: process.env.NEXT_AWS_REGION || 'us-west-2',
  credentials:
    process.env.NEXT_AWS_ACCESS_KEY_ID && process.env.NEXT_AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication - TODO: Add admin check
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all video processing tasks with UserMedia
    const tasks = await prisma.task.findMany({
      where: {
        type: 'VIDEO_PROCESSING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50
    });

    // Get all UserMedia IDs from tasks
    const userMediaIds = tasks
      .map((task) => {
        const payload = task.payload as Record<string, unknown>;
        return payload.userMediaId as string;
      })
      .filter(Boolean);

    // Fetch UserMedia records
    const userMediaRecords = await prisma.userMedia.findMany({
      where: {
        id: { in: userMediaIds },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email_address: true,
          },
        },
        UserMediaTranscript: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    // Create a map for quick lookup
    const userMediaMap = new Map(userMediaRecords.map((um) => [um.id, um]));

    // Get AWS Batch job statuses
    const batchJobIds = tasks
      .map((task) => {
        const payload = task.payload as Record<string, unknown>;
        return payload.batchJobId as string | undefined;
      })
      .filter(Boolean) as string[];

    let batchJobStatuses = new Map<string, any>();

    if (batchJobIds.length > 0) {
      try {
        const command = new DescribeJobsCommand({
          jobs: batchJobIds.slice(0, 100), // AWS limit
        });
        const response = await batchClient.send(command);

        if (response.jobs) {
          response.jobs.forEach((job) => {
            if (job.jobId) {
              batchJobStatuses.set(job.jobId, {
                status: job.status,
                statusReason: job.statusReason,
                startedAt: job.startedAt,
                stoppedAt: job.stoppedAt,
                logStreamName: job.container?.logStreamName,
              });
            }
          });
        }
      } catch (batchError) {
        console.error('Failed to fetch batch job statuses:', batchError);
        // Continue without batch status
      }
    }

    // Combine data
    const videos = tasks.map((task) => {
      const payload = task.payload as Record<string, unknown>;
      const userMediaId = payload.userMediaId as string;
      const batchJobId = payload.batchJobId as string | undefined;
      const userMedia = userMediaMap.get(userMediaId);
      const batchStatus = batchJobId ? batchJobStatuses.get(batchJobId) : null;

      return {
        taskId: task.id,
        taskStatus: task.status,
        taskCreatedAt: task.createdAt,
        taskUpdatedAt: task.updatedAt,
        errorMessage: task.errorMessage,
        currentStep: payload.currentStep,
        steps: payload.steps,
        batchJobId: batchJobId,
        batchStatus: batchStatus,
        video: userMedia
          ? {
              id: userMedia.id,
              name: userMedia.name,
              url: userMedia.url,
              thumbnailUrl: userMedia.thumbnailUrl,
              duration: userMedia.duration,
              moderationStatus: userMedia.moderationStatus,
              moderationNotes: userMedia.moderationNotes,
              visibility: userMedia.visibility,
              approvalStatus: userMedia.approvalStatus,
              fileSize: userMedia.fileSize?.toString(),
              mimeType: userMedia.mimeType,
              user: userMedia.User,
              hasTranscript: userMedia.UserMediaTranscript.length > 0,
            }
          : null,
      };
    });

    return NextResponse.json({
      videos,
      total: videos.length,
      region: process.env.NEXT_AWS_REGION || 'us-west-2',
    });
  } catch (error) {
    console.error('Error fetching admin videos:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch videos';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
