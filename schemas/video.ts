import z from 'zod';

export const VISIBILITY_OPTIONS = ['PRIVATE', 'FRIENDS', 'PUBLIC'] as const;

export const videoEditSchema = z.object({
  name: z.string().min(1, 'Video name is required'),
  description: z.string().transform((v) => v || undefined),
  visibility: z.enum(VISIBILITY_OPTIONS),
  transcript: z.string().optional(),
});

export type VideoEditFormData = z.infer<typeof videoEditSchema>;
