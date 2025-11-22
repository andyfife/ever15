// components/Header.tsx
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavigationMenuDemo } from '@/components/NavigationMenu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial load
    checkUser();

    // Listen to ALL auth events and update immediately
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('Auth event:', payload.event); // optional, for debugging
      checkUser();

      // Extra safety net: if it's a full sign-in/sign-out, soft-refresh server components
      if (payload.event === 'signedIn' || payload.event === 'signedOut') {
        router.refresh();
      }
    });

    return unsubscribe;
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="relative flex h-16 items-center justify-center px-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SidebarTrigger />
        </div>

        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold text-green-700">
            Family Stories
          </span>
        </Link>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden lg:block text-sm text-gray-600">
                {user.signInDetails?.loginId || user.username}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="hidden md:block py-3 bg-gray-50 border-t">
        <div className="flex justify-center">
          <NavigationMenuDemo user={user} />
        </div>
      </div>
    </header>
  );
}
