import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.read,
      createdAt: notification.createdAt.toISOString(),
      relatedId: notification.userMediaId || undefined,
    }));

    return NextResponse.json({ notifications: transformedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user's notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      if (notification.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
