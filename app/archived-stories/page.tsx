import React from 'react';
import Image from 'next/image';
function page() {
  return (
    <div className="flex flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black">
      {/* Hero Image */}
      <div className="mt-8 flex justify-center w-md">
        <div className="relative w-full max-w-5xl aspect-video">
          <Image
            src="/images/evergreen4.png"
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
          Our Archive
        </h1>
        <p>
          Our Guiding Principle is that these interviews and other family
          records reflect the perspectives of the interviewees and their family.
          While the interview files are archived by the Evergreen Family Stories
          System, the family—particularly the interviewee—retains control over
          who, aside from the system admin, can access the files and under what
          circumstances.
        </p>
      </div>
    </div>
  );
}

export default page;
