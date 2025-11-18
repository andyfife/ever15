'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavigationMenuDemo } from '@/components/NavigationMenu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      {/* Top bar — Logo centered, sidebar left, user right */}
      <div className="relative flex h-16 items-center justify-center px-4">
        {/* Left: Sidebar Trigger */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SidebarTrigger />
        </div>

        {/* Center: Logo + Name */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/evergreen-logo.webp"
            alt="Evergreen Education Foundation"
            className="h-10 w-10 object-contain"
          />
          <span className="hidden md:block text-xl font-bold text-gray-900">
            Evergreen Education Foundation
          </span>
        </Link>

        {/* Right: User Info */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
          {isClient && user ? (
            <>
              <span className="hidden lg:block text-sm text-gray-600">
                {user.signInDetails?.loginId || user.username}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </>
          ) : isClient ? (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Bottom: Navigation menu perfectly centered under the logo */}
      <div className="py-3 bg-gray-50 border-t">
        <div className="flex justify-center">
          <NavigationMenuDemo />
        </div>
      </div>
    </header>
  );
}
