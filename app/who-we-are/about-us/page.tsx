import React from 'react';
import Image from 'next/image';
export default function page() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-4xl mb-2 text-orange-500">ABOUT US</h1>
      <div className="mt-8 flex justify-center w-full">
        <div className="relative w-full max-w-5xl aspect-video">
          <Image
            src="/images/evergreen2.png"
            alt="Evergreen Home"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-xs"
            priority
          />
        </div>
      </div>
      <p>
        Our Guiding Principle is that these interviews and other family records
        reflect the perspectives of the interviewees and their family. While the
        interview files are archived by the Evergreen Family Stories System, the
        family—particularly the interviewee—retains control over who, aside from
        the system admin, can access the files and under what circumstances.
      </p>
    </div>
  );
}
