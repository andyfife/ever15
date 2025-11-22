// app/page.tsx

import FormDialog from '@/components/FormDialog';
import { Suspense } from 'react';

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <section>
        <h1 className="text-2xl text-black font-bold mb-2">
          We Love To Hear From You
        </h1>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">The Vision</h2>
        <p>
          At Evergreen Education Foundation, we value the voices of those who
          visit our website and engage with our mission. As a nonprofit
          dedicated to expanding educational opportunities, we thrive on
          community input, feedback, and shared experiences. Whether you are a
          donor, educator, student, or supporter, your thoughts help us improve
          and grow. We invite you to share your insights, questions, or ideas
          with us. Your feedback allows us to better serve students, enhance our
          programs, and strengthen our impact. Reach out to us—we’d love to hear
          your story and explore ways to collaborate in making a difference!
        </p>
      </section>

      {/* <section>
        <ContactFormDialog />

      </section> */}
      <section>
        <Suspense>
          <FormDialog />
        </Suspense>
      </section>
    </div>
  );
}
