// components/who-we-are-hero.tsx
interface WhoWeAreHeroProps {
  subtitle?: string;
}

export function WhoWeAreHero({ subtitle }: WhoWeAreHeroProps) {
  return (
    <section className="relative w-full h-96 overflow-hidden">
      {/* 🎥 Background video */}
      <video
        src="/TeacherAnd2Students.mov"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 🔲 Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ✨ Text content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          WHO WE ARE
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-2xl max-w-2xl">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
