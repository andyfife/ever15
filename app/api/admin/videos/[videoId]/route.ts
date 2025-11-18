import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Check authentication - TODO: Add admin check
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await params;
    const {
      moderationStatus,
      moderationNotes,
      approvalStatus,
      visibility,
    } = await req.json();

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (moderationStatus) {
      updateData.moderationStatus = moderationStatus;
    }
    if (moderationNotes !== undefined) {
      updateData.moderationNotes = moderationNotes;
    }
    if (approvalStatus) {
      updateData.approvalStatus = approvalStatus;
    }
    if (visibility) {
      updateData.visibility = visibility;
    }

    // Update video
    const updatedVideo = await prisma.userMedia.update({
      where: { id: videoId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      video: {
        id: updatedVideo.id,
        moderationStatus: updatedVideo.moderationStatus,
        approvalStatus: updatedVideo.approvalStatus,
        visibility: updatedVideo.visibility,
      },
    });
  } catch (error) {
    console.error('Error updating video:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update video';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
