'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Page() {
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
          CLARA&apos;S STORY
        </motion.h1>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8 text-lg leading-relaxed text-gray-800"
          >
            <p>
              I was the tour guide for Faith Chao’s group when they visited
              Jiuzhaigou in 2011. During their visit, I shared insights about
              the culture and traditions of the Tibetans who migrated there
              years ago. At one point, I mentioned to Faith that I had a lot of
              energy and desire but lacked an outlet to channel it. She
              immediately asked if I would be interested in volunteering for EEF
              to document the oral history of Tibetan people in Jiuzhaigou.
              Although I had no prior experience in such work, I recognized it
              as a great opportunity and immediately agreed.
            </p>

            <p>
              Two members of the tour group—a professor of comparative
              literature and a neurosurgeon—generously provided financial
              support for the project. Later, Zhangyu was assigned to assist me,
              and together we worked on this project for nearly three years. In
              2014, I had the honor of presenting my interview findings at the
              International Oral History Conference in Barcelona. Both Faith and
              the neurosurgeon, Jay Osgbury, were in the audience to cheer me
              on.
            </p>

            <p>
              This experience was one of the most significant and memorable of
              my life. I met with many Tibetans in my guiding job. To this day,
              I still miss the cool thin air on the highlands, the blue
              cloudless sky, Tibetans’ innocent smiles and bright eyes. Through
              these interviews I understood them more deeply—from face to heart,
              from book to real life. Their hearts, full of simple goodness,
              shine like gold. Sanbuzha was my first interviewee. The interviews
              drew us closer. We became brother and sister.
            </p>

            <p className="text-xl font-medium text-amber-700 italic">
              It was not only an oral history project — it helped me discover my
              potential and set me on the path toward achieving my dreams.
            </p>
          </motion.div>

          {/* Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main large image */}
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

            {/* Small floating collage images (adjust paths as needed) */}
            {/* <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-xl overflow-hidden shadow-xl border-4 border-white">
              <Image
                src="/images/clara-tibet-2.jpg"
                alt="Tibetan elder"
                fill
                className="object-cover"
              />
            </div> */}
            {/* <div className="absolute -top-6 -right-6 w-40 h-56 rounded-xl overflow-hidden shadow-xl border-4 border-white">
              <Image
                src="/images/clara-tibet-3.jpg"
                alt="Jiuzhaigou landscape"
                fill
                className="object-cover"
              />
            </div> */}
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
