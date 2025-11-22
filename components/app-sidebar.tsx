// components/AppSidebarClient.tsx
'use client';

import * as React from 'react';
import { Mail, Mic, Users, Shield, Heart } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { NavProjects } from './nav-projects';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  isAdmin: boolean;
  isSignedIn: boolean;
  unreadCount: number;
};

const baseNavMain = [
  {
    title: 'Who We Are',
    url: '#',
    icon: Users,
    items: [
      { title: 'About Us', url: '/who-we-are/about-us' },
      { title: 'Our Mission', url: '/who-we-are/our-mission' },
      { title: 'Our Story', url: '/who-we-are/our-story' },
      { title: 'Our Team', url: '/who-we-are/our-team' },
    ],
  },

  {
    title: 'Oral History',
    url: '#',
    icon: Mic,
    items: [
      { title: 'How it Works', url: '/oral-history/how-it-works' },
      { title: 'Get Started', url: '/oral-history/get-started' },
      { title: 'Archived Stories', url: '/archived-stories' },
    ],
  },
] as const;

const projects = [
  { name: 'Contact Us', url: '/contact-us', icon: Mail },
  {
    name: 'Donate',
    url: 'https://www.globalgiving.org/donate/33117/evergreen-education-foundation/',
    icon: Heart,
  },
];

function AppSidebarInner({
  isAdmin,
  isSignedIn,
  unreadCount,
  ...props
}: AppSidebarProps) {
  console.log('is signed in', isSignedIn);
  // Keep references stable so children don't re-render needlessly.
  const navMain = React.useMemo(() => {
    const userItems = isSignedIn
      ? [
          {
            title: 'My Account',
            url: '#',
            icon: Users,
            items: [
              {
                title: 'Profile Page',
                url: '/user/profile',
                badge: unreadCount > 0 ? unreadCount.toString() : undefined,
              },
              {
                title: 'Notifications',
                url: '/user/notifications',
                badge: unreadCount > 0 ? unreadCount.toString() : undefined,
              },
              { title: 'Friends', url: '/user/friends' },
              { title: 'My Videos', url: '/user/videos' },
              { title: 'Upload Videos', url: '/videos/upload' },
              { title: 'Upload Photos', url: '/user/photos/upload' },
            ],
          },
        ]
      : [];

    const adminItems = isAdmin
      ? [
          {
            title: 'Admin',
            url: '#',
            icon: Shield,
            items: [
              { title: 'Video Monitoring', url: '/admin/videos' },
              { title: 'Review Content', url: '/admin/review' },
              { title: 'Contacts', url: '/admin/contacts' },
            ],
          },
        ]
      : [];

    return [...baseNavMain, ...userItems, ...adminItems];
  }, [isAdmin, isSignedIn, unreadCount]);

  return (
    <Sidebar {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={navMain as any} />
        <NavProjects projects={projects} /> {/* ✅ pass the correct array */}
      </SidebarContent>

      {/* 🔒 Memoized island — won’t re-render unless isSignedIn changes */}
    </Sidebar>
  );
}

export const AppSidebar = React.memo(AppSidebarInner);
