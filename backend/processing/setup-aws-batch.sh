#!/bin/bash
# Complete AWS Batch Infrastructure Setup for us-west-2
# This script sets up everything needed for GPU video processing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AWS Batch Video Processing Setup (us-west-2) ===${NC}"
echo ""

# Set region
export AWS_REGION=us-west-2

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}ERROR: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi
echo -e "${GREEN}✓ AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Check HF_TOKEN
if [ -z "$HF_TOKEN" ]; then
    echo -e "${YELLOW}Enter your Hugging Face token:${NC}"
    read -r HF_TOKEN
    export HF_TOKEN
fi
echo -e "${GREEN}✓ HF_TOKEN set${NC}"

# Check DYNAMODB_TABLE
if [ -z "$DYNAMODB_TABLE" ]; then
    echo -e "${YELLOW}Enter your DynamoDB table name (or press Enter to use auto-generated name):${NC}"
    read -r DYNAMODB_TABLE
    if [ -z "$DYNAMODB_TABLE" ]; then
        DYNAMODB_TABLE="ever15-prod"
    fi
    export DYNAMODB_TABLE
fi
echo -e "${GREEN}✓ DYNAMODB_TABLE set to: $DYNAMODB_TABLE${NC}"

echo ""
echo -e "${GREEN}=== Step 1: Creating IAM Roles ===${NC}"

# Create temporary directory for policy documents
mkdir -p /tmp/aws-batch-setup

# 1. Batch Job Role (for containers to access S3 and database)
echo -e "${BLUE}Creating Batch Job Role...${NC}"
cat > /tmp/aws-batch-setup/batch-job-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

if aws iam get-role --role-name VideoBatchJobRole 2>/dev/null; then
    echo -e "${YELLOW}VideoBatchJobRole already exists${NC}"
else
    aws iam create-role \
      --role-name VideoBatchJobRole \
      --assume-role-policy-document file:///tmp/aws-batch-setup/batch-job-trust.json

    cat > /tmp/aws-batch-setup/batch-job-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::*/*", "arn:aws:s3:::*"]
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "*"
    }
  ]
}
EOF

    aws iam put-role-policy \
      --role-name VideoBatchJobRole \
      --policy-name S3AndLogsAccess \
      --policy-document file:///tmp/aws-batch-setup/batch-job-policy.json

    echo -e "${GREEN}✓ VideoBatchJobRole created${NC}"
fi

# 2. Batch Execution Role (for pulling from ECR)
echo -e "${BLUE}Creating Batch Execution Role...${NC}"
if aws iam get-role --role-name VideoBatchExecutionRole 2>/dev/null; then
    echo -e "${YELLOW}VideoBatchExecutionRole already exists${NC}"
else
    aws iam create-role \
      --role-name VideoBatchExecutionRole \
      --assume-role-policy-document file:///tmp/aws-batch-setup/batch-job-trust.json

    aws iam attach-role-policy \
      --role-name VideoBatchExecutionRole \
      --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

    echo -e "${GREEN}✓ VideoBatchExecutionRole created${NC}"
fi

# 3. Batch Service Role
echo -e "${BLUE}Creating Batch Service Role...${NC}"
cat > /tmp/aws-batch-setup/batch-service-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "batch.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

if aws iam get-role --role-name AWSBatchServiceRole 2>/dev/null; then
    echo -e "${YELLOW}AWSBatchServiceRole already exists${NC}"
else
    aws iam create-role \
      --role-name AWSBatchServiceRole \
      --assume-role-policy-document file:///tmp/aws-batch-setup/batch-service-trust.json

    aws iam attach-role-policy \
      --role-name AWSBatchServiceRole \
      --policy-arn arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole

    echo -e "${GREEN}✓ AWSBatchServiceRole created${NC}"
fi

# 4. EC2 Instance Profile
echo -e "${BLUE}Creating EC2 Instance Profile...${NC}"
cat > /tmp/aws-batch-setup/ec2-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

if aws iam get-role --role-name VideoBatchInstanceRole 2>/dev/null; then
    echo -e "${YELLOW}VideoBatchInstanceRole already exists${NC}"
else
    aws iam create-role \
      --role-name VideoBatchInstanceRole \
      --assume-role-policy-document file:///tmp/aws-batch-setup/ec2-trust.json

    aws iam attach-role-policy \
      --role-name VideoBatchInstanceRole \
      --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

    echo -e "${GREEN}✓ VideoBatchInstanceRole created${NC}"
fi

if aws iam get-instance-profile --instance-profile-name VideoBatchInstanceProfile 2>/dev/null; then
    echo -e "${YELLOW}VideoBatchInstanceProfile already exists${NC}"
else
    aws iam create-instance-profile \
      --instance-profile-name VideoBatchInstanceProfile

    aws iam add-role-to-instance-profile \
      --instance-profile-name VideoBatchInstanceProfile \
      --role-name VideoBatchInstanceRole

    echo -e "${GREEN}✓ VideoBatchInstanceProfile created${NC}"
fi

# Wait for roles to propagate
echo -e "${YELLOW}Waiting 10 seconds for IAM roles to propagate...${NC}"
sleep 10

echo ""
echo -e "${GREEN}=== Step 2: Setting up VPC and Security Group ===${NC}"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --region $AWS_REGION \
  --query 'Vpcs[0].VpcId' \
  --output text 2>/dev/null)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo -e "${RED}ERROR: No default VPC found. Please create a VPC first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using VPC: $VPC_ID${NC}"

# Get subnets
SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region $AWS_REGION \
  --query 'Subnets[*].SubnetId' \
  --output text | tr '\t' ',')

echo -e "${GREEN}✓ Using subnets: $SUBNETS${NC}"

# Create security group
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=video-batch-sg" "Name=vpc-id,Values=$VPC_ID" \
  --region $AWS_REGION \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null)

if [ "$SG_ID" != "None" ] && [ ! -z "$SG_ID" ]; then
    echo -e "${YELLOW}Security group already exists: $SG_ID${NC}"
else
    SG_ID=$(aws ec2 create-security-group \
      --group-name video-batch-sg \
      --description "Video batch processing security group" \
      --vpc-id $VPC_ID \
      --region $AWS_REGION \
      --query 'GroupId' \
      --output text)
    echo -e "${GREEN}✓ Security Group created: $SG_ID${NC}"
fi

echo ""
echo -e "${GREEN}=== Step 3: Building and Pushing Docker Image ===${NC}"
echo -e "${YELLOW}This will take 30-45 minutes...${NC}"

# Run build script
export AWS_REGION=us-west-2
./build.sh

echo ""
echo -e "${GREEN}=== Step 4: Creating AWS Batch Compute Environment ===${NC}"

# Get ARNs
INSTANCE_PROFILE_ARN=$(aws iam get-instance-profile \
  --instance-profile-name VideoBatchInstanceProfile \
  --query 'InstanceProfile.Arn' \
  --output text)

SERVICE_ROLE_ARN=$(aws iam get-role \
  --role-name AWSBatchServiceRole \
  --query 'Role.Arn' \
  --output text)

# Check if compute environment exists
COMPUTE_ENV_STATUS=$(aws batch describe-compute-environments \
  --compute-environments video-gpu-compute-env \
  --region $AWS_REGION \
  --query 'computeEnvironments[0].status' \
  --output text 2>/dev/null)

if [ "$COMPUTE_ENV_STATUS" == "VALID" ]; then
    echo -e "${YELLOW}Compute environment already exists and is VALID${NC}"
else
    echo -e "${BLUE}Creating compute environment...${NC}"
    aws batch create-compute-environment \
      --compute-environment-name video-gpu-compute-env \
      --type MANAGED \
      --state ENABLED \
      --region $AWS_REGION \
      --compute-resources \
        type=SPOT,\
allocationStrategy=SPOT_CAPACITY_OPTIMIZED,\
minvCpus=0,\
maxvCpus=256,\
desiredvCpus=0,\
instanceTypes=g4dn.2xlarge,g4dn.4xlarge,g5.2xlarge,g5.4xlarge,\
subnets=$SUBNETS,\
securityGroupIds=$SG_ID,\
instanceRole=$INSTANCE_PROFILE_ARN \
      --service-role $SERVICE_ROLE_ARN

    echo -e "${YELLOW}Waiting for compute environment to become VALID (2-3 minutes)...${NC}"
    aws batch wait compute-environment-valid \
      --compute-environments video-gpu-compute-env \
      --region $AWS_REGION || true

    echo -e "${GREEN}✓ Compute environment created${NC}"
fi

echo ""
echo -e "${GREEN}=== Step 5: Creating Job Queue ===${NC}"

# Check if job queue exists
QUEUE_STATUS=$(aws batch describe-job-queues \
  --job-queues video-processing-queue \
  --region $AWS_REGION \
  --query 'jobQueues[0].status' \
  --output text 2>/dev/null)

if [ "$QUEUE_STATUS" == "VALID" ]; then
    echo -e "${YELLOW}Job queue already exists${NC}"
else
    aws batch create-job-queue \
      --job-queue-name video-processing-queue \
      --state ENABLED \
      --priority 1 \
      --region $AWS_REGION \
      --compute-environment-order order=1,computeEnvironment=video-gpu-compute-env

    echo -e "${GREEN}✓ Job queue created${NC}"
fi

echo ""
echo -e "${GREEN}=== Step 6: Creating Job Definition ===${NC}"

# Get ECR image URI
ECR_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/video-processor:latest"

# Get role ARNs
JOB_ROLE_ARN=$(aws iam get-role \
  --role-name VideoBatchJobRole \
  --query 'Role.Arn' \
  --output text)

EXECUTION_ROLE_ARN=$(aws iam get-role \
  --role-name VideoBatchExecutionRole \
  --query 'Role.Arn' \
  --output text)

# Create log group
aws logs create-log-group \
  --log-group-name /aws/batch/video-processor \
  --region $AWS_REGION 2>/dev/null || echo -e "${YELLOW}Log group already exists${NC}"

# Register job definition
cat > /tmp/aws-batch-setup/job-def.json << EOF
{
  "jobDefinitionName": "video-processor",
  "type": "container",
  "platformCapabilities": ["EC2"],
  "containerProperties": {
    "image": "$ECR_IMAGE",
    "vcpus": 8,
    "memory": 32768,
    "jobRoleArn": "$JOB_ROLE_ARN",
    "executionRoleArn": "$EXECUTION_ROLE_ARN",
    "resourceRequirements": [{"type": "GPU", "value": "1"}],
    "environment": [
      {"name": "DYNAMODB_TABLE", "value": "$DYNAMODB_TABLE"},
      {"name": "HF_TOKEN", "value": "$HF_TOKEN"},
      {"name": "AWS_DEFAULT_REGION", "value": "$AWS_REGION"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/aws/batch/video-processor",
        "awslogs-region": "$AWS_REGION",
        "awslogs-stream-prefix": "video-processing"
      }
    }
  },
  "retryStrategy": {"attempts": 2},
  "timeout": {"attemptDurationSeconds": 3600}
}
EOF

aws batch register-job-definition \
  --cli-input-json file:///tmp/aws-batch-setup/job-def.json \
  --region $AWS_REGION

echo -e "${GREEN}✓ Job definition registered${NC}"

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  AWS Account: $AWS_ACCOUNT_ID"
echo "  Compute Environment: video-gpu-compute-env"
echo "  Job Queue: video-processing-queue"
echo "  Job Definition: video-processor"
echo "  ECR Image: $ECR_IMAGE"
echo ""
echo -e "${YELLOW}Add these to your .env.local:${NC}"
echo ""
echo "AWS_REGION=$AWS_REGION"
echo "BATCH_JOB_QUEUE=video-processing-queue"
echo "BATCH_JOB_DEFINITION=video-processor"
echo "DYNAMODB_TABLE=$DYNAMODB_TABLE"
echo "HF_TOKEN=$HF_TOKEN"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Update .env.local with the above variables"
echo "  2. Test with: npm run dev and upload a video"
echo "  3. Monitor logs: aws logs tail /aws/batch/video-processor --follow --region $AWS_REGION"
echo ""
