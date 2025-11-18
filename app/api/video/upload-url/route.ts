import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCurrentUser } from '@/lib/auth-server';

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType, fileSize } = await req.json();

    // Validate video file type
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5GB.' },
        { status: 400 }
      );
    }

    const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      );
    }

    // Generate unique key for video
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `videos/uploads/${user.id}/${timestamp}-${sanitizedFileName}`;

    // Create pre-signed URL for upload
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
      signableHeaders: new Set(['host', 'content-type']),
    });

    return NextResponse.json({
      uploadUrl,
      key,
      bucket,
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate upload URL';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
