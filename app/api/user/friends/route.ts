import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all friendships where user is either initiator or receiver
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: user.id },
          { receiverId: user.id },
        ],
        status: {
          not: 'REJECTED',
        },
      },
      include: {
        User_Friendship_initiatorIdToUser: {
          select: {
            id: true,
            user_id: true,
            username: true,
            email_address: true,
            first_name: true,
            last_name: true,
            name: true,
          },
        },
        User_Friendship_receiverIdToUser: {
          select: {
            id: true,
            user_id: true,
            username: true,
            email_address: true,
            first_name: true,
            last_name: true,
            name: true,
          },
        },
      },
    });

    // Transform friendships to match frontend expectations
    const transformedFriendships = friendships.map((friendship) => {
      const isInitiator = friendship.initiatorId === user.id;
      const otherUser = isInitiator
        ? friendship.User_Friendship_receiverIdToUser
        : friendship.User_Friendship_initiatorIdToUser;

      // Determine the status from current user's perspective
      let status: 'ACCEPTED' | 'PENDING' | 'REQUESTED';
      if (friendship.status === 'ACCEPTED') {
        status = 'ACCEPTED';
      } else if (friendship.status === 'PENDING') {
        // If current user is the initiator, they sent the request (PENDING)
        // If current user is the receiver, they received the request (REQUESTED)
        status = isInitiator ? 'PENDING' : 'REQUESTED';
      } else {
        status = 'PENDING'; // Fallback
      }

      const fullName = otherUser.name ||
        [otherUser.first_name, otherUser.last_name].filter(Boolean).join(' ') ||
        otherUser.username ||
        otherUser.email_address;

      return {
        id: friendship.id,
        name: fullName,
        email: otherUser.email_address || '',
        status,
        createdAt: friendship.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ friends: transformedFriendships });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user by email
    const targetUser = await prisma.user.findFirst({
      where: {
        email_address: email,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: targetUser.id },
          { initiatorId: targetUser.id, receiverId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    // Create friendship request
    const friendship = await prisma.friendship.create({
      data: {
        id: randomUUID(),
        initiatorId: user.id,
        receiverId: targetUser.id,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, friendshipId: friendship.id });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendshipId } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Only the receiver can accept a friend request
    if (friendship.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'Only the receiver can accept this request' },
        { status: 403 }
      );
    }

    if (friendship.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Friend request is not pending' },
        { status: 400 }
      );
    }

    // Update friendship to ACCEPTED
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendshipId } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // User must be either initiator or receiver
    if (friendship.initiatorId !== user.id && friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
