import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { User, Friendship, Notification } from '@/lib/db';
import { randomUUID } from 'crypto';

// ----------------------------
// SEND FRIEND REQUEST
// ----------------------------
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId } = await req.json();
    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    if (receiverId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const receiverResp = await User.get({ cognitoSub: receiverId }).go();
    const receiver = receiverResp?.data;
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check existing friendship
    const outgoing = await Friendship.get({
      userId1: currentUser.id,
      userId2: receiverId,
    }).go();

    const incoming = await Friendship.get({
      userId1: receiverId,
      userId2: currentUser.id,
    }).go();

    const existingFriendship = outgoing?.data ?? incoming?.data ?? null;
    if (existingFriendship) {
      switch (existingFriendship.status) {
        case 'ACCEPTED':
          return NextResponse.json(
            { error: 'Already friends' },
            { status: 400 }
          );
        case 'PENDING':
          return NextResponse.json(
            { error: 'Friend request already pending' },
            { status: 400 }
          );
        case 'BLOCKED':
          return NextResponse.json(
            { error: 'Cannot send friend request' },
            { status: 400 }
          );
      }
    }

    const now = new Date().toISOString();

    // Create friendship request
    const friendshipResp = await Friendship.put({
      userId1: currentUser.id,
      userId2: receiverId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }).go();

    // Create notification for receiver
    await Notification.put({
      userId: receiverId,
      notificationId: randomUUID(),
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message:
        `${currentUser.firstName} ${currentUser.lastName} sent you a friend request`.trim(),
      link: '/friends/requests',
      read: false,
      createdAt: now,
    }).go();

    return NextResponse.json({
      success: true,
      friendship: friendshipResp.data,
      message: 'Friend request sent successfully',
    });
  } catch (err) {
    console.error('[Send Friend Request] Error:', err);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// ----------------------------
// GET PENDING FRIEND REQUESTS
// ----------------------------
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1️⃣ Get all incoming friendships
    const incomingResp = await Friendship.query
      .incoming({ userId2: currentUser.id })
      .go();

    // 2️⃣ Filter only PENDING requests
    const pendingRequests = incomingResp.data.filter(
      (f) => f.status === 'PENDING'
    );

    // 3️⃣ Attach initiator info
    const requestsWithInitiator = await Promise.all(
      pendingRequests.map(async (f) => {
        const initiatorResp = await User.get({ cognitoSub: f.userId1 }).go();
        return {
          ...f,
          initiator: initiatorResp?.data ?? null,
        };
      })
    );

    return NextResponse.json({ requests: requestsWithInitiator });
  } catch (err) {
    console.error('[Fetch Friend Requests] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}

// ----------------------------
// ACCEPT FRIEND REQUEST
// ----------------------------
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId1 } = await req.json();
    if (!userId1) {
      return NextResponse.json(
        { error: 'Friend request initiator ID required' },
        { status: 400 }
      );
    }

    const friendshipResp = await Friendship.get({
      userId1,
      userId2: currentUser.id,
    }).go();

    const friendship = friendshipResp?.data;
    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    if (friendship.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Friend request is not pending' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await Friendship.put({
      ...friendship,
      status: 'ACCEPTED',
      updatedAt: now,
    }).go();

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (err) {
    console.error('[Accept Friend Request] Error:', err);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

// ----------------------------
// DELETE FRIENDSHIP
// ----------------------------
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId1 } = await req.json();
    if (!userId1) {
      return NextResponse.json(
        { error: 'Friend ID required' },
        { status: 400 }
      );
    }

    const friendshipResp = await Friendship.get({
      userId1,
      userId2: currentUser.id,
    }).go();

    const friendship = friendshipResp?.data;
    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    await Friendship.delete({
      userId1: friendship.userId1,
      userId2: friendship.userId2,
    }).go();

    return NextResponse.json({ success: true, message: 'Friendship deleted' });
  } catch (err) {
    console.error('[Delete Friendship] Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete friendship' },
      { status: 500 }
    );
  }
}
