# Production Deployment Checklist

This is a step-by-step guide to deploy the video processing pipeline to your production Amplify app.

---

## Prerequisites

- [ ] AWS CLI configured with production credentials
- [ ] Docker Desktop installed and running
- [ ] Hugging Face account with token
- [ ] Production database (PostgreSQL)
- [ ] Production Amplify app created

---

## Part 1: Environment Setup (15 min)

### 1.1 Get Required Tokens & Credentials

- [ ] **Hugging Face Token**
  - Go to https://huggingface.co/settings/tokens
  - Create new token (read access)
  - Accept Llama 3.2 license: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct
  - Save as: `HF_TOKEN=hf_xxxxx`

- [ ] **AWS Credentials**
  - Get AWS Access Key ID and Secret Access Key
  - Ensure user has these permissions:
    - S3 (create buckets, upload/download)
    - ECR (create repos, push images)
    - IAM (create roles, attach policies)
    - Batch (create compute environments, job queues, job definitions)
    - VPC (if creating new security groups)

### 1.2 Database Setup

- [ ] Create production PostgreSQL database (or use existing)
- [ ] Get `DATABASE_URL` connection string
- [ ] Test connection: `psql $DATABASE_URL`

---

## Part 2: Code & Dependencies (10 min)

### 2.1 Install NPM Packages

```bash
cd your-production-app

# AWS SDK packages
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-batch

# UI components (if not already installed)
npm install @radix-ui/react-progress
```

### 2.2 Copy Files from Test App

**Copy these complete files:**

- [ ] `app/videos/upload/page.tsx`
- [ ] `components/video-upload.tsx`
- [ ] `components/video-processing-status.tsx`
- [ ] `app/api/video/upload-url/route.ts`
- [ ] `app/api/video/start-processing/route.ts`
- [ ] `app/api/video/status/[taskId]/route.ts`
- [ ] `components/ui/progress.tsx`
- [ ] `backend/processing/Dockerfile`
- [ ] `backend/processing/process_video.py`
- [ ] `backend/processing/requirements.txt`
- [ ] `backend/processing/build.sh`

**Update these files with schema changes:**

- [ ] `prisma/schema.prisma` - Add these fields to `UserMediaTranscript` model:
  ```prisma
  summary       String?
  keywords      Json?
  rawSegments   Json?
  ```

### 2.3 Update Prisma Schema

```bash
# Push schema changes to production database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## Part 3: AWS Infrastructure (60-90 min)

### 3.1 Create S3 Bucket for Videos (5 min)

```bash
# Set your production region
REGION=us-west-1

# Create unique bucket name
BUCKET_NAME="your-app-videos-prod-$(date +%s)"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Set CORS configuration
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file:///tmp/cors.json \
  --region $REGION
```

**Save these values:**
- [ ] `S3_BUCKET=$BUCKET_NAME`
- [ ] `AWS_REGION=$REGION`

### 3.2 Add S3 Permissions to IAM User (5 min)

```bash
# Replace with your production IAM username
IAM_USER=your-production-user

cat > /tmp/s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name $IAM_USER \
  --policy-name S3VideoUploadPolicy \
  --policy-document file:///tmp/s3-policy.json
```

### 3.3 Build & Push Docker Image to ECR (30-45 min)

```bash
cd backend/processing

# Set your Hugging Face token
export HF_TOKEN=hf_your_token_here

# Run build script (this takes 30-45 minutes)
./build.sh
```

**This will:**
- Create ECR repository: `video-processor`
- Build Docker image (~20GB) with all AI models baked in
- Push to ECR in your production region

**Save these values:**
- [ ] `ECR_REPOSITORY_URI=<account-id>.dkr.ecr.<region>.amazonaws.com/video-processor`

### 3.4 Create IAM Execution Role for Batch Jobs (5 min)

```bash
# Create trust policy
cat > /tmp/batch-execution-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name BatchJobExecutionRole \
  --assume-role-policy-document file:///tmp/batch-execution-trust.json

# Attach AWS managed policies
aws iam attach-role-policy \
  --role-name BatchJobExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Attach ECR pull permissions
aws iam attach-role-policy \
  --role-name BatchJobExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Add S3 access policy
cat > /tmp/batch-s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name BatchJobExecutionRole \
  --policy-name S3Access \
  --policy-document file:///tmp/batch-s3-policy.json

# Get the role ARN
aws iam get-role --role-name BatchJobExecutionRole --query 'Role.Arn' --output text
```

**Save this value:**
- [ ] `BATCH_EXECUTION_ROLE_ARN=arn:aws:iam::<account-id>:role/BatchJobExecutionRole`

### 3.5 Create IAM Service Role for AWS Batch (5 min)

```bash
# Create trust policy
cat > /tmp/batch-service-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "batch.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name AWSBatchServiceRole \
  --assume-role-policy-document file:///tmp/batch-service-trust.json

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name AWSBatchServiceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole

# Get the role ARN
aws iam get-role --role-name AWSBatchServiceRole --query 'Role.Arn' --output text
```

**Save this value:**
- [ ] `BATCH_SERVICE_ROLE_ARN=arn:aws:iam::<account-id>:role/AWSBatchServiceRole`

### 3.6 Get VPC & Subnet Information (5 min)

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text \
  --region $REGION)

echo "VPC ID: $VPC_ID"

# Get subnet IDs (you need at least 2 for Batch)
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone]' \
  --output table \
  --region $REGION

# Pick 2+ subnet IDs from the output
SUBNET_IDS="subnet-xxxxx,subnet-yyyyy"
```

**Save these values:**
- [ ] `VPC_ID=vpc-xxxxx`
- [ ] `SUBNET_IDS=subnet-xxxxx,subnet-yyyyy` (comma-separated, no spaces)

### 3.7 Create Security Group for Batch (5 min)

```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name video-processing-batch-sg \
  --description "Security group for video processing Batch jobs" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Allow HTTPS outbound (for downloading from S3, ECR, Hugging Face)
aws ec2 authorize-security-group-egress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $REGION
```

**Save this value:**
- [ ] `SECURITY_GROUP_ID=$SG_ID`

### 3.8 Create Batch Compute Environment (5 min)

```bash
aws batch create-compute-environment \
  --compute-environment-name video-processing-gpu \
  --type MANAGED \
  --state ENABLED \
  --service-role $BATCH_SERVICE_ROLE_ARN \
  --compute-resources type=SPOT,\
minvCpus=0,\
maxvCpus=4,\
desiredvCpus=0,\
instanceTypes=g4dn.xlarge,\
subnets=$SUBNET_IDS,\
securityGroupIds=$SG_ID,\
instanceRole=arn:aws:iam::<account-id>:instance-profile/ecsInstanceRole,\
bidPercentage=70,\
spotIamFleetRole=arn:aws:iam::<account-id>:role/aws-ec2-spot-fleet-tagging-role \
  --region $REGION

# Wait for it to be VALID
aws batch describe-compute-environments \
  --compute-environments video-processing-gpu \
  --region $REGION \
  --query 'computeEnvironments[0].status'
```

**Note:** If you don't have `ecsInstanceRole`, create it:
```bash
aws iam create-role \
  --role-name ecsInstanceRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy \
  --role-name ecsInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

aws iam create-instance-profile --instance-profile-name ecsInstanceRole
aws iam add-role-to-instance-profile --instance-profile-name ecsInstanceRole --role-name ecsInstanceRole
```

### 3.9 Create Batch Job Queue (2 min)

```bash
aws batch create-job-queue \
  --job-queue-name video-processing-queue \
  --state ENABLED \
  --priority 1 \
  --compute-environment-order order=1,computeEnvironment=video-processing-gpu \
  --region $REGION

# Wait for it to be VALID
aws batch describe-job-queues \
  --job-queues video-processing-queue \
  --region $REGION \
  --query 'jobQueues[0].status'
```

**Save this value:**
- [ ] `BATCH_JOB_QUEUE=video-processing-queue`

### 3.10 Register Batch Job Definition (5 min)

```bash
# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > /tmp/job-definition.json << EOF
{
  "jobDefinitionName": "video-processor",
  "type": "container",
  "platformCapabilities": ["EC2"],
  "containerProperties": {
    "image": "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/video-processor:latest",
    "vcpus": 4,
    "memory": 16384,
    "jobRoleArn": "$BATCH_EXECUTION_ROLE_ARN",
    "executionRoleArn": "$BATCH_EXECUTION_ROLE_ARN",
    "resourceRequirements": [
      {
        "type": "GPU",
        "value": "1"
      }
    ],
    "environment": [
      {
        "name": "AWS_DEFAULT_REGION",
        "value": "$REGION"
      }
    ]
  },
  "retryStrategy": {
    "attempts": 2
  },
  "timeout": {
    "attemptDurationSeconds": 3600
  }
}
EOF

aws batch register-job-definition \
  --cli-input-json file:///tmp/job-definition.json \
  --region $REGION
```

**Save this value:**
- [ ] `BATCH_JOB_DEFINITION=video-processor`

---

## Part 4: Environment Variables (5 min)

### 4.1 Update Production `.env.local`

Create/update `.env.local` in your production app:

```bash
# AWS Configuration
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-production-key
AWS_SECRET_ACCESS_KEY=your-production-secret

# S3 Bucket
S3_BUCKET=your-production-bucket-name

# AWS Batch
BATCH_JOB_QUEUE=video-processing-queue
BATCH_JOB_DEFINITION=video-processor

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Hugging Face (not needed in Next.js app, only for Docker build)
# HF_TOKEN=hf_your_token
```

### 4.2 Update Amplify Environment Variables

In AWS Amplify Console → Your App → Environment Variables:

- [ ] `AWS_REGION` = us-west-1
- [ ] `AWS_ACCESS_KEY_ID` = your-production-key
- [ ] `AWS_SECRET_ACCESS_KEY` = your-production-secret
- [ ] `S3_BUCKET` = your-production-bucket-name
- [ ] `BATCH_JOB_QUEUE` = video-processing-queue
- [ ] `BATCH_JOB_DEFINITION` = video-processor
- [ ] `DATABASE_URL` = your-database-url

---

## Part 5: Deploy & Test (15 min)

### 5.1 Deploy to Amplify

```bash
# Commit all changes
git add .
git commit -m "Add video processing pipeline"

# Push to your main branch
git push origin main
```

Amplify will automatically deploy.

### 5.2 Update S3 CORS for Production Domain

Once deployed, update the S3 CORS to include your production domain:

```bash
cat > /tmp/cors-prod.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": [
      "https://your-production-domain.com",
      "https://main.your-amplify-id.amplifyapp.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket $S3_BUCKET \
  --cors-configuration file:///tmp/cors-prod.json \
  --region $REGION
```

### 5.3 Test Upload Flow

1. [ ] Go to `https://your-app.com/videos/upload`
2. [ ] Upload a short test video (< 1 min)
3. [ ] Verify upload progress shows
4. [ ] Verify status tracker appears
5. [ ] Check AWS Batch job was submitted:
   ```bash
   aws batch list-jobs \
     --job-queue video-processing-queue \
     --job-status RUNNING \
     --region $REGION
   ```
6. [ ] Wait for processing to complete (~10 min for 1 min video)
7. [ ] Verify transcript appears in database

---

## Part 6: Monitoring & Debugging (Ongoing)

### View Batch Job Logs

```bash
# List recent jobs
aws batch list-jobs \
  --job-queue video-processing-queue \
  --region $REGION

# Get job details
aws batch describe-jobs \
  --jobs <job-id> \
  --region $REGION

# View logs (get log stream name from job details)
aws logs tail /aws/batch/job \
  --follow \
  --region $REGION
```

### Check Costs

```bash
# AWS Cost Explorer
open https://console.aws.amazon.com/cost-management/home

# Estimated monthly costs:
# - ECR storage: $2/month (20GB image)
# - S3 storage: ~$2/month per 100 videos
# - GPU processing: ~$0.04 per 1-hour video (SPOT pricing)
# - 100 videos/month: ~$15/month total
# - 1,000 videos/month: ~$75/month total
```

---

## Troubleshooting

### Upload Fails with 403

- [ ] Verify S3 bucket CORS includes your domain
- [ ] Verify IAM user has S3 upload permissions
- [ ] Check browser console for specific error

### Batch Job Stays in PENDING

- [ ] Check compute environment is VALID
- [ ] Check job queue is VALID
- [ ] Verify instance types available in your region
- [ ] Try ON_DEMAND instead of SPOT if instances unavailable

### Job Fails with "Cannot pull image"

- [ ] Verify execution role has ECR pull permissions
- [ ] Verify image exists in ECR:
   ```bash
   aws ecr describe-images --repository-name video-processor --region $REGION
   ```

### Processing Fails Mid-Job

- [ ] Check CloudWatch logs for errors
- [ ] Verify DATABASE_URL is accessible from Batch job
- [ ] Verify HF_TOKEN was used during Docker build
- [ ] Check S3 permissions for job execution role

---

## Cost Optimization Tips

1. **Use SPOT instances** (already configured) - 70% cheaper
2. **Monitor unused compute environments** - Set minvCpus=0
3. **Clean up old videos** - Lifecycle policy on S3 bucket
4. **Use smaller models** - Trade accuracy for speed/cost
5. **Batch processing** - Process multiple videos in one job

---

## Security Checklist

- [ ] S3 bucket is not publicly accessible
- [ ] CORS only allows your production domains
- [ ] IAM roles follow principle of least privilege
- [ ] Secrets (DB password, AWS keys) in environment variables only
- [ ] Database has SSL/TLS enabled
- [ ] VPC security groups restrict access
- [ ] ECR repository is private

---

## Rollback Plan

If something goes wrong:

1. **Disable video upload** - Remove route or add feature flag
2. **Stop Batch processing** - Disable job queue:
   ```bash
   aws batch update-job-queue \
     --job-queue video-processing-queue \
     --state DISABLED \
     --region $REGION
   ```
3. **Revert code** - Deploy previous commit
4. **Database rollback** - Use Prisma migrations to revert schema changes

---

## Summary of All Values to Save

Copy these to a secure location (like 1Password or AWS Secrets Manager):

```bash
# AWS
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# S3
S3_BUCKET=your-bucket-name

# Batch
BATCH_JOB_QUEUE=video-processing-queue
BATCH_JOB_DEFINITION=video-processor
BATCH_EXECUTION_ROLE_ARN=arn:aws:iam::account:role/BatchJobExecutionRole
BATCH_SERVICE_ROLE_ARN=arn:aws:iam::account:role/AWSBatchServiceRole

# VPC
VPC_ID=vpc-xxxxx
SUBNET_IDS=subnet-xxxxx,subnet-yyyyy
SECURITY_GROUP_ID=sg-xxxxx

# ECR
ECR_REPOSITORY_URI=account.dkr.ecr.region.amazonaws.com/video-processor

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Hugging Face (for Docker builds only)
HF_TOKEN=hf_xxxxx
```

---

## Next Steps After Deployment

1. Build transcript editor UI (`/video/[id]/edit`)
2. Add user permissions (who can view/edit transcripts)
3. Add video sharing features
4. Add search functionality
5. Add analytics/reporting

---

**Questions or Issues?**
- Check CloudWatch logs first
- Review this checklist step-by-step
- Test in development environment before production
