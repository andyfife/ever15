import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { Task, Media, Transcript, User } from '@/lib/db';
import { BatchClient, DescribeJobsCommand } from '@aws-sdk/client-batch';

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

    // Get all video processing tasks
    const tasksResp = await Task.query
      .byType({ type: 'VIDEO_PROCESSING' })
      .go();

    // Sort by createdAt descending and take 50
    const tasks = tasksResp.data
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 50);

    // Get all mediaIds from tasks
    const mediaIds = tasks
      .map((task) => {
        const payload = task.payload as Record<string, unknown>;
        return payload.mediaId as string;
      })
      .filter(Boolean);

    // Fetch Media records
    const mediaPromises = mediaIds.map((mediaId) =>
      Media.query.byMediaId({ mediaId }).go()
    );
    const mediaResults = await Promise.all(mediaPromises);

    // Flatten and create a map
    const mediaRecords = mediaResults
      .map((r) => r.data?.[0])
      .filter(Boolean) as any[];
    const mediaMap = new Map(
      mediaRecords.map((m) => [m.mediaId, m])
    );

    // Get user IDs from media records
    const userIds = [...new Set(mediaRecords.map((m) => m.userId))];

    // Fetch users
    const userPromises = userIds.map((userId) =>
      User.get({ cognitoSub: userId }).go()
    );
    const userResults = await Promise.all(userPromises);
    const userMap = new Map(
      userResults
        .filter((r) => r.data)
        .map((r) => [r.data!.cognitoSub, r.data])
    );

    // Fetch transcripts for all media
    const transcriptPromises = mediaIds.map((mediaId) =>
      Transcript.query
        .byMedia({ mediaId })
        .where(({ isCurrent }, { eq }) => eq(isCurrent, true))
        .go()
    );
    const transcriptResults = await Promise.all(transcriptPromises);
    const transcriptMap = new Map(
      transcriptResults
        .filter((r) => r.data?.[0])
        .map((r) => [r.data![0].mediaId, r.data![0]])
    );

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
      const mediaId = payload.mediaId as string;
      const batchJobId = payload.batchJobId as string | undefined;
      const media = mediaMap.get(mediaId);
      const batchStatus = batchJobId ? batchJobStatuses.get(batchJobId) : null;

      const mediaUser = media ? userMap.get(media.userId) : null;
      const transcript = media ? transcriptMap.get(media.mediaId) : null;

      return {
        taskId: task.taskId,
        taskStatus: task.status,
        taskCreatedAt: task.createdAt,
        errorMessage: task.errorMessage,
        currentStep: payload.currentStep,
        steps: payload.steps,
        batchJobId: batchJobId,
        batchStatus: batchStatus,
        video: media
          ? {
              id: media.mediaId,
              name: media.name,
              url: media.url,
              thumbnailUrl: media.thumbnailUrl,
              duration: media.duration,
              moderationStatus: media.moderationStatus,
              visibility: media.visibility,
              approvalStatus: media.approvalStatus,
              fileSize: media.fileSize?.toString(),
              mimeType: media.mimeType,
              user: mediaUser
                ? {
                    id: mediaUser.cognitoSub,
                    name:
                      [mediaUser.firstName, mediaUser.lastName]
                        .filter(Boolean)
                        .join(' ') || null,
                    email_address: mediaUser.email,
                  }
                : null,
              hasTranscript: !!transcript,
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
