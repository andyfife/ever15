import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { BatchClient, ListJobsCommand, DescribeJobsCommand } from '@aws-sdk/client-batch';

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

const JOB_QUEUE = process.env.BATCH_JOB_QUEUE || 'video-processing-queue-usw2';
const REGION = process.env.NEXT_AWS_REGION || 'us-west-2';

export async function GET(req: NextRequest) {
  try {
    // Check authentication - TODO: Add admin check
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allJobs: any[] = [];
    const statuses = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING', 'SUCCEEDED', 'FAILED'];

    // Fetch jobs from all statuses
    for (const status of statuses) {
      try {
        const command = new ListJobsCommand({
          jobQueue: JOB_QUEUE,
          jobStatus: status as any,
          maxResults: 100,
        });

        const response = await batchClient.send(command);

        if (response.jobSummaryList && response.jobSummaryList.length > 0) {
          // Get detailed info for these jobs
          const jobIds = response.jobSummaryList.map(j => j.jobId!);

          const describeCommand = new DescribeJobsCommand({
            jobs: jobIds,
          });

          const detailedResponse = await batchClient.send(describeCommand);

          if (detailedResponse.jobs) {
            detailedResponse.jobs.forEach(job => {
              allJobs.push({
                jobId: job.jobId,
                jobName: job.jobName,
                status: job.status,
                statusReason: job.statusReason,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                stoppedAt: job.stoppedAt,
                jobDefinition: job.jobDefinition,
                logStreamName: job.container?.logStreamName,
                vcpus: job.container?.vcpus,
                memory: job.container?.memory,
                exitCode: job.container?.exitCode,
              });
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching ${status} jobs:`, err);
      }
    }

    // Sort by creation time (newest first)
    allJobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({
      jobs: allJobs,
      total: allJobs.length,
      region: REGION,
      queue: JOB_QUEUE,
    });
  } catch (error) {
    console.error('Error fetching batch jobs:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch batch jobs';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
