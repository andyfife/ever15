import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Accept a friend invite after signup
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the invite
    const invite = await prisma.friendInvite.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    // Check if invite has expired
    if (new Date() > invite.expiresAt) {
      await prisma.friendInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if invite is still pending
    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if user's email matches the invite
    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (userEmail !== invite.inviteeEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: invite.inviterId, receiverId: user.id },
          { initiatorId: user.id, receiverId: invite.inviterId },
        ],
      },
    });

    if (existingFriendship) {
      // Mark invite as accepted anyway
      await prisma.friendInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'You are already friends with this user',
        alreadyFriends: true,
      });
    }

    // Create friendship and update invite in a transaction
    const [friendship] = await prisma.$transaction([
      // Create friendship
      prisma.friendship.create({
        data: {
          id: crypto.randomUUID(),
          initiatorId: invite.inviterId,
          receiverId: user.id,
          status: 'ACCEPTED', // Auto-accept since they accepted the email invite
          updatedAt: new Date(),
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
      }),

      // Update invite status
      prisma.friendInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
        },
      }),

      // Create notification for inviter
      prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: invite.inviterId,
          type: 'FRIEND_INVITE_ACCEPTED',
          title: 'Friend Invite Accepted',
          message: `${user.firstName || invite.inviteeName || 'Someone'} accepted your friend invite and joined!`,
          link: `/friends`,
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      friendship,
      message: `You are now friends with ${invite.inviter.first_name || 'your inviter'}!`,
    });
  } catch (error) {
    console.error('[Accept Invite] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
