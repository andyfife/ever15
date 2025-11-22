'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function FaithStory() {
  return (
    <div className="space-y-12">
      {/* Hero Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-bold text-amber-600 text-center mb-4 tracking-tight"
      >
        FAITH&apos;S STORY
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-3xl md:text-4xl font-semibold text-gray-800 text-center mb-12 tracking-tight"
      >
        How Family Stories Came to Be
      </motion.h2>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6 text-lg leading-relaxed text-gray-800"
        >
          <p>
            At a recent dinner gathering, I found myself seated next to the
            hostess, who shared her remarkable immigrant journey. She had come
            to the United States at the age of 12, and from then until she
            turned 18, she worked tirelessly in a sewing factory to save money
            for her education. Her determination and resilience eventually led
            her to earn a doctorate degree—a testament to her unwavering spirit.
          </p>

          <p>
            Her story, so inspiring yet rooted in the everyday struggles of an
            ordinary woman, reminded me of something student Huang had written
            in her oral history report. Huang had participated in our small
            projects program, where she interviewed her grandmothers. Reflecting
            on the experience, she wrote, “If we overlook the stories and
            emotions of everyday people, the true essence of history will be
            lost.”
          </p>

          <p>
            It was during that dinner, as I listened to my friend’s story and
            recalled Huang’s words, that I realized the profound importance of
            preserving the narratives of ordinary families within the Chinese
            Diaspora. These stories, though often untold, are the threads that
            weave together the fabric of our shared history. They carry the
            struggles, triumphs, and dreams of generations, and they deserve to
            be remembered.
          </p>

          <p>
            And so, Family Stories was born—a project dedicated to recording and
            celebrating the lives of everyday families, ensuring their voices
            are heard and their legacies endure.
          </p>

          <p>
            Our vision is for this to become a space where family stories are
            not only preserved but also evolve. As one family member interviews
            another, more relatives may join in, creating a ripple effect of
            storytelling. In this way, a rich and vibrant tapestry of their
            family history will be woven together.
          </p>

          <p className="text-xl font-medium text-amber-700 italic">
            Our guiding principle is that these interviews and other family
            records reflect the perspectives of the interviewee and their
            family. While the interview files are archived by EEF, the
            family—particularly the interviewee—retains control over who, aside
            from EEF staff, can access the files and under what circumstances.
          </p>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src="/images/founders/FaithChao.webp"
            alt="Faith Chao"
            width={800}
            height={1000}
            className="object-cover w-full h-auto"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-lg font-medium">
              Faith Chao, founder of EEF, sharing family stories
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative divider */}
      <div className="mt-20 flex justify-center">
        <div className="w-24 h-1 bg-amber-500 rounded-full"></div>
      </div>
    </div>
  );
}
