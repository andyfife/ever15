"""
Lambda function to trigger AWS Batch job when video is uploaded to S3
Triggered by: S3 PutObject event via EventBridge
"""

import json
import os
import logging
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
batch = boto3.client('batch')
s3 = boto3.client('s3')

# Environment variables
JOB_QUEUE = os.environ['BATCH_JOB_QUEUE']
JOB_DEFINITION = os.environ['BATCH_JOB_DEFINITION']
DATABASE_URL = os.environ['DATABASE_URL']
HF_TOKEN = os.environ.get('HF_TOKEN', '')


def lambda_handler(event, context):
    """
    Handle S3 upload event and submit AWS Batch job
    """
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Parse S3 event
        # Event can come from EventBridge or direct S3 event
        if 'detail' in event:
            # EventBridge event
            bucket = event['detail']['bucket']['name']
            key = event['detail']['object']['key']
        else:
            # Direct S3 event
            bucket = event['Records'][0]['s3']['bucket']['name']
            key = event['Records'][0]['s3']['object']['key']

        logger.info(f"Processing upload: s3://{bucket}/{key}")

        # Only process videos in the uploads folder
        if not key.startswith('videos/uploads/'):
            logger.info(f"Skipping non-upload file: {key}")
            return {
                'statusCode': 200,
                'body': 'Not an upload file'
            }

        # Extract user ID from key: videos/uploads/{userId}/{timestamp}-{filename}
        path_parts = key.split('/')
        if len(path_parts) < 4:
            logger.error(f"Invalid key format: {key}")
            return {
                'statusCode': 400,
                'body': 'Invalid key format'
            }

        user_id = path_parts[2]
        filename = path_parts[3]

        # Get metadata from S3 object
        try:
            head_response = s3.head_object(Bucket=bucket, Key=key)
            metadata = head_response.get('Metadata', {})
            user_media_id = metadata.get('usermediaid', '')
            task_id = metadata.get('taskid', '')
        except Exception as e:
            logger.warning(f"Could not get object metadata: {e}")
            # If metadata is not set, we need to query the database
            # For now, we'll skip this upload
            logger.error("Missing UserMedia/Task IDs in metadata")
            return {
                'statusCode': 400,
                'body': 'Missing metadata'
            }

        if not user_media_id or not task_id:
            logger.error("UserMedia ID or Task ID not found in metadata")
            return {
                'statusCode': 400,
                'body': 'Missing UserMedia/Task IDs'
            }

        # Generate unique job name
        job_name = f"video-process-{user_media_id}-{int(datetime.now().timestamp())}"

        # Submit AWS Batch job
        logger.info(f"Submitting Batch job: {job_name}")

        response = batch.submit_job(
            jobName=job_name,
            jobQueue=JOB_QUEUE,
            jobDefinition=JOB_DEFINITION,
            containerOverrides={
                'environment': [
                    {'name': 'VIDEO_KEY', 'value': key},
                    {'name': 'BUCKET', 'value': bucket},
                    {'name': 'USER_MEDIA_ID', 'value': user_media_id},
                    {'name': 'TASK_ID', 'value': task_id},
                    {'name': 'DATABASE_URL', 'value': DATABASE_URL},
                    {'name': 'HF_TOKEN', 'value': HF_TOKEN},
                ]
            }
        )

        batch_job_id = response['jobId']
        logger.info(f"✓ Batch job submitted: {batch_job_id}")

        # Optionally: Update Task record with batch job ID
        # (Would require database connection here or separate Lambda)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch job submitted',
                'jobId': batch_job_id,
                'jobName': job_name,
                'userMediaId': user_media_id,
                'taskId': task_id
            })
        }

    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
