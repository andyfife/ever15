#!/bin/bash
# Copy Docker image from us-west-1 to us-west-2

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Copying Docker image from us-west-1 to us-west-2${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Login to both regions
echo "Logging into ECR..."
aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 786620399834.dkr.ecr.us-west-1.amazonaws.com
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 786620399834.dkr.ecr.us-west-2.amazonaws.com

# Pull from us-west-1
echo ""
echo -e "${YELLOW}Pulling image from us-west-1 (9.26GB - this will take 5-10 minutes)...${NC}"
docker pull 786620399834.dkr.ecr.us-west-1.amazonaws.com/video-processor:latest

# Tag for us-west-2
echo ""
echo "Tagging image for us-west-2..."
docker tag 786620399834.dkr.ecr.us-west-1.amazonaws.com/video-processor:latest \
  786620399834.dkr.ecr.us-west-2.amazonaws.com/video-processor:latest

# Push to us-west-2
echo ""
echo -e "${YELLOW}Pushing to us-west-2 (this will take 5-10 minutes)...${NC}"
docker push 786620399834.dkr.ecr.us-west-2.amazonaws.com/video-processor:latest

echo ""
echo -e "${GREEN}✓ Image successfully copied to us-west-2!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the pipeline at http://localhost:3001/videos/upload"
echo "2. Upload a video and watch it process (should be MUCH faster in us-west-2!)"
