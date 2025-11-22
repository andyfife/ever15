import z from 'zod';

export const PROJECT_STATUSES = ['PRIVATE', 'FRIENDS', 'PUBLIC'] as const;

export const projectSchema = z.object({
  name: z.string().min(1),
  status: z.enum(PROJECT_STATUSES),
  description: z.string().transform((v) => v || undefined),
  // notifications: z.object({
  //   email: z.boolean(),
  //   sms: z.boolean(),
  //   push: z.boolean(),
  // }),
  // users: z
  //   .array(z.object({ email: z.email() }))
  //   .min(1)
  //   .max(5),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  comment: z.string().min(1, 'Comment is required'),
  user_id: z.string().optional(), // match Prisma field
});
