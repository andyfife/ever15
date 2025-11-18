import Image from 'next/image';

export default async function GetStartedPage() {
  // ✅ await auth() — it’s async

  return (
    <div className="flex flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black">
      {/* Hero Image */}
      <div className="mt-8 flex justify-center w-full">
        <div className="relative w-full max-w-5xl aspect-video">
          <Image
            src="/images/evergreen4.png"
            alt="Evergreen Home"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-xs"
            priority
          />
        </div>
      </div>

      {/* Text section */}
      <div className="max-w-3xl mx-auto px-4 mt-8 text-left">
        <h1 className="text-3xl text-gray-800">
          {' '}
          Preserve and share your stories for generations.
        </h1>

        <div>
          <p>
            Our Guiding Principle is that these interviews and other family
            records reflect the perspectives of the interviewees and their
            family. While the interview files are archived by the Evergreen
            Family Stories System, the family—particularly the
            interviewee—retains control over who, aside from the system admin,
            can access the files and under what circumstances.
          </p>
        </div>
        {/* Show Sign Up button only if user is signed out */}
      </div>
    </div>
  );
}
