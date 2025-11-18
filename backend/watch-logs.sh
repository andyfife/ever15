#!/bin/bash
# Watch CloudWatch logs for the most recent running job

REGION="us-west-2"
QUEUE="video-processing-queue-usw2"

echo "Looking for running jobs..."

# Get the most recent RUNNING job
JOB_ID=$(aws batch list-jobs \
  --job-queue $QUEUE \
  --job-status RUNNING \
  --region $REGION \
  --query 'jobSummaryList[0].jobId' \
  --output text)

if [ "$JOB_ID" = "None" ] || [ -z "$JOB_ID" ]; then
  echo "No running jobs found. Checking STARTING jobs..."

  JOB_ID=$(aws batch list-jobs \
    --job-queue $QUEUE \
    --job-status STARTING \
    --region $REGION \
    --query 'jobSummaryList[0].jobId' \
    --output text)
fi

if [ "$JOB_ID" = "None" ] || [ -z "$JOB_ID" ]; then
  echo "No jobs currently running or starting."
  echo ""
  echo "Recent jobs:"
  aws batch list-jobs \
    --job-queue $QUEUE \
    --region $REGION \
    --max-results 5 \
    --query 'jobSummaryList[*].[jobName,status,createdAt]' \
    --output table
  exit 1
fi

echo "Found job: $JOB_ID"
echo "Fetching log stream..."

# Get log stream name
LOG_STREAM=$(aws batch describe-jobs \
  --jobs $JOB_ID \
  --region $REGION \
  --query 'jobs[0].container.logStreamName' \
  --output text)

if [ "$LOG_STREAM" = "None" ] || [ -z "$LOG_STREAM" ]; then
  echo "Log stream not available yet. Job may still be starting..."
  echo "Try again in 30 seconds."
  exit 1
fi

echo "Tailing logs from: $LOG_STREAM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tail the logs
aws logs tail /aws/batch/job \
  --follow \
  --region $REGION \
  --log-stream-names $LOG_STREAM
