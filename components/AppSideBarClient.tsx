'use client';

import React, { useEffect, useState } from 'react';
import { AppSidebar as AppSidebarServer } from './app-sidebar';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser as getAuthUser } from 'aws-amplify/auth';

interface SidebarUser {
  isSignedIn: boolean;
  isAdmin: boolean;
  unreadCount: number;
}

export default function AppSidebarClient(props: any) {
  const [user, setUser] = useState<SidebarUser>({
    isSignedIn: false,
    isAdmin: false,
    unreadCount: 0,
  });

  const refreshUser = async () => {
    try {
      const authUser = await getAuthUser();
      if (!authUser) {
        setUser({ isSignedIn: false, isAdmin: false, unreadCount: 0 });
        return;
      }

      // Fetch DB-specific info (role + unread notifications)
      try {
        const res = await fetch('/api/current-user');
        if (!res.ok) throw new Error('Not signed in or session expired');
        const data = await res.json();

        setUser({
          isSignedIn: true,
          isAdmin: data.user?.role === 'ADMIN',
          unreadCount: data.user?.unreadNotifications || 0,
        });
      } catch {
        // ❌ DO NOT assume signed in, fallback to signed out
        setUser({ isSignedIn: false, isAdmin: false, unreadCount: 0 });
      }
    } catch {
      setUser({ isSignedIn: false, isAdmin: false, unreadCount: 0 });
    }
  };

  useEffect(() => {
    refreshUser();

    const unsubscribe = Hub.listen('auth', () => {
      refreshUser();
    });

    return () => unsubscribe();
  }, []);

  return <AppSidebarServer {...user} {...props} />;
}
