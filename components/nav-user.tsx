// components/nav-user.tsx
'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Mic,
  Video,
  Camera,
  PlaySquare,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

import Link from 'next/link';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useClerk,
  useUser,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import NotificationsLink from './NotificationsLink';

export function NavUser() {
  const { isMobile, toggleSidebar } = useSidebar();
  const { signOut } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();

  // Avoid flashing wrong state before Clerk is ready
  if (!isLoaded) return null;

  const handleUpdateAvatarClick = () => toggleSidebar();

  const handleLogout = async () => {
    // Prefer redirectUrl over window.location for Clerk signOut
    await signOut({ redirectUrl: '/' });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="mb-4">
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={user?.imageUrl ?? ''}
                    alt={user?.fullName ?? 'User'}
                  />
                  <AvatarFallback className="rounded-full">
                    {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.username || user?.fullName || 'User'}
                  </span>
                  <span className="truncate text-xs">
                    {user?.primaryEmailAddress?.emailAddress ?? ''}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user?.imageUrl ?? ''}
                      alt={user?.fullName ?? 'User'}
                    />
                    <AvatarFallback className="rounded-full">
                      {(user?.firstName?.[0] ?? '') +
                        (user?.lastName?.[0] ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.username || user?.fullName || 'User'}
                    </span>
                    <span className="truncate text-xs">
                      {user?.primaryEmailAddress?.emailAddress ?? ''}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {/* <DropdownMenuItem onClick={handleUpdateAvatarClick}>
                  <Sparkles />
                  <Link
                    className="w-full"
                    href={`/user/${user?.id}/upload-photos`}
                  >
                    Upload Photos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUpdateAvatarClick}>
                  <Sparkles />
                  <Link
                    className="w-full"
                    href={`/user/${user?.id}/upload-videos`}
                  >
                    Upload Videos
                  </Link>
                </DropdownMenuItem> */}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <NotificationsLink />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/user/videos`}>
                    <PlaySquare />
                    <span className="ml-2">My Videos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/user/upload-videos`}>
                    <Video />
                    <span className="ml-2">Upload Videos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/user/upload-photos`}>
                    <Camera />
                    <span className="ml-2">Upload Photos</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                <span className="ml-2">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button size="sm">Sign in</Button>
          </SignInButton>
        </SignedOut>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
