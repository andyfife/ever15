// app/api/video/start-processing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';
import amplifyconfig from '@/amplify_outputs.json';

const prisma = new PrismaClient();

const bucket = amplifyconfig.storage.bucket_name;
const region = amplifyconfig.storage.aws_region || 'us-west-2';

const batchClient = new BatchClient({
  region,
  // Your Next.js server runs with an IAM role or EC2 instance profile in production
  // → no credentials needed. In local dev, fall back to env vars if you want.
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

    // DO NOT create a public videoUrl — private files have no public URL
    // Your Batch job will download using bucket + key directly (via IAM role)

    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        type: 'VIDEO_PROCESSING',
        status: 'PENDING',
        payload: {
          userId: user.id,
          videoKey, // e.g. private/us-west-1:.../videos/xxx.mp4
          bucket, // ← critical for Batch job
          fileName,
          fileSize: fileSize.toString(),
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
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    let batchJobId: string | undefined;

    if (process.env.BATCH_JOB_QUEUE && process.env.BATCH_JOB_DEFINITION) {
      try {
        const command = new SubmitJobCommand({
          jobName: `video-processing-${task.id}`,
          jobQueue: process.env.BATCH_JOB_QUEUE,
          jobDefinition: process.env.BATCH_JOB_DEFINITION,
          containerOverrides: {
            environment: [
              { name: 'VIDEO_KEY', value: videoKey },
              { name: 'BUCKET', value: bucket },
              { name: 'TASK_ID', value: task.id },
              { name: 'DATABASE_URL', value: process.env.DATABASE_URL || '' },
              { name: 'HF_TOKEN', value: process.env.HF_TOKEN || '' },
            ],
          },
        });

        const response = await batchClient.send(command);
        batchJobId = response.jobId;

        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'PROCESSING',
            payload: {
              ...(task.payload as object),
              batchJobId,
            },
            updatedAt: new Date(),
          },
        });

        console.log(`✓ Batch job submitted: ${batchJobId}`);
      } catch (batchError) {
        console.error('Failed to submit Batch job:', batchError);
      }
    } else {
      console.warn('AWS Batch not configured – task stays PENDING');
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      batchJobId,
      message: 'Video processing started successfully!',
    });
  } catch (error) {
    console.error('Error starting video processing:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
