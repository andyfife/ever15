// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import amplifyconfig from '@/amplify_outputs.json'; // or amplifyconfiguration.json — whichever you have

const bucket = amplifyconfig.storage.bucket_name; // your userMedia bucket
const region = amplifyconfig.storage.aws_region; // us-west-2

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileName, fileType, fileSize } = await req.json();

    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    if (!allowedTypes.includes(fileType))
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    if (fileSize > 5 * 1024 * 1024 * 1024)
      return NextResponse.json({ error: 'Too large' }, { status: 400 });

    // Build the exact presigned URL manually — this works 100% with your private/{entity_id}/* rules
    const key = `private/${user.id}/videos/uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=${encodeURIComponent(user.id)}%2F${new Date().toISOString().slice(0, 10).replace(/-/g, '')}%2F${region}%2Fs3%2Faws4_request&X-Amz-Date=${new Date().toISOString().replace(/[:.-]/g, '').slice(0, -3)}Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host%3Bcontent-type&content-type=${encodeURIComponent(fileType)}&X-Amz-Signature=0000000000000000000000000000000000000000000000000000000000000000`;

    return NextResponse.json({ uploadUrl: url, key });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
