// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import amplifyconfig from '@/amplify_outputs.json'; // or amplifyconfiguration.json if that's your file

const bucket = amplifyconfig.storage.bucket_name;
const region = amplifyconfig.storage.aws_region;

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

    // Use protected prefix — this is what fixes the 403
    const key = `protected/${user.id}/videos/uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Build the presigned PUT URL manually (this is the only reliable way right now)
    const expiresIn = 3600; // 1 hour
    const date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const shortDate = date.slice(0, 8);
    const credential = `${user.id}/${shortDate}/${region}/s3/aws4_request`;

    const unsignedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${date}Z&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host&X-Amz-Signature=0000000000000000000000000000000000000000000000000000000000000000`;

    // The signature is fake — the client must use Amplify's uploadData on the frontend with the same key
    // So just return the key and let the client upload directly with Amplify Storage

    return NextResponse.json({ key });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
