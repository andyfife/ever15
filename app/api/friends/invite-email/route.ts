import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    console.log('[Friend Invite] Current user from Amplify:', {
      id: user?.id,
      firstName: user?.firstName,
      emailAddresses: user?.emailAddresses,
    });

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, message } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[Friend Invite] Inviting email:', email);

    // Check if invitee is already a registered user
    const existingUser = await prisma.user.findFirst({
      where: {
        email_address: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      // User is already registered, send them a friend request instead
      console.log('[Friend Invite] Found existing user:', {
        id: existingUser.id,
        user_id: existingUser.user_id,
        email: existingUser.email_address,
      });

      // Check if they're trying to friend themselves
      if (existingUser.user_id === user.id) {
        console.log('[Friend Invite] User trying to friend themselves');
        return NextResponse.json(
          { error: 'Cannot send friend request to yourself' },
          { status: 400 }
        );
      }

      // Check if friendship already exists
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { initiatorId: user.id, receiverId: existingUser.user_id },
            { initiatorId: existingUser.user_id, receiverId: user.id },
          ],
        },
      });

      console.log('[Friend Invite] Existing friendship:', existingFriendship);

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
      console.log('[Friend Invite] Creating friendship:', {
        initiatorId: user.id,
        receiverId: existingUser.user_id,
      });

      const friendship = await prisma.friendship.create({
        data: {
          initiatorId: user.id,
          receiverId: existingUser.user_id,
          status: 'PENDING',
        },
      });

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          type: 'FRIEND_REQUEST',
          title: 'New Friend Request',
          message: `${user.firstName || 'Someone'} sent you a friend request`,
          link: `/user/friends/requests`,
        },
      });

      return NextResponse.json({
        success: true,
        friendRequest: true,
        friendshipId: friendship.id,
        message: 'Friend request sent successfully',
      });
    }

    // Check if invite already exists
    const existingInvite = await prisma.friendInvite.findFirst({
      where: {
        inviterId: user.id,
        inviteeEmail: {
          equals: email,
          mode: 'insensitive',
        },
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'You have already sent an invite to this email' },
        { status: 400 }
      );
    }

    // Create invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invite record
    const invite = await prisma.friendInvite.create({
      data: {
        inviterId: user.id,
        inviteeEmail: email.toLowerCase(),
        inviteeName: name,
        message,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Send email via Resend
    const inviterName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Someone';
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${token}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You've Been Invited!</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">
      Hi${name ? ` ${name}` : ''},
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join our community and connect as friends!
    </p>

    ${message ? `
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #555;">
        "${message}"
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This invitation will expire in 7 days.
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: `${inviterName} invited you to connect!`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
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
