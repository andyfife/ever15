// components/AmplifyFileUploader.tsx
'use client';

import React from 'react';
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  isSignedIn?: boolean;
}

/**
 * Minimal wrapper around Amplify's FileUploader.
 * - Uses a per-user path so uploads are stored under the user's identity.
 * - Only shows the uploader to signed-in users (recommended).
 */
export default function AmplifyFileUploader({ isSignedIn = false }: Props) {
  if (!isSignedIn) {
    return (
      <div className="max-w-lg p-4 border rounded-md text-center">
        <p className="mb-3">You must be signed in to upload files.</p>
        <Link href="/signup" passHref>
          <Button>Sign up / Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Upload files</h3>

      <FileUploader
        acceptedFileTypes={['image/*', 'text/plain']}
        // Use a function so Amplify substitutes the runtime identityId for protected uploads.
        // Files will be stored under: protected/<identityId>/... by default in Amplify Storage.
        path={({ identityId }) => `user-media/${identityId}/`}
        maxFileCount={5}
        isResumable
        // optional callbacks (check your installed package for exact prop names if different)
        // onUploadSuccess gets called by the UI component when a file finishes uploading.
        onUploadSuccess={(file /*, result */) => {
          // NOTE: file is a File object - result depends on component version.
          // You may call a server action here to persist metadata to Prisma:
          // await saveUserMedia({ path: result.path || <constructed-path>, name: file.name, mimeType: file.type, size: file.size, visibility: 'PRIVATE' })
          console.log('Upload success', file);
        }}
        onUploadError={(error) => {
          console.error('Upload error', error);
        }}
      />
    </div>
  );
}
