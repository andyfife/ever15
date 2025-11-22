import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { Task, Media, Transcript } from '@/lib/db';

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
    const taskResp = await Task.get({ taskId }).go();
    const task = taskResp?.data;

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const payload = task.payload as Record<string, unknown>;

    // Ensure mediaId is a string
    const mediaId =
      typeof payload.mediaId === 'string' ? payload.mediaId : undefined;

    if (!mediaId) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

    // Get Media record
    const mediaResp = await Media.query.byMediaId({ mediaId }).go();
    const media = mediaResp?.data?.[0];

    if (!media) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Verify ownership
    if (media.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current transcript if available
    const transcriptResp = await Transcript.query
      .byMedia({ mediaId })
      .where(({ isCurrent }, { eq }) => eq(isCurrent, true))
      .go();

    const transcript = transcriptResp?.data?.[0] || null;

    return NextResponse.json({
      task: {
        id: task.taskId,
        status: task.status,
        errorMessage: task.errorMessage,
        currentStep: payload.currentStep,
        steps: payload.steps,
      },
      video: {
        id: media.mediaId,
        name: media.name,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        duration: media.duration,
        moderationStatus: media.moderationStatus,
        visibility: media.visibility,
        approvalStatus: media.approvalStatus,
      },
      transcript: transcript
        ? {
            id: transcript.transcriptId,
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
