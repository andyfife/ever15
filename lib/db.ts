// lib/db.ts  ← or lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // This allows us to attach prisma to globalThis in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// This is the correct pattern for Next.js App Router + serverless
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
