// app/api/admin/videos/[videoId]/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { Media } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = params;
    const body = await request.json();

    const { moderationStatus, moderationNotes, approvalStatus, visibility } =
      body as {
        moderationStatus?:
          | 'PENDING'
          | 'APPROVED'
          | 'REJECTED'
          | 'REVIEW'
          | 'PROCESSING';
        moderationNotes?: string | null;
        approvalStatus?: 'DRAFT' | 'AWAITING_ADMIN' | 'APPROVED' | 'REJECTED';
        visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
      };

    // Find the item using the byMediaId index
    const result = await Media.query.byMediaId({ mediaId: videoId }).go();

    if (!result.data || result.data.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const item = result.data[0];

    // Build update object — only include fields that exist on the entity
    const updateData = {
      ...(moderationStatus !== undefined && { moderationStatus }),
      ...(moderationNotes !== undefined && { moderationNotes }),
      ...(approvalStatus !== undefined && { approvalStatus }),
      ...(visibility !== undefined && { visibility }),
      processedAt: new Date().toISOString(),
    } as const;

    // Patch with full primary key
    const updated = await Media.patch({
      userId: item.userId,
      createdAt: item.createdAt,
      mediaId: item.mediaId,
    })
      .set(updateData)
      .go();

    return NextResponse.json({
      success: true,
      video: updated.data,
    });
  } catch (error) {
    console.error('PATCH /admin/videos/[videoId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}
