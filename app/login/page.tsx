'use client';

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';

function LoginContent() {
  const { user } = useAuthenticator();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return null;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <Authenticator>
          <LoginContent />
        </Authenticator>
      </div>
    </div>
  );
}
