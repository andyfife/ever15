#!/bin/bash
# Quick S3 bucket setup for testing

set -e

echo "🚀 Setting up S3 bucket for video uploads..."
echo ""

# Check AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

# Create unique bucket name
BUCKET_NAME="ever15-videos-test-$(date +%s)"
REGION="us-west-1"

echo "Creating bucket: $BUCKET_NAME in $REGION"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Set CORS
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3003"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file:///tmp/cors.json

echo ""
echo "✅ S3 bucket created: $BUCKET_NAME"
echo ""
echo "Add this to your .env.local file:"
echo ""
echo "AWS_REGION=$REGION"
echo "S3_BUCKET=$BUCKET_NAME"
echo ""
echo "Don't forget to also add:"
echo "AWS_ACCESS_KEY_ID=your-key"
echo "AWS_SECRET_ACCESS_KEY=your-secret"
