import React from 'react';

export default function page() {
  return (
    <div className="relative min-h-screen">
      {/* Background image (faded) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/ohlogo(1).png')",
          opacity: 0.15, // adjust 0.1 - 0.7 to control fade
        }}
      ></div>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <h1 className="text-4xl mb-2 text-orange-500">OUR MISSION</h1>
        <h2 className="text-2xl mb-2">
          {' '}
          Discover Our Roots and Build Connections with Family Elders
        </h2>
        <p>
          Engage in uncovering your family history and building meaningful
          relationships with your elders. Through this process, you can preserve
          their stories, wisdom, and experiences for future generations.
        </p>
        <h2 className="text-2xl mb-2">Empower Students as Interviewers </h2>
        <p>
          {' '}
          When students take on the role of interviewers, they gain valuable
          skills in conducting interviews, identifying key themes, and writing
          concise summaries. Additionally, they learn to appreciate the
          differences between their own educational experiences and those of the
          interviewees, fostering a deeper understanding of generational
          perspectives..
        </p>
        <h2 className="text-2xl mb-2">
          Understand History Through a Family Lens
        </h2>
        <p>
          {' '}
          This process enables interviewers to empathize with the unique
          challenges and triumphs of their family elders. By listening to their
          stories, they can better understand the struggles their elders faced
          in coming to and living in the United States, as seen through the lens
          of individual family experiences.
        </p>
        <h2 className="text-2xl mb-2">Preserve the Voices of Our Ancestors</h2>
        <p>
          {' '}
          Create a lasting legacy by recording the voices of ancestors who lived
          through pivotal moments in history. These recordings will allow future
          generations to hear firsthand accounts of the events that shaped their
          family’s journey.{' '}
        </p>
        <h2 className="text-2xl mb-2">
          Contribute to the History of the Chinese Diaspora in the US
        </h2>
        <p>
          Add to the collective narrative of the Chinese Diaspora in the United
          States by sharing your family's unique perspective. These personal
          stories will enrich the broader historical record and highlight the
          diverse experiences of Chinese Americans.
        </p>
      </div>
    </div>
  );
}
