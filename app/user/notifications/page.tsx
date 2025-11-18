'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your account activity
          </p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark All as Read
          </Button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">Loading...</div>
      )}

      {!loading && notifications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">No notifications yet</p>
            <p className="text-sm">We'll notify you when something happens!</p>
          </CardContent>
        </Card>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.isRead ? 'border-primary' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={notification.isRead ? 'outline' : 'default'}>
                        {notification.type}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    <p className="text-sm mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
