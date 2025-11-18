import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const payload = task.payload as Record<string, unknown>;

    // Ensure userMediaId is a string
    const userMediaId =
      typeof payload.userMediaId === 'string' ? payload.userMediaId : undefined;

    if (!userMediaId) {
      return NextResponse.json(
        { error: 'Invalid userMediaId' },
        { status: 400 }
      );
    }

    // Get UserMedia record
    const userMedia = await prisma.userMedia.findUnique({
      where: { id: userMediaId },
      include: {
        UserMediaTranscript: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!userMedia) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Verify ownership
    if (userMedia.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current transcript if available
    const transcript = userMedia.UserMediaTranscript[0] || null;

    return NextResponse.json({
      task: {
        id: task.id,
        status: task.status,
        errorMessage: task.errorMessage,
        currentStep: payload.currentStep,
        steps: payload.steps,
      },
      video: {
        id: userMedia.id,
        name: userMedia.name,
        url: userMedia.url,
        thumbnailUrl: userMedia.thumbnailUrl,
        duration: userMedia.duration,
        moderationStatus: userMedia.moderationStatus,
        moderationNotes: userMedia.moderationNotes,
        visibility: userMedia.visibility,
        approvalStatus: userMedia.approvalStatus,
      },
      transcript: transcript
        ? {
            id: transcript.id,
            text: transcript.text,
            summary: transcript.summary,
            keywords: transcript.keywords,
            status: transcript.status,
            userApproved: transcript.userApproved,
            speakerMappings: transcript.speakerMappings,
            srtUrl: transcript.srtUrl,
            vttUrl: transcript.vttUrl,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching video status:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
