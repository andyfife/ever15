// components/AppSidebarClient.tsx
'use client';

import * as React from 'react';
import {
  Info,
  Mail,
  Mic,
  Users,
  Shield,
  Heart,
  Bell,
  UserPlus,
  Video,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';

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
      {
        title: 'Our Vision and Mission',
        url: '/about-us/our-vision-and-mission',
      },
      { title: 'Our Founders', url: '/about-us/our-founders' },
      { title: 'Our Legacy', url: '/about-us/our-legacy' },
      { title: 'Our Team', url: '/about-us/our-team' },
      { title: 'Our Emeriti', url: '/about-us/our-emeriti' },
    ],
  },
  {
    title: 'What We Do',
    url: '#',
    icon: Info,
    items: [
      { title: 'Our Work Overview', url: '/our-work' },
      { title: 'Family Story', url: '/our-work/family-story' },
      { title: 'Household Library', url: '/our-work/household-library' },
      { title: 'Early Childhood', url: '/our-work/early-childhood' },
      {
        title: 'Conferences and Workshops',
        url: '/our-work/conferences-and-workshops',
      },
      {
        title: 'Publications and Presentations',
        url: '/our-work/publications-and-presentations',
      },
    ],
  },
  {
    title: 'Oral History',
    url: '#',
    icon: Mic,
    items: [
      { title: 'How it Works', url: '/oral-history/how-it-works' },
      { title: 'Get Started', url: '/oral-history/get-started' },
      { title: 'Archived Stories', url: '/oral-history/archived-stories' },
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
] as const;

function AppSidebarInner({
  isAdmin,
  isSignedIn,
  unreadCount,
  ...props
}: AppSidebarProps) {
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
        <NavProjects projects={projects as any} />
      </SidebarContent>

      {/* 🔒 Memoized island — won’t re-render unless isSignedIn changes */}
    </Sidebar>
  );
}

export const AppSidebar = React.memo(AppSidebarInner);
