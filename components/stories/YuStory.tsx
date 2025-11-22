'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function YuStory() {
  return (
    <div className="space-y-12">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-bold text-amber-600 text-center mb-4 tracking-tight"
      >
        YU&apos;S STORY
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-3xl md:text-4xl font-semibold text-gray-800 text-center mb-12 tracking-tight"
      >
        My Journey into the World of Oral History
      </motion.h2>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="space-y-6 text-lg leading-relaxed text-gray-800 max-w-4xl mx-auto"
      >
        <p>
          In 2009, Gansu Tianzhu No. 1 High School sought to expand its student
          volunteer activities. Initially focused on cleaning the local nursing
          home, the school decided to encourage students to engage with the
          elderly by listening to and recording their life stories, bringing
          them joy. This initiative inspired EEF to explore the field of oral
          history. In the blink of an eye, oral history has been a part of my
          life for 16 years. Reflecting on the scholars who helped us identify
          and refine our methods, connected us with the international oral
          history community, and facilitated the exchange of experiences, I am
          still filled with deep respect and gratitude.
        </p>

        <p>
          Many secondary school teachers have been with us for years, and
          without realizing it, their hair has turned gray. Like us, these
          teachers seem to have recognized something special in oral history. A
          student who explored local wooden frame house and interviewed its
          builders in Shidian, Yunnan, once remarked, "Amid the monotony of high
          school studies, the most unforgettable moments were when our teacher
          took us out to conduct interviews. It felt fresh and joyful." In
          Kaili, Guizhou, we asked a student what reward he wanted after
          interviewing his grandfather. He replied, "Now I often go to chat with
          my grandfather, and he says I’ve grown up. That’s enough for me." One
          student's parents, recognizing the value of their child learning about
          his grandfather's challenging childhood, education, and 35-year career
          in mining, attended all the interviews and assisted in clarifying
          mining-related terminology. Similarly, many mothers shared the
          challenges of working away from home and juggling gig jobs with their
          children, finding solace in reliving and reflecting on their
          experiences. Through these intimate exchanges, two generations jointly
          sorted through and reflected on the mother’s life journeys, lightening
          their emotional burdens.
        </p>

        <p>
          Oral history has also allowed me to visit unfamiliar places that have
          gradually become part of my spiritual home. In Chengyang Dong Village,
          Lun planted rice seedlings with us in the glutinous rice fields and
          shared the story of the sickle passed down from his father. After his
          father’s passing, Lun hadn’t been able to sharpen the sickle for a
          long time, as the vivid memory of his father doing so was too painful.
          On the Yongji Bridge, Old Yang the carpenter recounted the story of
          three generations of his family and their connection to the bridge—how
          his grandfather, as the village’s head donor, initially built it, and
          how his father, as the chief carpenter, repaired it. Each time the
          bridge was damaged by floods and rebuilt, it became a moment of unity
          for the village.
        </p>

        <p>
          Every time I am moved by these stories, I am reminded that
          relationships between people are not defined by fixed elements like
          kinship, occupation, or geography. Instead, they are dynamic, fluid,
          rich, and nurturing. Through oral history, the companions on this
          journey—whether they are students’ families, local cultural
          practitioners, volunteers, scholars, or grassroots researchers—support
          and nourish one another, becoming researchers and witnesses of lives
          and society.
        </p>
      </motion.div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto"
      >
        <Image
          src="/images/yu1.png"
          alt="Yu journey into orla history"
          width={600}
          height={600}
          className="object-cover w-full h-auto"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-lg font-medium">
            Clara documenting oral histories
          </p>
        </div>
      </motion.div>

      {/* Decorative divider */}
      <div className="mt-20 flex justify-center">
        <div className="w-24 h-1 bg-amber-500 rounded-full"></div>
      </div>
    </div>
  );
}
