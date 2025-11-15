'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <Authenticator>
          {({ signOut, user }) => {
            // Redirect to dashboard after login
            if (user) {
              router.push('/dashboard');
            }
            return null;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
