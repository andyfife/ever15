import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

// Accept a friend request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { friendshipId } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        initiator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Only the receiver can accept
    if (friendship.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this request' },
        { status: 403 }
      );
    }

    // Can only accept pending requests
    if (friendship.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been responded to' },
        { status: 400 }
      );
    }

    // Update friendship status to ACCEPTED
    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: {
        initiator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
            username: true,
          },
        },
      },
    });

    // Create in-app notification for initiator (NO EMAIL)
    await prisma.notification.create({
      data: {
        userId: friendship.initiatorId,
        type: 'FRIEND_REQUEST_ACCEPTED',
        title: 'Friend Request Accepted',
        message: `${friendship.receiver.first_name || 'Someone'} accepted your friend request`,
        link: `/friends`,
      },
    });

    return NextResponse.json({
      success: true,
      friendship: updatedFriendship,
      message: 'Friend request accepted',
    });
  } catch (error) {
    console.error('[Accept Friend Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}
