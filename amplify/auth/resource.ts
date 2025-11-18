import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // Temporarily disabled Google OAuth - Client ID format issue
    // Will re-enable after fixing
    // externalProviders: {
    //   google: {
    //     clientId: secret('GOOGLE_CLIENT_ID'),
    //     clientSecret: secret('GOOGLE_CLIENT_SECRET'),
    //   },
    //   callbackUrls: [
    //     'http://localhost:3000/auth/callback',
    //     'https://evergreeneducation.org/auth/callback',
    //   ],
    //   logoutUrls: [
    //     'http://localhost:3000',
    //     'https://evergreeneducation.org',
    //   ],
    // },
  },
});
