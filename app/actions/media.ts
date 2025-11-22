// app/actions/media.ts
'use server';

import { getCurrentUser } from '@/lib/auth-server';
import { Media } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function saveUserMedia({
  path,
  name,
  mimeType,
  size,
  visibility,
}: {
  path: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  visibility: 'public' | 'protected';
}) {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const now = new Date().toISOString();
  const mediaId = randomUUID();

  const resp = await Media.put({
    userId: user.id,
    mediaId,
    type: 'PHOTO', // Adjust based on your use case
    url: path,
    name,
    mimeType: mimeType ?? undefined,
    fileSize: size ?? undefined,
    visibility: visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
    createdAt: now,
  }).go();

  return resp.data;
}
