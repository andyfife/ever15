import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

// Reject a friend request
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
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Only the receiver can reject
    if (friendship.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to reject this request' },
        { status: 403 }
      );
    }

    // Can only reject pending requests
    if (friendship.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been responded to' },
        { status: 400 }
      );
    }

    // Update friendship status to REJECTED
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Friend request rejected',
    });
  } catch (error) {
    console.error('[Reject Friend Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reject friend request' },
      { status: 500 }
    );
  }
}
