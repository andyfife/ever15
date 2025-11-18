import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map AWS user to Prisma user
    const dbUser = await prisma.user.findUnique({
      where: { user_id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Fetch all friendships where user is either initiator or receiver
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: dbUser.id }, { receiverId: dbUser.id }],
      },
      include: {
        initiator: {
          select: {
            id: true,
            user_id: true,
            first_name: true,
            last_name: true,
            username: true,
            email_address: true,
          },
        },
        receiver: {
          select: {
            id: true,
            user_id: true,
            first_name: true,
            last_name: true,
            username: true,
            email_address: true,
          },
        },
      },
    });

    // Transform friendships to match frontend expectations
    const transformedFriendships = friendships.map((friendship) => {
      const isInitiator = friendship.initiatorId === dbUser.id;
      const otherUser = isInitiator
        ? friendship.receiver
        : friendship.initiator;

      // Determine the status from current user's perspective
      let status: 'ACCEPTED' | 'PENDING' | 'REQUESTED';
      if (friendship.status === 'ACCEPTED') {
        status = 'ACCEPTED';
      } else if (friendship.status === 'PENDING') {
        status = isInitiator ? 'PENDING' : 'REQUESTED';
      } else {
        status = 'PENDING'; // fallback
      }

      const fullName =
        otherUser.first_name || otherUser.last_name
          ? [otherUser.first_name, otherUser.last_name]
              .filter(Boolean)
              .join(' ')
          : otherUser.username || otherUser.email_address || 'Unknown';

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
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { user_id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { email_address: email },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === dbUser.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: dbUser.id, receiverId: targetUser.id },
          { initiatorId: targetUser.id, receiverId: dbUser.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.create({
      data: {
        id: randomUUID(),
        initiatorId: dbUser.id,
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
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { user_id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const { friendshipId } = await request.json();

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

    if (friendship.receiverId !== dbUser.id) {
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

    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED', updatedAt: new Date() },
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
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { user_id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const { friendshipId } = await request.json();

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

    if (
      friendship.initiatorId !== dbUser.id &&
      friendship.receiverId !== dbUser.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
