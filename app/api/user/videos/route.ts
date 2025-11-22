// app/api/user-videos/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { Media, Transcript } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all media for this user
    const mediaResp = await Media.query.byUser({ userId: user.id }).go();

    // Filter only VIDEO type
    const userVideos = mediaResp.data.filter((m) => m.type === 'VIDEO');

    // Fetch transcripts for all videos
    const transcriptPromises = userVideos.map((video) =>
      Transcript.query
        .byMedia({ mediaId: video.mediaId })
        .where(({ isCurrent }, { eq }) => eq(isCurrent, true))
        .go()
    );

    const transcriptsResp = await Promise.all(transcriptPromises);

    // Map mediaId → has completed transcript
    const transcriptMap: Record<string, boolean> = {};
    transcriptsResp.forEach((tResp) => {
      tResp.data.forEach((t) => {
        transcriptMap[t.mediaId] = t.status === 'COMPLETED';
      });
    });

    // Transform videos for frontend
    const transformedVideos = userVideos
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((video) => ({
        id: video.mediaId,
        name: video.name || 'Untitled Video',
        url: video.url || '',
        thumbnailUrl: video.thumbnailUrl || null,
        duration: video.duration || null,
        moderationStatus: video.moderationStatus || null,
        approvalStatus: video.approvalStatus || null,
        visibility: video.visibility || null,
        createdAt: video.createdAt,
        hasTranscript: transcriptMap[video.mediaId] || false,
      }));

    return NextResponse.json({ videos: transformedVideos });
  } catch (err) {
    console.error('[GET /api/user-videos] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
