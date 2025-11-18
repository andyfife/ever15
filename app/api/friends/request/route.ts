import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

// Send a friend request to another registered user
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    // Can't send request to yourself
    if (receiverId === user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId },
          { initiatorId: receiverId, receiverId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: 'You are already friends with this user' },
          { status: 400 }
        );
      }
      if (existingFriendship.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 400 }
        );
      }
      if (existingFriendship.status === 'BLOCKED') {
        return NextResponse.json(
          { error: 'Cannot send friend request' },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        initiatorId: user.id,
        receiverId,
        status: 'PENDING',
      },
      include: {
        initiator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
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

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `${friendship.initiator.first_name || 'Someone'} sent you a friend request`,
        link: `/friends/requests`,
      },
    });

    return NextResponse.json({
      success: true,
      friendship,
      message: 'Friend request sent successfully',
    });
  } catch (error) {
    console.error('[Friend Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// Get all friend requests for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[Friend Requests] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}
