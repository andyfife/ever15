'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function NavBar() {
  const [user, setUser] = useState<{
    username?: string;
    signInDetails?: { loginId?: string };
  } | null>(null);
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
    try {
      await signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  if (!isClient) {
    return null;
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center justify-center h-16 px-4">
          <img
            src="/images/evergreen-logo.webp"
            alt="Evergreen Education Foundation logo"
            className="h-10 w-10 object-contain"
          />
          <Link href="/">
            <span className="ml-3 text-lg font-semibold text-gray-800">
              Evergreen Education Foundation
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.signInDetails?.loginId || user.username}
              </span>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
