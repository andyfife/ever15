import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';

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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoKey, fileName, fileSize, mimeType, duration, thumbnailUrl } =
      await req.json();

    if (!videoKey) {
      return NextResponse.json(
        { error: 'Video key is required' },
        { status: 400 }
      );
    }

    const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    const videoUrl = `https://${bucket}.s3.${process.env.NEXT_AWS_REGION || 'us-west-2'}.amazonaws.com/${videoKey}`;

    // Create processing task ONLY (UserMedia will be created after successful processing)
    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        type: 'VIDEO_PROCESSING',
        status: 'PENDING',
        payload: {
          // Store all video metadata in task payload
          userId: user.id,
          videoKey,
          videoUrl,
          bucket,
          fileName,
          fileSize: fileSize.toString(), // Convert to string for JSON
          mimeType,
          duration,
          thumbnailUrl,
          steps: [
            'UPLOAD_COMPLETE',
            'MODERATION',
            'AUDIO_EXTRACTION',
            'TRANSCRIPTION',
            'SUMMARIZATION',
          ],
          currentStep: 'UPLOAD_COMPLETE',
          // userMediaId will be set after processing completes
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Submit AWS Batch job
    let batchJobId: string | undefined;

    if (process.env.BATCH_JOB_QUEUE && process.env.BATCH_JOB_DEFINITION) {
      try {
        const command = new SubmitJobCommand({
          jobName: `video-processing-${task.id}-${Date.now()}`,
          jobQueue: process.env.BATCH_JOB_QUEUE,
          jobDefinition: process.env.BATCH_JOB_DEFINITION,
          containerOverrides: {
            environment: [
              { name: 'VIDEO_KEY', value: videoKey },
              { name: 'BUCKET', value: bucket || '' },
              { name: 'TASK_ID', value: task.id },
              { name: 'DATABASE_URL', value: process.env.DATABASE_URL || '' },
              { name: 'HF_TOKEN', value: process.env.HF_TOKEN || '' },
            ],
          },
        });

        const response = await batchClient.send(command);
        batchJobId = response.jobId;

        // Update task with batch job ID
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'PROCESSING',
            payload: {
              ...(task.payload as object),
              batchJobId: response.jobId,
            },
            updatedAt: new Date(),
          },
        });

        console.log(`✓ Batch job submitted: ${batchJobId}`);
      } catch (batchError) {
        console.error('Failed to submit Batch job:', batchError);
        // Continue without Batch - task will stay in PENDING
        // This allows testing without AWS Batch configured
      }
    } else {
      console.warn(
        'AWS Batch not configured (BATCH_JOB_QUEUE or BATCH_JOB_DEFINITION missing)'
      );
      // Task will remain in PENDING status for manual testing
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      batchJobId: batchJobId,
      message: 'Video processing started. Video will appear in your library after successful processing.',
    });
  } catch (error) {
    console.error('Error starting video processing:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to start processing';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
