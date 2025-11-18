import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

// Get all friends for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all accepted friendships where the user is initiator or receiver
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id, status: 'ACCEPTED' },
          { receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
      include: {
        initiator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
            username: true,
            email_address: true,
          },
        },
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
            username: true,
            email_address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map friendships to "friend" object excluding current user
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.initiatorId === user.id
          ? friendship.receiver
          : friendship.initiator;

      return {
        friendshipId: friendship.id,
        userId: friend.id,
        firstName: friend.first_name,
        lastName: friend.last_name,
        username: friend.username,
        profileImage: friend.profile_image_url,
        email: friend.email_address,
        friendsSince: friendship.createdAt,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('[Get Friends] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}
