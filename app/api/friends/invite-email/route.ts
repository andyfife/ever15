// app/api/friends/invite/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { User, Friendship, FriendInvite, Notification } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, message } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Check if user already exists
    const existingUserResult = await User.query
      .byEmail({ email: normalizedEmail })
      .go();

    if (existingUserResult.data?.length) {
      const existingUser = existingUserResult.data[0];

      // Can't invite yourself
      if (existingUser.cognitoSub === currentUser.id) {
        return NextResponse.json(
          { error: 'Cannot send friend request to yourself' },
          { status: 400 }
        );
      }

      // Check if friendship already exists
      const outgoing = await Friendship.get({
        userId1: currentUser.id,
        userId2: existingUser.cognitoSub,
      }).go();
      const incoming = await Friendship.get({
        userId1: existingUser.cognitoSub,
        userId2: currentUser.id,
      }).go();

      const existingFriendship = outgoing.data || incoming.data;

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
      }

      // Create friend request
      await Friendship.put({
        userId1: currentUser.id,
        userId2: existingUser.cognitoSub,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }).go();

      // Notify receiver
      await Notification.put({
        userId: existingUser.cognitoSub,
        notificationId: crypto.randomUUID(),
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `${currentUser.firstName || 'Someone'} sent you a friend request`,
        link: '/friends/requests',
        read: false,
        createdAt: new Date().toISOString(),
      }).go();

      return NextResponse.json({
        success: true,
        friendRequest: true,
        message: 'Friend request sent successfully',
      });
    }

    // 2. Check if invite already exists
    const existingInviteResult = await FriendInvite.query
      .byEmail({ inviteeEmail: normalizedEmail })
      .go();

    if (existingInviteResult.data?.length) {
      return NextResponse.json(
        { error: 'You have already sent an invite to this email' },
        { status: 400 }
      );
    }

    // 3. Create invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Save invite
    await FriendInvite.put({
      inviterId: currentUser.id,
      inviteeEmail: normalizedEmail,
      inviteeName: name,
      message,
      token,
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }).go();

    // 5. Send email
    const inviterName =
      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
      'Someone';
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${token}`;

    const emailHtml = `<!DOCTYPE html>...`; // your beautiful HTML email (same as before)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: normalizedEmail,
      subject: `${inviterName} invited you to connect!`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('[Friend Invite] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
