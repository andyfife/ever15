# Quick Start Guide - AWS Batch Video Processing

Complete setup guide for deploying the video processing pipeline in **us-west-1**.

---

## Overview

This will set up:
- ✅ Docker image with pre-downloaded AI models (~20GB)
- ✅ ECR repository to store the image (~$2/month)
- ✅ AWS Batch infrastructure (on-demand GPU instances)
- ✅ S3 bucket for videos
- ✅ Processing pipeline: Upload → Moderate → Transcribe → Summarize

**Estimated setup time:** 1-2 hours (mostly waiting for builds)

---

## Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   # Use us-west-1 region
   ```

3. **Docker** installed and running
   ```bash
   docker --version
   # Should show Docker version 20.x or higher
   ```

4. **Hugging Face Account** (free)
   - Sign up at https://huggingface.co
   - Get access token: https://huggingface.co/settings/tokens
   - Accept Llama license: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct

---

## Step 1: Set Environment Variables

```bash
# Navigate to processing directory
cd backend/processing

# Set your Hugging Face token
export HF_TOKEN=hf_your_token_here

# Set AWS region (us-west-1)
export AWS_REGION=us-west-1

# Verify AWS credentials
aws sts get-caller-identity
```

---

## Step 2: Build and Push Docker Image

This downloads all AI models and builds a ~20GB Docker image.

**Time: 30-45 minutes** (download models + build + push to ECR)

```bash
# Run the build script
./build.sh
```

What happens:
1. Creates ECR repository if needed
2. Builds Docker image with:
   - NudeNet model (~200MB)
   - Llama 3.2 3B (~3GB)
   - WhisperX large-v2 (~3GB)
3. Pushes to ECR (~20GB upload - takes 10-20 min)

**Cost:** $2/month for ECR storage

---

## Step 3: Create S3 Bucket

```bash
# Create unique bucket name
export BUCKET_NAME="ever15-videos-$(date +%s)"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region us-west-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Set CORS for browser uploads
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3003", "https://*.amplifyapp.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file:///tmp/cors.json

echo "✓ S3 bucket created: $BUCKET_NAME"
```

**Save your bucket name** - you'll need it later!

---

## Step 4: Create IAM Roles

### 4a. Batch Job Role (for containers to access S3)

```bash
# Create trust policy
cat > /tmp/batch-job-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create role
aws iam create-role \
  --role-name VideoBatchJobRole \
  --assume-role-policy-document file:///tmp/batch-job-trust.json

# Attach S3 and CloudWatch permissions
cat > /tmp/batch-job-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::*/*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name VideoBatchJobRole \
  --policy-name S3AndLogsAccess \
  --policy-document file:///tmp/batch-job-policy.json

echo "✓ Batch Job Role created"
```

### 4b. Batch Execution Role (for pulling from ECR)

```bash
# Create role
aws iam create-role \
  --role-name VideoBatchExecutionRole \
  --assume-role-policy-document file:///tmp/batch-job-trust.json

# Attach ECR access
aws iam attach-role-policy \
  --role-name VideoBatchExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

echo "✓ Batch Execution Role created"
```

### 4c. Batch Service Role

```bash
cat > /tmp/batch-service-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "batch.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name AWSBatchServiceRole \
  --assume-role-policy-document file:///tmp/batch-service-trust.json

aws iam attach-role-policy \
  --role-name AWSBatchServiceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole

echo "✓ Batch Service Role created"
```

### 4d. EC2 Instance Profile

```bash
cat > /tmp/ec2-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name VideoBatchInstanceRole \
  --assume-role-policy-document file:///tmp/ec2-trust.json

aws iam attach-role-policy \
  --role-name VideoBatchInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name VideoBatchInstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name VideoBatchInstanceProfile \
  --role-name VideoBatchInstanceRole

echo "✓ EC2 Instance Profile created"
```

---

## Step 5: Setup VPC and Security Group

```bash
# Get default VPC (or create one)
export VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --region us-west-1 \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "Using VPC: $VPC_ID"

# Get subnets
export SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region us-west-1 \
  --query 'Subnets[*].SubnetId' \
  --output text | tr '\t' ',')

echo "Using subnets: $SUBNETS"

# Create security group
export SG_ID=$(aws ec2 create-security-group \
  --group-name video-batch-sg \
  --description "Video batch processing security group" \
  --vpc-id $VPC_ID \
  --region us-west-1 \
  --query 'GroupId' \
  --output text)

echo "✓ Security Group created: $SG_ID"
```

---

## Step 6: Create AWS Batch Compute Environment

```bash
# Get instance profile ARN
export INSTANCE_PROFILE_ARN=$(aws iam get-instance-profile \
  --instance-profile-name VideoBatchInstanceProfile \
  --query 'InstanceProfile.Arn' \
  --output text)

# Get service role ARN
export SERVICE_ROLE_ARN=$(aws iam get-role \
  --role-name AWSBatchServiceRole \
  --query 'Role.Arn' \
  --output text)

# Create compute environment
aws batch create-compute-environment \
  --compute-environment-name video-gpu-compute-env \
  --type MANAGED \
  --state ENABLED \
  --region us-west-1 \
  --compute-resources \
    type=SPOT,\
allocationStrategy=SPOT_CAPACITY_OPTIMIZED,\
minvCpus=0,\
maxvCpus=256,\
desiredvCpus=0,\
instanceTypes=g4dn.xlarge,g5.xlarge,\
subnets=$SUBNETS,\
securityGroupIds=$SG_ID,\
instanceRole=$INSTANCE_PROFILE_ARN \
  --service-role $SERVICE_ROLE_ARN

echo "✓ Compute environment created"
echo "Waiting for it to become VALID (this takes ~2 minutes)..."

aws batch wait compute-environment-valid \
  --compute-environments video-gpu-compute-env \
  --region us-west-1

echo "✓ Compute environment is VALID"
```

---

## Step 7: Create Job Queue

```bash
aws batch create-job-queue \
  --job-queue-name video-processing-queue \
  --state ENABLED \
  --priority 1 \
  --region us-west-1 \
  --compute-environment-order order=1,computeEnvironment=video-gpu-compute-env

echo "✓ Job queue created: video-processing-queue"
```

---

## Step 8: Create Job Definition

```bash
# Get your database URL
echo "Enter your DATABASE_URL:"
read DATABASE_URL

# Get role ARNs
export JOB_ROLE_ARN=$(aws iam get-role \
  --role-name VideoBatchJobRole \
  --query 'Role.Arn' \
  --output text)

export EXECUTION_ROLE_ARN=$(aws iam get-role \
  --role-name VideoBatchExecutionRole \
  --query 'Role.Arn' \
  --output text)

# Get ECR image URI
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/video-processor:latest"

# Create log group
aws logs create-log-group \
  --log-group-name /aws/batch/video-processor \
  --region us-west-1 || true

# Register job definition
cat > /tmp/job-def.json << EOF
{
  "jobDefinitionName": "video-processor",
  "type": "container",
  "platformCapabilities": ["EC2"],
  "containerProperties": {
    "image": "$ECR_IMAGE",
    "vcpus": 4,
    "memory": 16384,
    "jobRoleArn": "$JOB_ROLE_ARN",
    "executionRoleArn": "$EXECUTION_ROLE_ARN",
    "resourceRequirements": [{"type": "GPU", "value": "1"}],
    "environment": [
      {"name": "DATABASE_URL", "value": "$DATABASE_URL"},
      {"name": "HF_TOKEN", "value": "$HF_TOKEN"},
      {"name": "AWS_DEFAULT_REGION", "value": "us-west-1"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/aws/batch/video-processor",
        "awslogs-region": "us-west-1",
        "awslogs-stream-prefix": "video-processing"
      }
    }
  },
  "retryStrategy": {"attempts": 2},
  "timeout": {"attemptDurationSeconds": 3600}
}
EOF

aws batch register-job-definition \
  --cli-input-json file:///tmp/job-def.json \
  --region us-west-1

echo "✓ Job definition registered: video-processor"
```

---

## Step 9: Update Next.js Environment Variables

Add to `.env.local`:

```bash
# AWS Configuration
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# S3 Bucket (use your bucket name from Step 3)
S3_BUCKET=ever15-videos-1234567890

# AWS Batch
BATCH_JOB_QUEUE=video-processing-queue
BATCH_JOB_DEFINITION=video-processor

# Database (you already have this)
DATABASE_URL=postgresql://user:pass@typto.io:5433/db

# Hugging Face
HF_TOKEN=hf_your_token_here
```

---

## Step 10: Test!

### Test 1: Manual Job Submission

```bash
aws batch submit-job \
  --job-name test-job \
  --job-queue video-processing-queue \
  --job-definition video-processor \
  --region us-west-1 \
  --container-overrides '{
    "environment": [
      {"name": "VIDEO_KEY", "value": "test/video.mp4"},
      {"name": "BUCKET", "value": "'$BUCKET_NAME'"},
      {"name": "USER_MEDIA_ID", "value": "test-123"},
      {"name": "TASK_ID", "value": "test-456"}
    ]
  }'

# Get job ID and check status
aws batch describe-jobs --jobs <JOB_ID> --region us-west-1
```

### Test 2: Upload Real Video

1. Start Next.js: `npm run dev`
2. Go to http://localhost:3003/videos/upload
3. Upload a short video (< 1 minute for testing)
4. Watch the processing status!

---

## Monitoring

### View Logs

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /aws/batch/video-processor \
  --region us-west-1 \
  --order-by LastEventTime \
  --descending \
  --max-items 5

# View specific stream
aws logs tail /aws/batch/video-processor --follow --region us-west-1
```

### Check Jobs

```bash
# Running jobs
aws batch list-jobs \
  --job-queue video-processing-queue \
  --job-status RUNNING \
  --region us-west-1

# Failed jobs
aws batch list-jobs \
  --job-queue video-processing-queue \
  --job-status FAILED \
  --region us-west-1
```

---

## Cost Summary

**Setup (one-time):** Free

**Monthly costs:**
- ECR storage (20GB image): **$2**
- 100 videos/month:
  - GPU processing: **$4**
  - S3 storage: **$5**
  - **Total: ~$11/month**

---

## Next Steps

1. ✅ Complete this setup
2. ✅ Test with sample video
3. ⏭️ Enable AWS Batch integration in Next.js API
4. ⏭️ Build transcript editing page
5. ⏭️ Deploy to production (Amplify)

---

## Troubleshooting

**"Docker build fails downloading models"**
- Check HF_TOKEN is set correctly
- Verify you accepted Llama license

**"Job fails with Cannot pull container"**
- Check execution role has ECR permissions
- Verify image exists in ECR

**"Job times out"**
- Video might be too long
- Increase timeout in job definition

**"No compute resources available"**
- SPOT instances might be unavailable
- Change to ON_DEMAND in compute environment
