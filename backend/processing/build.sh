#!/bin/bash
# Build and push Docker image with pre-downloaded AI models to ECR
# This script will build a ~15-20GB image with all models baked in

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Building Video Processing Docker Image ===${NC}"
echo ""

# Check if HF_TOKEN is set
if [ -z "$HF_TOKEN" ]; then
    echo -e "${RED}ERROR: HF_TOKEN environment variable is not set${NC}"
    echo "Please set your Hugging Face token:"
    echo "  export HF_TOKEN=your_huggingface_token"
    echo ""
    echo "Get your token from: https://huggingface.co/settings/tokens"
    echo "Make sure you've accepted the Llama 3.2 license!"
    exit 1
fi

# Set AWS region
AWS_REGION=${AWS_REGION:-us-west-2}
echo -e "${YELLOW}Using AWS region: $AWS_REGION${NC}"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}ERROR: Could not get AWS account ID. Make sure AWS CLI is configured${NC}"
    exit 1
fi
echo -e "${YELLOW}AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Set ECR repository details
REPO_NAME="video-processor"
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME"

echo -e "${YELLOW}ECR Repository: $ECR_REPO${NC}"
echo ""

# Check if ECR repository exists, create if not
echo -e "${GREEN}Checking ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository: $REPO_NAME${NC}"
    aws ecr create-repository \
        --repository-name $REPO_NAME \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true
    echo -e "${GREEN}✓ ECR repository created${NC}"
else
    echo -e "${GREEN}✓ ECR repository exists${NC}"
fi
echo ""

# Login to ECR
echo -e "${GREEN}Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_REPO
echo -e "${GREEN}✓ Logged in to ECR${NC}"
echo ""

# Build Docker image
echo -e "${GREEN}Building Docker image (this will take 20-30 minutes)...${NC}"
echo -e "${YELLOW}This will download:${NC}"
echo "  - NudeNet model (~200MB)"
echo "  - Llama 3.2 3B (~3GB)"
echo "  - WhisperX large-v2 (~3GB)"
echo "  - Total image size: ~15-20GB"
echo ""

docker build \
    --platform linux/amd64 \
    --build-arg HF_TOKEN=$HF_TOKEN \
    -t $REPO_NAME:latest \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}ERROR: Docker build failed${NC}"
    exit 1
fi
echo ""

# Tag image for ECR
echo -e "${GREEN}Tagging image for ECR...${NC}"
docker tag $REPO_NAME:latest $ECR_REPO:latest
echo -e "${GREEN}✓ Image tagged${NC}"
echo ""

# Push to ECR
echo -e "${GREEN}Pushing to ECR (this will take 10-20 minutes for ~20GB image)...${NC}"
docker push $ECR_REPO:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image pushed to ECR successfully${NC}"
else
    echo -e "${RED}ERROR: Failed to push image to ECR${NC}"
    exit 1
fi
echo ""

# Get image digest
IMAGE_DIGEST=$(aws ecr describe-images \
    --repository-name $REPO_NAME \
    --region $AWS_REGION \
    --query 'imageDetails[0].imageDigest' \
    --output text)

echo -e "${GREEN}=== Build Complete ===${NC}"
echo ""
echo "Image details:"
echo "  Repository: $ECR_REPO"
echo "  Tag: latest"
echo "  Digest: $IMAGE_DIGEST"
echo "  Region: $AWS_REGION"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Update your AWS Batch job definition to use: $ECR_REPO:latest"
echo "  2. Test with a small video upload"
echo ""
echo -e "${GREEN}Monthly storage cost: ~\$2 (20GB × \$0.10/GB)${NC}"
