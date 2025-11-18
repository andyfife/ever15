import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's videos with transcript information
    const videos = await prisma.userMedia.findMany({
      where: {
        userId: user.id,
        type: 'USER_VIDEO',
        deletedAt: null,
      },
      include: {
        UserMediaTranscript: {
          where: {
            isCurrent: true,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    const transformedVideos = videos.map((video) => ({
      id: video.id,
      name: video.name || 'Untitled Video',
      url: video.url || '',
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      moderationStatus: video.moderationStatus,
      approvalStatus: video.approvalStatus,
      visibility: video.visibility,
      createdAt: video.createdAt.toISOString(),
      hasTranscript: video.UserMediaTranscript.length > 0 &&
        video.UserMediaTranscript[0].status === 'COMPLETED',
    }));

    return NextResponse.json({ videos: transformedVideos });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
