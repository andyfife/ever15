import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Ensures a user exists in the database after Cognito sign-in
 * Call this after successful authentication
 */
export async function syncUser(cognitoUser: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Check if user already exists
    const { data: existingUser } = await client.models.User.get({
      userId: cognitoUser.id,
    });

    if (existingUser) {
      // User exists, optionally update their info
      await client.models.User.update({
        userId: cognitoUser.id,
        email: cognitoUser.email,
        firstName: cognitoUser.firstName,
        lastName: cognitoUser.lastName,
        updatedAt: new Date().toISOString(),
      });
      return existingUser;
    }

    // Create new user record
    const { data: newUser } = await client.models.User.create({
      userId: cognitoUser.id,
      email: cognitoUser.email,
      firstName: cognitoUser.firstName,
      lastName: cognitoUser.lastName,
      username: cognitoUser.email.split('@')[0], // Use email prefix as default username
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return newUser;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}
