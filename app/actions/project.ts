'use server';

import { contactSchema } from '@/schemas/project';
import { Contact } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { randomUUID } from 'crypto';

export async function createProject(unsafeData: unknown) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/login');
  }

  const parsed = contactSchema.safeParse(unsafeData);
  if (!parsed.success) return { success: false };

  try {
    const now = new Date().toISOString();

    await Contact.put({
      contactId: randomUUID(),
      userId: user.id,
      name: parsed.data.name ?? undefined,
      email: parsed.data.email ?? undefined,
      comment: parsed.data.comment ?? undefined,
      createdAt: now,
      updatedAt: now,
    }).go();

    return {
      success: true,
      message: "Thank you for your feedback! We'll get back to you soon.",
      errors: { name: '', email: '', comment: '', user_id: '' },
    };
  } catch (err) {
    console.error('submitContactForm error:', err);
    return { success: false, message: 'Failed to process form' };
  }
}
