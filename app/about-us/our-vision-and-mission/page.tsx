import Image from 'next/image';

export default function Page() {
  const s3base = process.env.BASE_ASSET_URL; // Optional if you want S3 later

  return (
    <div className="flex flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <section className="relative w-full min-h-96 overflow-hidden">
        <video
          src="/TeacherAnd2Students.mov"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            Who We Are
          </h1>
        </div>
      </section>

      {/* 🔸 CONTENT SECTIONS */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <section>
          <h1 className="text-4xl mb-2 text-orange-500">THE BEGINNING</h1>
          <h2 className="text-2xl mb-2">How It All Started</h2>
          <p>
            The Evergreen Education Foundation (EEF) was spearheaded and founded
            by Dr. Faith Chao in 2001 along with co-founders Dr. Eileen Tang and
            Dr. Ruth Hafter. Seed money was donated by Mr. Richard Hsin, a Hong
            Kong entrepreneur and philanthropist. Since our inception, we have
            created scholarships, workshops, conferences, and project
            opportunities for rural China. EEF consistently receives strong and
            dedicated support from Chinese and American professionals and
            academics.
          </p>
        </section>

        <section>
          <h1 className="text-4xl text-orange-400 mb-2">THE VISION</h1>
          <h2 className="text-2xl mb-2">Imagine</h2>
          <p>
            Imagine every child in rural China having access to state-of-the-art
            educational opportunities...
          </p>
        </section>

        <section>
          <h1 className="text-4xl font-bold text-orange-400 mb-1">
            THE MISSION
          </h1>
        </section>

        {/* 🔸 Mission Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card
            title="Improve Access"
            description="Improve access to learning opportunities of high quality for children and young adults in rural and low-income areas in China."
            imgSrc="/images/journeyon.png"
            alt="Improve access to learning opportunities of high quality for children and young adults in rural and low-income areas in China."
          />
          <Card
            title="Preserve Heritage"
            description="Help the Chinese diaspora explore, learn about, and understand their family legacies, cultural and historical backgrounds."
            imgSrc="/images/heritage.png"
            alt="Help the Chinese diaspora explore"
          />
          <Card
            title="Lifelong Learning"
            description="Nurture lifelong learning habits through initiatives and programs promoting various literacies related to essential life skills."
            imgSrc="/images/lifelong.png"
            alt="Encouraging lifelong learning and personal development"
          />
          <Card
            title="Bridging Opportunities"
            description="Serve as a vital bridge in collaborative efforts to expand and enhance global learning opportunities for students."
            imgSrc="/images/bridging.png"
            alt="Connecting global learning opportunities for students"
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, description, imgSrc, alt }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="relative w-full h-56">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
        />
      </div>
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-orange-600 mb-3">{title}</h2>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
