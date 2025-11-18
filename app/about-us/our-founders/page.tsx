import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export default function OurFoundersPage() {
  return (
    <div className="px-6 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-orange-400">
          Our Founders
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Visionaries of Change · Architects of Opportunity
        </p>
      </section>

      {/* Founder: Dr. Faith Chao */}
      <Card className="border border-muted/40 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl">
        <CardContent className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start p-6">
          <div className="relative w-full aspect-3/4 max-w-[200px] mx-auto md:mx-0 rounded-2xl overflow-hidden">
            <Image
              src="/images/founders/FaithChao.webp"
              alt="Dr. Faith Chao"
              fill
              className="object-cover"
              sizes="(min-width:1024px) 200px, 50vw"
            />
          </div>

          <div className="space-y-4 leading-relaxed text-base text-muted-foreground">
            <h2 className="text-2xl font-bold text-orange-400">
              Dr. Faith Chao — Founder & President (2001–2017)
            </h2>

            <p>
              Dr. Faith Chao founded the Evergreen Education Foundation in 2001
              and served as President until December 2017. Her vision is simple
              yet impactful – to inspire people to bring educational
              opportunities to children in rural China, especially through
              libraries.
            </p>

            <p>
              In 2004, Dr. Chao’s vision and leadership resulted in the China
              Evergreen Rural Library (CERL) Service Center receiving
              international recognition by winning the{' '}
              <strong>
                Bill & Melinda Gates Foundation Access to Learning US$500,000
                Award
              </strong>
              . She also provided important advice to libraries and library
              staff: due to EEF support for circulation automation and the
              addition of information services, Tongwei County Library received
              national recognition and promotion to the second tier of public
              libraries in China.
            </p>

            <p>
              Dr. Chao promoted staff development through many EEF programs. In
              2012, she personally led 30 rural Chinese teachers and librarians
              on a study tour to visit libraries, educational, and cultural
              institutions in Taiwan. Throughout the years, she was instrumental
              in promoting information literacy in rural China.
            </p>

            <p>
              As President, Dr. Chao provided leadership by initiating the
              following programs:
            </p>

            <ul className="list-disc pl-6 space-y-1">
              <li>Teacher Professional Development & Training Series (2002)</li>
              <li>
                Information Technology in Education (ITIE) Conference (2004)
              </li>
              <li>
                Project-Based Learning: 30–50 EEF-supported projects annually
                (2009)
              </li>
              <li>
                Online Courses for Teacher Professional Development & Training
                (2011)
              </li>
              <li>
                Engaging Chinese public libraries in projects related to Local
                Culture and Oral History (2014)
              </li>
              <li>
                Makerspace projects and programs for EEF schools, teachers, and
                students (2014)
              </li>
              <li>
                EEF Project-Based Learning workshops for teachers in rural China
                Schools (2015)
              </li>
              <li>Creating Makerspaces in China Public Libraries (2016)</li>
            </ul>

            <p>
              Additionally, she represented EEF internationally through
              presentations at major conferences, including:
            </p>

            <ul className="list-disc pl-6 space-y-1">
              <li>
                <em>
                  Benefits from NGO–School library cooperation: the China
                  experience
                </em>
                , 2008, International Association of School Librarianship
                Conference, Berkeley, CA.
              </li>
              <li>
                <em>
                  A model for expanding information resources to China’s rural
                  communities
                </em>
                , 2007, Harvard University, Cambridge, MA.
              </li>
              <li>
                <em>
                  Expanding information access to China’s rural communities
                </em>
                , 2007, World Library and Information Congress, Durban, South
                Africa.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Founder: Dr. Eileen Tang */}
      <Card className="border border-muted/40 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl">
        <CardContent className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start p-6">
          <div className="relative w-full aspect-3/4 max-w-[200px] mx-auto md:mx-0 rounded-2xl overflow-hidden">
            <Image
              src="/images/founders/Eileen2.webp"
              alt="Dr. Eileen Tang"
              fill
              className="object-cover"
              sizes="(min-width:1024px) 200px, 50vw"
            />
          </div>

          <div className="space-y-4 leading-relaxed text-base text-muted-foreground">
            <h2 className="text-2xl font-bold text-orange-400">
              Dr. Eileen Tang — Co-Founder
            </h2>

            <p>
              Dr. Eileen Tang co-founded the Evergreen Education Foundation in
              2001 and remained deeply involved in its mission until her passing
              in 2017. Her journey with Evergreen began when she visited Qinghai
              in 2001, where she witnessed firsthand the immense challenges
              faced by students in rural communities.
            </p>

            <p>
              Moved by their resilience and determination to pursue education
              despite hardships, she returned from her visit with a strong
              resolve to make a difference. Immediately, she established the{' '}
              <strong>Evergreen Foundation Scholarship Program</strong>,
              beginning with support for 10 students at PingAn Middle School,
              the very school she had toured. She personally championed the
              growth of the initiative, ensuring that more students had access
              to educational opportunities.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Founder: Dr. Ruth Hafter */}
      <Card className="border border-muted/40 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl">
        <CardContent className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start p-6">
          <div className="relative w-full aspect-3/4 max-w-[200px] mx-auto md:mx-0 rounded-2xl overflow-hidden">
            <Image
              src="/images/founders/RuthHafter.webp"
              alt="Dr. Ruth Hafter"
              fill
              className="object-cover"
              sizes="(min-width:1024px) 200px, 50vw"
            />
          </div>

          <div className="space-y-4 leading-relaxed text-base text-muted-foreground">
            <h2 className="text-2xl font-bold text-orange-400">
              Dr. Ruth Hafter — Co-Founder
            </h2>

            <p>
              Dr. Ruth Hafter co-founded the Evergreen Education Foundation in
              2001 and helped organize the Foundation’s initial workshops and
              conferences. She was the main presenter at the 2002 workshop in
              Xining with over 60 participants—a groundbreaking event that set
              the tone for all future Evergreen programs.
            </p>

            <p>
              Dr. Hafter held leadership positions in several academic
              libraries: Head Librarian at St. Mary’s University (Halifax,
              Canada, 1969–1975), Library Director at Sonoma State University
              (Rohnert Park, CA, 1978–1986), Dean of the Library at San José
              State University (1986–1991), and Professor at San José State
              School of Library & Information Science (1987–1999).
            </p>

            <p>
              In 1986, she published{' '}
              <em>
                Academic Librarians and Cataloging Networks: Visibility, Quality
                Control, and Professional Status
              </em>{' '}
              (Praeger). Dr. Hafter earned her Ph.D. in Library and Information
              Studies from the University of California, Berkeley; MLS from
              Columbia University; Harvard-Radcliffe Program in Business
              Administration (HRPBA) certificate; and BA in History and
              Economics, cum laude, from Brandeis University.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
