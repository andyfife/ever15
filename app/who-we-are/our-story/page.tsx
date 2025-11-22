'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, usePathname } from 'next/navigation';
import ClaraStory from '@/components/stories/ClaraStory';
import FaithStory from '@/components/stories/FaithStory';
import HuangStory from '@/components/stories/HuangStory';
import YuStory from '@/components/stories/YuStory';
import Image from 'next/image';
import React from 'react';

type StoryKey = 'our-story' | 'clara' | 'faith' | 'huang' | 'yu';

const STORIES: Record<
  StoryKey,
  React.FC<{ setSelected?: (v: StoryKey) => void }>
> = {
  'our-story': ({ setSelected }) => (
    <OurStoryContent setSelected={setSelected!} />
  ),
  clara: ClaraStory,
  faith: FaithStory,
  huang: HuangStory,
  yu: YuStory,
};

export default function FamilyStoriesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const initialStory = (pathname.split('/').pop() as StoryKey) || 'our-story';
  const [selected, setSelected] = useState<StoryKey>(
    STORIES[initialStory] ? initialStory : 'our-story'
  );

  const handleSelectStory = (story: StoryKey) => {
    setSelected(story);
    router.push(`/who-we-are/our-story/${story}`);
  };

  return (
    <div className="relative min-h-screen ">
      {/* Background faded */}

      {/* Container matches OUR MISSION */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Heading first, aligned same as OUR MISSION */}
        <h1 className="text-4xl mb-2 text-orange-500 text-left">OUR STORY</h1>

        {/* AnimatePresence story content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35 }}
          >
            {React.createElement(STORIES[selected], {
              setSelected: handleSelectStory,
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Our Story content
function OurStoryContent({
  setSelected,
}: {
  setSelected: (v: StoryKey) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-gray-700 text-lg leading-relaxed">
      <p>
        In 2009 we initiated Project Based Learning Programs in Western China.
        These small projects were the beginning of our Oral History story.
      </p>

      <p>
        Teachers guided students to interview their elders in rural western
        China. See{' '}
        <button
          onClick={() => setSelected('huang')}
          className="text-amber-600 font-medium underline hover:text-amber-700 transition-colors"
        >
          Student Huang’s story
        </button>
        .
      </p>

      <p>
        Many people joined our program in unexpected ways. See{' '}
        <button
          onClick={() => setSelected('clara')}
          className="text-amber-600 font-medium underline hover:text-amber-700 transition-colors"
        >
          Clara’s story
        </button>
        .
      </p>

      <p>
        Once Zhang Yu, EEF’s China program director 2009–2017, became involved
        in doing oral history, she has made this her life work. See{' '}
        <button
          onClick={() => setSelected('yu')}
          className="text-amber-600 font-medium underline hover:text-amber-700 transition-colors"
        >
          Zhang Yu's story here
        </button>
        .
      </p>

      <p>
        See{' '}
        <button
          onClick={() => setSelected('faith')}
          className="text-amber-600 font-medium underline hover:text-amber-700 transition-colors"
        >
          Faith Chao’s story
        </button>{' '}
        on how this Family Stories project was conceived.
      </p>

      {/* Inline image */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl">
        <Image
          src="/images/evergreen2.png"
          alt="Oral history project in Western China"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Bottom select */}
      <div className="max-w-md mx-auto pt-4">
        <Select onValueChange={(v) => setSelected(v as StoryKey)}>
          <SelectTrigger className="w-full text-lg h-14 bg-white/95 backdrop-blur shadow-xl">
            <SelectValue placeholder="Choose a personal story to read…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="huang">Student Huang</SelectItem>
            <SelectItem value="clara">Clara</SelectItem>
            <SelectItem value="yu">Zhang Yu</SelectItem>
            <SelectItem value="faith">Faith Chao</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
