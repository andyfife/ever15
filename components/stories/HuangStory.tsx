'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HuangStory() {
  return (
    <motion.div
      key="huang"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold text-amber-600 text-center mb-12 tracking-tight">
        HUANG&apos;S STORY
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Text Left */}
        <div className="space-y-8 text-lg leading-relaxed text-gray-800">
          <p>
            I was the tour guide for Faith’s group when they visited Jiuzhaigou
            in 2011...
          </p>
          <p>
            Two members of the tour group—a professor of comparative literature
            and a neurosurgeon—generously provided financial support...
          </p>
          <p className="text-xl font-medium text-amber-700 italic">
            It was not only an oral history project — it helped me discover my
            potential and set me on the path toward achieving my dreams.
          </p>
        </div>

        {/* Image Right */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/images/clara3.png"
            alt="Clara with Tibetan elders in Jiuzhaigou"
            width={800}
            height={1000}
            className="object-cover w-full h-auto"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8">
            <p className="text-white text-lg font-medium">
              Clara documenting oral histories in Jiuzhaigou
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
