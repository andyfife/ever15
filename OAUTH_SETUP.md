# OAuth Provider Setup Guide

This guide will help you configure Google, Facebook, and Apple sign-in for your application.

## Prerequisites

Before you begin, you'll need to deploy your Amplify backend to get the Cognito User Pool domain. Run:

```bash
npx ampx sandbox
```

After deployment, note your Cognito domain URL from the Amplify console.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://[your-cognito-domain]/oauth2/idpresponse`
   - `https://yourdomain.com/auth/callback` (for production)

### 3. Configure Environment Variables

Copy the Client ID and Client Secret to your `.env.local`:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Facebook OAuth Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps > Create App**
3. Select **Consumer** as the app type
4. Fill in your app details

### 2. Add Facebook Login

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Select **Web** as the platform
4. Enter your site URL

### 3. Configure OAuth Redirect URIs

1. Go to **Facebook Login > Settings**
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://[your-cognito-domain]/oauth2/idpresponse`
   - `https://yourdomain.com/auth/callback`

### 4. Configure Environment Variables

In **Settings > Basic**, find your App ID and App Secret:

```env
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

## Apple Sign In Setup

Apple Sign In is more complex and requires an Apple Developer account ($99/year).

### 1. Register an App ID

1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers > +**
4. Select **App IDs** and click **Continue**
5. Fill in the description and Bundle ID
6. Enable **Sign In with Apple**

### 2. Create a Services ID

1. Click **Identifiers > +**
2. Select **Services IDs** and click **Continue**
3. Enter an identifier (e.g., `com.yourapp.web`)
4. Enable **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Add your domains and redirect URIs:
   - Primary App ID: Select your App ID from step 1
   - Domains: `yourdomain.com`, `[your-cognito-domain]`
   - Return URLs: `https://[your-cognito-domain]/oauth2/idpresponse`

### 3. Create a Key

1. Go to **Keys > +**
2. Enter a key name
3. Enable **Sign In with Apple**
4. Click **Configure** and select your primary App ID
5. Click **Save** and then **Continue**
6. Download the `.p8` key file (you can only download it once!)

### 4. Configure Environment Variables

```env
APPLE_CLIENT_ID=com.yourapp.web  # Your Services ID
APPLE_KEY_ID=ABC123DEFG  # The Key ID from step 3
APPLE_TEAM_ID=XYZ987  # Your Team ID (found in the top right of developer account)
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content from the .p8 file\n-----END PRIVATE KEY-----"
```

**Note:** For the private key, open the `.p8` file in a text editor and copy the entire content including the header and footer. Replace newlines with `\n` in the environment variable.

## Update Callback URLs

In your `amplify/auth/resource.ts`, update the callback URLs to match your production domain:

```typescript
callbackUrls: [
  'http://localhost:3000/auth/callback',
  'https://yourdomain.com/auth/callback',
],
logoutUrls: [
  'http://localhost:3000',
  'https://yourdomain.com',
],
```

## Deploy Your Changes

After configuring all environment variables:

1. Update `.env.local` with your credentials
2. Deploy your Amplify backend:
   ```bash
   npx ampx sandbox
   ```
3. Test each social login provider

## Testing

1. Navigate to `/login`
2. Click on each social provider button
3. Complete the OAuth flow
4. Verify you're redirected to `/dashboard` after successful authentication

## Troubleshooting

### "Invalid redirect URI" error

- Ensure the redirect URI in your OAuth app matches exactly: `https://[cognito-domain]/oauth2/idpresponse`
- Check that you've added `http://localhost:3000/auth/callback` for local testing

### "Invalid client" error

- Verify your Client ID and Client Secret are correct in `.env.local`
- Ensure environment variables are loaded (restart your dev server)

### Apple Sign In issues

- Verify your private key is properly formatted with `\n` for newlines
- Ensure all IDs (Team ID, Key ID, Client ID) are correct
- Check that your domain is verified in the Services ID configuration

## Security Notes

- **Never commit `.env.local`** to version control
- Keep your OAuth secrets secure
- Regularly rotate your credentials
- Use environment variables in production (not hardcoded values)
- Consider using AWS Secrets Manager for production secrets
