'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ClaraStory() {
  return (
    <motion.div
      key="clara"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold text-amber-600 text-center mb-12 tracking-tight">
        CLARA&apos;S STORY
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Text Left */}
        <div className="space-y-8 text-lg leading-relaxed text-gray-800">
          <p>
            I was the tour guide for Faith’s group when they visited Jiuzhaigou
            in 2011. During their visit, I shared insights about the culture and
            traditions of the Tibetans who migrated there years ago. At one
            point, I mentioned to Faith that I had a lot of energy and desire
            but lacked an outlet to channel it. She immediately asked if I would
            be interested in volunteering for EEF to document the oral history
            of Tibetan people in Jiuzhaigou. Although I had no prior experience
            in such work, I recognized it as a greatpportunity and immediately
            agreed.  Two members of the tour group—a professor of comparative
            literature and a neurosurgeon—generously provided financial support
            for the project. Later, Zhangyu was assigned to assist me, and
            together we worked on this project for nearly three years. In 2014,
            I had the honor of presenting my interview findings at the
            International Oral History Conference in Barcelona. Both Faith and
            the neurosurgeon, Jay Osgbury, were in the audience to cheer me on. 
            This experience was one of the most significant and memorable of my
            life.I met with many Tibetans in my guiding job.” To this day, I
            still miss the cool thin air on highlands, blue cloudless sky,
            Tibetans’ innocent smile and bright eyes.” I understood them more
            through interviews in this project, from face to heart, from book to
            real life.” “Their hearts full of simple goodness are shining like
            gold”. Sanbuzha was my first interviewee. The interviews drew us
            closer. We became brother and sister. We don’t have chance to meet
            frequently after the interviews, but we both know if one needs, the
            other one will be there. I called him when writing this
            essay, knowing that he is praying in Langmu Tibetan Monastery, not
            far from his hometown. Because today is the Spring Lantern Festival,
            a good day to practising in Buddhism. Perhaps what we did everything
            to pursue is what they disdain, whereas what we forgot along the way
            is what they cherish most.”  It was not only an oral history
            project. It helped me discover my potential and set me on the path
            toward achieving my dreams.
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
