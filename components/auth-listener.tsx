// components/auth-refresher.tsx   ← KEEP THIS ONE FOREVER
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';

export function AuthRefresher() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut') {
        router.refresh();
      }
    });

    return unsubscribe;
  }, [router]);

  return null;
}
