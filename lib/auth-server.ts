import { cookies } from 'next/headers';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth/server';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import config from '@/amplify_outputs.json';
import { User } from '@/lib/db';

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});

// Define your current user type
export type CurrentUser = {
  id: string; // Cognito Sub
  firstName: string;
  lastName: string;
  username?: string;
  currentAvatarId?: string;
  email?: string;
};

/**
 * Get the current authenticated user from Amplify Auth
 * Also ensures the user exists in DynamoDB (via ElectroDB)
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // Fetch Amplify session
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (ctx) => fetchAuthSession(ctx),
    });

    if (!session.tokens) return null;

    // Fetch user attributes
    const userAttributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (ctx) => fetchUserAttributes(ctx),
    });

    const userId = session.tokens.idToken?.payload.sub as string;
    if (!userId) return null;

    // Map attributes to CurrentUser
    const currentUser: CurrentUser = {
      id: userId,
      firstName:
        userAttributes.given_name ||
        userAttributes.name?.split(' ')[0] ||
        'Unknown',
      lastName:
        userAttributes.family_name ||
        userAttributes.name?.split(' ').slice(1).join(' ') ||
        '',
      username: userAttributes.nickname || userAttributes.email?.split('@')[0],
      currentAvatarId: userAttributes.picture,
      email: userAttributes.email,
    };

    // Ensure user exists in DynamoDB
    const existingUserResp = await User.get({ cognitoSub: userId }).go();

    if (!existingUserResp?.data) {
      await User.put({
        cognitoSub: userId,
        email: currentUser.email || '',
        username: currentUser.username || '',
        firstName: currentUser.firstName, // ✅ updated from givenName
        lastName: currentUser.lastName, // ✅ updated from familyName
        currentAvatarId: currentUser.currentAvatarId,
        createdAt: new Date().toISOString(),
      }).go();
    }

    return currentUser;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}
