'use client';

import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">
                {user.signInDetails?.loginId}
              </span>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </>
          )}
        </div>
      )}
    </Authenticator>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      {children}
    </Authenticator>
  );
}
