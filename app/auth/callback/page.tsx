'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth events
    const hubListenerCancelToken = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          router.push('/dashboard');
          break;
        case 'signInWithRedirect_failure':
          console.error('Sign in failed:', payload.data);
          router.push('/login?error=oauth_failed');
          break;
        case 'customOAuthState':
          console.log('Custom state:', payload.data);
          break;
      }
    });

    return () => hubListenerCancelToken();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
