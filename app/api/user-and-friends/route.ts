// app/api/user-and-friends/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { User, Friendship, Notification } from '@/lib/db';
import { randomUUID } from 'crypto';

type FriendDto = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImage: string | null;
  isSelf?: boolean;
};

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add self first
    const friends: FriendDto[] = [
      {
        userId: currentUser.id,
        firstName: currentUser.firstName ?? null,
        lastName: currentUser.lastName ?? null,
        username: currentUser.username ?? null,
        profileImage: currentUser.currentAvatarId ?? null,
        isSelf: true,
      },
    ];

    // Outgoing friendships
    const outgoingResp = await Friendship.query
      .outgoing({ userId1: currentUser.id })
      .go();

    // Incoming friendships
    const incomingResp = await Friendship.query
      .incoming({ userId2: currentUser.id })
      .go();

    const allFriendships = [...outgoingResp.data, ...incomingResp.data];

    for (const f of allFriendships) {
      if (f.status !== 'ACCEPTED') continue;

      const otherUserId = f.userId1 === currentUser.id ? f.userId2 : f.userId1;
      const otherUserResp = await User.get({ cognitoSub: otherUserId }).go();
      const otherUser = otherUserResp?.data;
      if (!otherUser) continue;

      // Avoid duplicates & self
      if (otherUser.cognitoSub === currentUser.id) continue;
      if (friends.find((fr) => fr.userId === otherUser.cognitoSub)) continue;

      friends.push({
        userId: otherUser.cognitoSub,
        firstName: otherUser.firstName ?? null,
        lastName: otherUser.lastName ?? null,
        username: otherUser.username ?? null,
        profileImage: otherUser.currentAvatarId ?? null,
        isSelf: false,
      });
    }

    return NextResponse.json({ friends }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/user-and-friends] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId } = await req.json();
    if (!receiverId)
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    if (receiverId === currentUser.id)
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );

    const receiverResp = await User.get({ cognitoSub: receiverId }).go();
    const receiver = receiverResp?.data;
    if (!receiver)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

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

    const friendshipResp = await Friendship.put({
      userId1: currentUser.id,
      userId2: receiverId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }).go();

    // Optional: create a notification
    await Notification.put({
      userId: receiverId,
      notificationId: randomUUID(),
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message:
        `${currentUser.firstName ?? 'Someone'} ${currentUser.lastName ?? ''}`.trim() +
        ' sent you a friend request',
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
    console.error('[POST /api/user-and-friends] Error:', err);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId1 } = await req.json();
    if (!userId1)
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      );

    const friendshipResp = await Friendship.get({
      userId1,
      userId2: currentUser.id,
    }).go();
    const friendship = friendshipResp?.data;

    if (!friendship)
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );

    if (friendship.status !== 'PENDING')
      return NextResponse.json(
        { error: 'Friend request is not pending' },
        { status: 400 }
      );

    friendship.status = 'ACCEPTED';
    friendship.updatedAt = new Date().toISOString();

    await Friendship.put(friendship).go();

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (err) {
    console.error('[PATCH /api/user-and-friends] Error:', err);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId } = await req.json();
    if (!userId)
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );

    const friendshipResp1 = await Friendship.get({
      userId1: currentUser.id,
      userId2: userId,
    }).go();
    const friendshipResp2 = await Friendship.get({
      userId1: userId,
      userId2: currentUser.id,
    }).go();

    const friendship = friendshipResp1?.data ?? friendshipResp2?.data;
    if (!friendship)
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );

    await Friendship.delete({
      userId1: friendship.userId1,
      userId2: friendship.userId2,
    }).go();

    return NextResponse.json({ success: true, message: 'Friend removed' });
  } catch (err) {
    console.error('[DELETE /api/user-and-friends] Error:', err);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
