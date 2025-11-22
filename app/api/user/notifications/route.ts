// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { Notification } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    // MARK ALL AS READ
    if (markAllAsRead) {
      // Fetch all unread notifications for the user
      const unreadResp = await Notification.query
        .byUserUnread({ userId: user.id, read: false })
        .go();

      // Update each unread notification
      await Promise.all(
        unreadResp.data.map((n) =>
          Notification.update({
            userId: n.userId,
            createdAt: n.createdAt,
            notificationId: n.notificationId,
          })
            .set({ read: true, updatedAt: new Date().toISOString() })
            .go()
        )
      );

      return NextResponse.json({ success: true });
    }

    // MARK SINGLE NOTIFICATION AS READ
    if (notificationId) {
      // Fetch notification
      const notifResp = await Notification.query
        .byUser({ userId: user.id })
        .go();

      const notif = notifResp.data.find(
        (n) => n.notificationId === notificationId
      );

      if (!notif) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      // Update notification
      await Notification.update({
        userId: notif.userId,
        createdAt: notif.createdAt,
        notificationId: notif.notificationId,
      })
        .set({ read: true, updatedAt: new Date().toISOString() })
        .go();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('Error updating notifications:', err);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
