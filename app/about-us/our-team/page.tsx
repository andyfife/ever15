// app/(main)/about-us/our-team/page.tsx
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';

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

// All team categories (current only)
type TeamCategory =
  | 'BOARD_OF_DIRECTORS'
  | 'ADVISORY_BOARD'
  | 'STAFF_AND_VOLUNTEERS';

const CATEGORY_INFO: Record<TeamCategory, { label: string; subtitle: string }> =
  {
    BOARD_OF_DIRECTORS: {
      label: 'Board of Directors',
      subtitle: 'OUR LEADERS',
    },
    ADVISORY_BOARD: {
      label: 'Advisory Board',
      subtitle: 'OUR THINK TANK',
    },
    STAFF_AND_VOLUNTEERS: {
      label: 'Staff & Volunteers',
      subtitle: 'OUR SUPPORT',
    },
  };

export default async function Page() {
  const currentTeam = await prisma.personPosition.findMany({
    where: { isEmeriti: false },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    include: { Person: true },
  });

  const groups = new Map<TeamCategory, typeof currentTeam>();
  for (const pos of currentTeam) {
    if (pos.category in CATEGORY_INFO) {
      const cat = pos.category as TeamCategory;
      const existing = groups.get(cat) || [];
      groups.set(cat, [...existing, pos]);
    }
  }
  const teamGroups = Array.from(groups.entries());

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {' '}
      <WhoWeAreHero subtitle="Leaders - Scholars - Professionals" />
      {/* ==================== CURRENT TEAM ==================== */}
      <section className="px-6 py-16 max-w-7xl mx-auto space-y-20">
        {teamGroups.map(([category, positions]) => {
          const info = CATEGORY_INFO[category];

          return (
            <div key={category} className="space-y-6">
              <div className="space-y-2 ">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {info.label}
                </h2>
                <p className="text-lg font-medium text-orange-600">
                  {info.subtitle}
                </p>
              </div>

              <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
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
                      className="group overflow-hidden border border-muted/40 rounded-2xl bg-background hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {' '}
                        {/* ← Changed from aspect-3/4 */}
                        {url ? (
                          <Image
                            src={url}
                            alt={p.name}
                            fill
                            className="object-cover object-top rounded-t-2xl transition-transform duration-500 group-hover:scale-105"
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

                      <CardContent className="p-4 text-center space-y-1">
                        <h3 className="text-base font-semibold leading-tight line-clamp-2">
                          {displayName}
                        </h3>
                        {p.nameZh && (
                          <p className="text-sm text-muted-foreground">
                            {p.nameZh}
                          </p>
                        )}
                        {pos.title && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {pos.title}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
