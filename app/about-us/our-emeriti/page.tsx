// app/(main)/about-us/emeriti/page.tsx
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { WhoWeAreHero } from '@/components/WhoWeAreHero';

function englishName(
  name: string,
  prefix?: string | null,
  suffix?: string | null
) {
  const base = prefix ? `${prefix} ${name}` : name;
  return suffix ? `${base}, ${suffix}` : base;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

type EmeritiCategory = 'BOARD_OF_DIRECTORS' | 'ADVISORY_BOARD';

const CATEGORY_INFO: Record<
  EmeritiCategory,
  { label: string; subtitle: string }
> = {
  BOARD_OF_DIRECTORS: {
    label: 'Board of Directors Emeriti',
    subtitle: 'OUR LEADERS',
  },
  ADVISORY_BOARD: {
    label: 'Advisory Board Emeriti',
    subtitle: 'OUR THINK TANK',
  },
};

export default async function EmeritiPage() {
  const emeriti = await prisma.personPosition.findMany({
    where: { isEmeriti: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    include: { Person: true },
  });

  const groups = new Map<EmeritiCategory, typeof emeriti>();
  for (const pos of emeriti) {
    if (pos.category in CATEGORY_INFO) {
      const cat = pos.category as EmeritiCategory;
      const existing = groups.get(cat) || [];
      groups.set(cat, [...existing, pos]);
    }
  }
  const emeritiGroups = Array.from(groups.entries());

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {' '}
      <WhoWeAreHero subtitle="Leaders - Scholars - Professionals" />
      <div className="px-6 py-16 max-w-7xl mx-auto space-y-20">
        {/* Header */}
        <header className="text-center space-y-6">
          {/* LEFT-ALIGNED TEXT BLOCK */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed text-left">
              Our emeriti are a remarkable group of leaders, scholars, and
              professionals who have made significant contributions to education
              and society. Their collective wisdom, expertise, and dedication
              have been instrumental in shaping the Evergreen Education
              Foundation’s success and continued impact.{' '}
              <strong>We are deeply grateful for all of their service.</strong>
            </p>
          </div>
        </header>

        {/* Sections */}
        {emeritiGroups.map(([category, positions]) => {
          const info = CATEGORY_INFO[category];

          return (
            <section
              key={category}
              className="space-y-10 bg-white rounded-2xl p-8 md:p-12 shadow-sm"
            >
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {info.label}
                </h2>
                <p className="text-lg font-medium text-orange-600">
                  {info.subtitle}
                </p>
              </div>

              <Separator className="bg-gray-200" />

              <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(130px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                {positions.map((pos) => {
                  const p = pos.Person;
                  const url = pos.imageUrl ?? '';
                  const fallback = initials(p.name);
                  const displayName = englishName(
                    p.name,
                    p.honorificPrefix,
                    p.honorificSuffix
                  );

                  return (
                    <Card
                      key={pos.id}
                      className="overflow-hidden rounded-xl bg-white border border-gray-200 
                                 hover:shadow-lg hover:-translate-y-1 
                                 transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-2xl">
                        {' '}
                        {/* ← Changed from aspect-3/4 */}
                        {url ? (
                          <Image
                            src={url}
                            alt={p.name}
                            fill
                            className="object-cover object-top rounded-t-md transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 20vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gray-200 rounded-t-2xl">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-500">
                              {fallback}
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 text-center space-y-2">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {displayName}
                        </h3>

                        {p.nameZh && (
                          <p className="text-sm text-gray-600">{p.nameZh}</p>
                        )}

                        {pos.title && (
                          <p className="text-sm font-medium text-orange-600 line-clamp-2">
                            {pos.title}
                          </p>
                        )}

                        {pos.years && (
                          <p className="text-xs text-gray-600">{pos.years}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
