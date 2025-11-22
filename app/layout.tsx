// app/layout.tsx
import Footer from '@/components/Footer';
import { Header } from '@/components/Header';
import { AmplifyConfig } from '@/components/amplify-config';
import { AuthRefresher } from '@/components/auth-listener'; // ← ADD THIS
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { User, Notification } from '@/lib/db';
import type { Metadata } from 'next';

import { Playfair_Display, Merriweather } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import AppSidebarClient from '@/components/AppSideBarClient';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap', // optional, but recommended for better performance
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'], // Specify desired weights
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'Evergreen Education Foundation',
  description: 'Family Stories Told',
};

async function checkIsAdmin(userId: string): Promise<boolean> {
  const userResp = await User.get({ cognitoSub: userId }).go();
  return userResp?.data?.role === 'ADMIN';
}

async function getUnreadNotificationCount(userId: string): Promise<number> {
  const unreadResp = await Notification.query
    .byUserUnread({ userId, read: false })
    .go();
  return unreadResp.data?.length || 0;
}

// app/layout.tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const isSignedIn = !!user?.id;

  const [isAdmin, unreadCount] = await Promise.all([
    user?.id ? checkIsAdmin(user.id) : false,
    user?.id ? getUnreadNotificationCount(user.id) : 0,
  ]);

  return (
    <html lang="en" className={merriweather.className}>
      <body>
        <AmplifyConfig />
        <AuthRefresher />

        <SidebarProvider>
          <AppSidebarClient />

          <SidebarInset>
            <Header />{' '}
            {/* Header updates instantly via AuthRefresher + router.refresh() */}
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </main>
            <Toaster />
            <Footer />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
