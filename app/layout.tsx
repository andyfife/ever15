import Footer from '@/components/Footer';
import { Header } from '@/components/Header';
import { AmplifyConfig } from '@/components/amplify-config';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return 0;
  }
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Evergreen Education Foundation',
  description: 'Family Stories Told',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if user is signed in
  const user = await getCurrentUser();
  const isSignedIn = !!user?.id;

  // Check if user is admin
  const isAdmin = user?.id ? await checkIsAdmin(user.id) : false;

  // Fetch unread notification count
  const unreadCount = user?.id ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AmplifyConfig />
        <SidebarProvider>
          <AppSidebar
            isAdmin={isAdmin}
            isSignedIn={isSignedIn}
            unreadCount={unreadCount}
          />

          <SidebarInset>
            <Header />
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
