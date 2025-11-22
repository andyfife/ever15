import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-server'; // server-side

export default async function GetStartedPage() {
  const user = await getCurrentUser();
  const isSignedIn = !!user?.id;

  return (
    <div className="flex flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black">
      {/* Hero Image */}
      <div className="mt-8 flex justify-center w-full">
        <div className="relative w-full max-w-5xl aspect-video">
          <Image
            src="/images/evergreen3.png"
            alt="Evergreen Home"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-lg shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Text section */}
      <div className="max-w-4xl mx-auto px-6 mt-12 text-left space-y-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center">
          Build your family story in a few simple steps
        </h1>

        {/* Step 1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            1. Interview a Family Member
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Choose a family member whose story you would like to know more
            about. Obtain their consent and record the interview offline or
            online using tools like Zoom. Afterward, review the interview,
            provide keywords and a short summary, and proofread for accuracy.
          </p>
          {!isSignedIn && (
            <Link
              href="/signup"
              className="inline-block mt-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              I want to try this option
            </Link>
          )}
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            2. Record Your Own Story
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You can also record your own story. After recording, provide
            keywords and a short summary. Try using transcription tools to help
            capture your narrative accurately.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Consider gathering photos or documents to enrich your story. Upload
            these materials to preserve them for future generations.
          </p>
          {!isSignedIn && (
            <Link
              href="/signup"
              className="inline-block mt-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              I want to try this option
            </Link>
          )}
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            3. Upload Photos & Documents
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Upload important photos and documents to enhance your family story
            and ensure they are preserved for future generations.
          </p>
          {!isSignedIn ? (
            <Link
              href="/signup"
              className="inline-block mt-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              I want to try this option
            </Link>
          ) : (
            <Link
              href="/videos/upload"
              className="inline-block mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Upload Your Video
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
