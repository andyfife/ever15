'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HuangStoryPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold text-amber-600 text-center mb-12 tracking-tight"
        >
          STUDENT HUANG&apos;S STORY
        </motion.h1>

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
              Student Huang was a high school student from a rural county in
              western China. Under the guidance of her teacher, Mr. Tian, she
              conducted interviews with her grandmothers, who had lived through
              extreme poverty and a period of famine at their county, where many
              people perished. The grandmother, with her courage, kindness, and
              hard work, pulled herself and two children, and even some
              neighbors, back from the brink of starvation and death during that
              period in the middle of the 20th century. In her report, Huang
              vividly documented her grandmothers’ experiences, offering a
              poignant glimpse into that unforgettable era.
            </p>

            <p>
              But, what was equally impressive is the following quote from her
              report: <br />
              <strong>
                “如果忽视普通个人的经历与感受，就没人知道历史意味着什么。所有的长辈，他们亲历的历史是活的，是最接近真实的。这样的真实与鲜活在祖辈口口相传中存在与流传，让我觉得感动。我开始希望自己能做些什么。于是询问，整理，记录。”
              </strong>
            </p>

            <p>
              "If we overlook the stories and emotions of everyday people, the
              true essence of history will be lost. The elders carry within them
              lived experiences that are vibrant and closest to the truth. This
              authenticity and richness are preserved and passed down through
              the oral traditions of our ancestors, which deeply inspired me. It
              sparked a desire within me to take action. So, I began to ask
              questions, gather stories, and document them."
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
              src="/images/huang1.png"
              alt="Student Huang"
              width={800}
              height={1000}
              className="object-cover w-full h-auto"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-lg font-medium">
                Student Huang documenting oral histories in western China
              </p>
            </div>
          </motion.div>
        </div>

        {/* Optional decorative divider */}
        <div className="mt-20 flex justify-center">
          <div className="w-24 h-1 bg-amber-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
