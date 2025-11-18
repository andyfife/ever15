#!/bin/bash
# System Status Check for Video Processing Pipeline

echo "=========================================="
echo "VIDEO PROCESSING PIPELINE STATUS CHECK"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Next.js Server
echo "1. Next.js Development Server"
echo "------------------------------"
if curl -s http://localhost:3001/videos/upload > /dev/null; then
    echo -e "${GREEN}✓${NC} Server running on http://localhost:3001"
else
    echo -e "${RED}✗${NC} Server not accessible"
fi
echo ""

# 2. Check ECR Image
echo "2. Docker Image in ECR"
echo "------------------------------"
IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name video-processor \
    --region us-west-1 \
    --query 'imageDetails[0].imageTags[0]' \
    --output text 2>/dev/null)

if [ "$IMAGE_EXISTS" == "latest" ]; then
    IMAGE_SIZE=$(aws ecr describe-images \
        --repository-name video-processor \
        --region us-west-1 \
        --query 'imageDetails[0].imageSizeInBytes' \
        --output text)
    SIZE_GB=$(echo "scale=2; $IMAGE_SIZE / 1024 / 1024 / 1024" | bc)
    echo -e "${GREEN}✓${NC} Image exists: video-processor:latest (${SIZE_GB}GB)"
else
    echo -e "${RED}✗${NC} Image not found in ECR"
fi
echo ""

# 3. Check S3 Bucket
echo "3. S3 Bucket"
echo "------------------------------"
BUCKET_NAME=$(grep "^S3_BUCKET=" .env.local | cut -d'=' -f2)
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region us-west-1 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Bucket exists: $BUCKET_NAME"
else
    echo -e "${RED}✗${NC} Bucket not accessible: $BUCKET_NAME"
fi
echo ""

# 4. Check IAM Roles
echo "4. IAM Roles"
echo "------------------------------"
for role in VideoBatchJobRole VideoBatchExecutionRole AWSBatchServiceRole VideoBatchInstanceRole; do
    if aws iam get-role --role-name $role &>/dev/null; then
        echo -e "${GREEN}✓${NC} $role exists"
    else
        echo -e "${RED}✗${NC} $role missing"
    fi
done
echo ""

# 5. Check Batch Compute Environment
echo "5. AWS Batch Compute Environment"
echo "------------------------------"
COMPUTE_STATUS=$(aws batch describe-compute-environments \
    --compute-environments video-gpu-compute-env \
    --region us-west-1 \
    --query 'computeEnvironments[0].status' \
    --output text 2>/dev/null)

if [ "$COMPUTE_STATUS" == "VALID" ]; then
    echo -e "${GREEN}✓${NC} Compute environment: video-gpu-compute-env (VALID)"
else
    echo -e "${RED}✗${NC} Compute environment status: $COMPUTE_STATUS"
fi
echo ""

# 6. Check Job Queue
echo "6. AWS Batch Job Queue"
echo "------------------------------"
QUEUE_STATUS=$(aws batch describe-job-queues \
    --job-queues video-processing-queue \
    --region us-west-1 \
    --query 'jobQueues[0].state' \
    --output text 2>/dev/null)

if [ "$QUEUE_STATUS" == "ENABLED" ]; then
    echo -e "${GREEN}✓${NC} Job queue: video-processing-queue (ENABLED)"
else
    echo -e "${RED}✗${NC} Job queue status: $QUEUE_STATUS"
fi
echo ""

# 7. Check Job Definition
echo "7. AWS Batch Job Definition"
echo "------------------------------"
JOB_DEF=$(aws batch describe-job-definitions \
    --job-definitions video-processor \
    --status ACTIVE \
    --region us-west-1 \
    --query 'jobDefinitions[0].revision' \
    --output text 2>/dev/null)

if [ ! -z "$JOB_DEF" ] && [ "$JOB_DEF" != "None" ]; then
    echo -e "${GREEN}✓${NC} Job definition: video-processor:$JOB_DEF"
else
    echo -e "${RED}✗${NC} Job definition not found"
fi
echo ""

# 8. Check Running Jobs
echo "8. Current Batch Jobs"
echo "------------------------------"
RUNNING_JOBS=$(aws batch list-jobs \
    --job-queue video-processing-queue \
    --job-status RUNNING \
    --region us-west-1 \
    --query 'jobSummaryList | length(@)' \
    --output text 2>/dev/null)

SUBMITTED_JOBS=$(aws batch list-jobs \
    --job-queue video-processing-queue \
    --job-status SUBMITTED \
    --region us-west-1 \
    --query 'jobSummaryList | length(@)' \
    --output text 2>/dev/null)

PENDING_JOBS=$(aws batch list-jobs \
    --job-queue video-processing-queue \
    --job-status PENDING \
    --region us-west-1 \
    --query 'jobSummaryList | length(@)' \
    --output text 2>/dev/null)

echo "  Running: $RUNNING_JOBS"
echo "  Submitted: $SUBMITTED_JOBS"
echo "  Pending: $PENDING_JOBS"

if [ "$RUNNING_JOBS" -gt 0 ]; then
    echo ""
    echo "  Active job details:"
    aws batch list-jobs \
        --job-queue video-processing-queue \
        --job-status RUNNING \
        --region us-west-1 \
        --query 'jobSummaryList[*].[jobName,jobId,status]' \
        --output table
fi
echo ""

# 9. Check Environment Variables
echo "9. Environment Variables"
echo "------------------------------"
if [ -f ".env.local" ]; then
    if grep -q "BATCH_JOB_QUEUE=video-processing-queue" .env.local; then
        echo -e "${GREEN}✓${NC} BATCH_JOB_QUEUE configured"
    else
        echo -e "${RED}✗${NC} BATCH_JOB_QUEUE not configured"
    fi

    if grep -q "BATCH_JOB_DEFINITION=video-processor" .env.local; then
        echo -e "${GREEN}✓${NC} BATCH_JOB_DEFINITION configured"
    else
        echo -e "${RED}✗${NC} BATCH_JOB_DEFINITION not configured"
    fi

    if grep -q "^HF_TOKEN=" .env.local; then
        echo -e "${GREEN}✓${NC} HF_TOKEN configured"
    else
        echo -e "${RED}✗${NC} HF_TOKEN not configured"
    fi
else
    echo -e "${RED}✗${NC} .env.local file not found"
fi
echo ""

# 10. Check Database Connection
echo "10. Database Connection"
echo "------------------------------"
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
if [ ! -z "$DATABASE_URL" ]; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configured in .env"
else
    echo -e "${RED}✗${NC} DATABASE_URL not configured"
fi
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to http://localhost:3001/videos/upload"
echo "2. Upload a test video"
echo "3. Monitor progress with:"
echo "   - Web UI (automatic updates)"
echo "   - Run this script again to see batch jobs"
echo "   - View logs: aws logs tail /aws/batch/video-processor --follow --region us-west-1"
echo ""
