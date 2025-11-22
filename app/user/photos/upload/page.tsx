// app/(somewhere)/upload/page.tsx  OR your GetStartedPage
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth-server'; // server-side
import AmplifyFileUploader from '@/components/AmplifyFileUploader';
import Link from 'next/link';

export default async function GetStartedPage() {
  const user = await getCurrentUser();
  const isSignedIn = !!user?.id;

  return (
    <div className="flex flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black">
      {/* Hero / header */}
      <div className="mt-8 flex justify-center w-full" />

      <div className="max-w-4xl mx-auto px-6 mt-12 text-left space-y-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center">
          Upload Photos here
        </h1>

        <section className="space-y-4">
          {/* Pass auth state into the client component */}
          <AmplifyFileUploader isSignedIn={isSignedIn} />
          {!isSignedIn && (
            <p className="text-sm text-gray-600 mt-2">
              Need an account? <Link href="/signup">Sign up</Link> to save your
              photos.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
