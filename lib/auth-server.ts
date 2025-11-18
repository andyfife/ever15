import { cookies } from 'next/headers';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth/server';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import config from '@/amplify_outputs.json';
import { prisma } from '@/lib/db';

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: Array<{ emailAddress: string }>;
}

/**
 * Get the current authenticated user from Amplify Auth
 * Similar to Clerk's currentUser() but for Amplify
 * Also ensures the user exists in the Prisma database
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });

    if (!session.tokens) {
      return null;
    }

    const userAttributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchUserAttributes(contextSpec),
    });

    // Extract user ID from the session (Cognito sub)
    const userId = session.tokens.idToken?.payload.sub as string;

    if (!userId) {
      return null;
    }

    // Map Amplify user attributes to match Clerk's structure
    const user: CurrentUser = {
      id: userId,
      email: userAttributes.email || '',
      firstName: userAttributes.given_name || userAttributes.name?.split(' ')[0],
      lastName: userAttributes.family_name || userAttributes.name?.split(' ').slice(1).join(' '),
      emailAddresses: userAttributes.email ? [{ emailAddress: userAttributes.email }] : [],
    };

    // Ensure user exists in Prisma database
    try {
      const existingUser = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!existingUser) {
        // Create user record in Prisma
        await prisma.user.create({
          data: {
            id: userId,
            user_id: userId,
            email_address: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            username: user.email.split('@')[0],
          },
        });
      }
    } catch (dbError) {
      console.error('Error syncing user to database:', dbError);
      // Don't fail auth if DB sync fails
    }

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
