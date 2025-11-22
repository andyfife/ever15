// app/api/me/route.ts (or wherever it is)
import { NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/auth-server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { User, Message, Notification } from '@/lib/db';

export async function GET() {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (ctx) => fetchAuthSession(ctx),
    });

    const cognitoSub = session?.tokens?.idToken?.payload?.sub as
      | string
      | undefined;

    if (!cognitoSub) {
      return NextResponse.json({ user: null });
    }

    // Find user by Cognito sub
    const userResult = await User.query.bySub({ cognitoSub }).go();

    if (!userResult.data || userResult.data.length === 0) {
      return NextResponse.json({ user: null });
    }

    const dbUser = userResult.data[0];

    // Count unread messages and notifications
    const [unreadMessagesResult, unreadNotificationsResult] = await Promise.all(
      [
        Message.query
          .byRecipient({ recipientId: dbUser.cognitoSub })
          .where(({ messageRead }, { eq }) => eq(messageRead, false))
          .go(),
        Notification.query
          .byUser({ userId: dbUser.cognitoSub })
          .where(({ read }, { eq }) => eq(read, false))
          .go(),
      ]
    );

    const unreadMessages = unreadMessagesResult.data?.length || 0;
    const unreadNotifications = unreadNotificationsResult.data?.length || 0;

    return NextResponse.json({
      user: {
        isSignedIn: true,
        id: dbUser.cognitoSub, // <-- this is your real user ID now
        cognitoSub,
        username: dbUser.username ?? null,
        name:
          [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || null,
        role: dbUser.role,
        unreadMessages,
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    return NextResponse.json({ user: null });
  }
}
