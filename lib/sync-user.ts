// lib/sync-user-amplify.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Sync the Cognito user into Amplify Data store (User model).
 * Requires that your Amplify data schema includes a `User` model and you
 * regenerated the typed client (amplify codegen models / amplify push).
 *
 * @param cognitoUser - { id: string, email: string, firstName?: string, lastName?: string }
 */
export async function syncUser(cognitoUser: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  try {
    // runtime guard — ensure User model exists on generated client
    if (!client.models || !('User' in client.models)) {
      // helpful error for build/runtime debugging
      throw new Error(
        'Amplify model "User" not found on client.models. Did you add User to your Amplify schema and run `amplify codegen models` / `amplify push`?'
      );
    }

    const UserModel = (client.models as any).User;

    // Attempt to fetch existing user by the Cognito id stored in userId
    const { data: existingUser } = await UserModel.get({
      userId: cognitoUser.id,
    });

    if (existingUser) {
      // update partial fields (update returns { data, errors } shape for Amplify Data)
      await UserModel.update({
        userId: cognitoUser.id,
        email: cognitoUser.email,
        firstName: cognitoUser.firstName ?? existingUser.firstName ?? null,
        lastName: cognitoUser.lastName ?? existingUser.lastName ?? null,
        updatedAt: new Date().toISOString(),
      });

      // fetch fresh copy and return
      const { data: updated } = await UserModel.get({ userId: cognitoUser.id });
      return updated ?? existingUser;
    }

    // Create new user
    const { data: newUser } = await UserModel.create({
      userId: cognitoUser.id,
      email: cognitoUser.email,
      firstName: cognitoUser.firstName ?? null,
      lastName: cognitoUser.lastName ?? null,
      username: cognitoUser.email ? cognitoUser.email.split('@')[0] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return newUser;
  } catch (err) {
    // bubble a clear error for logs
    console.error('[syncUser][amplify] error:', err);
    throw err;
  }
}
