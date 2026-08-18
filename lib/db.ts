import { PrismaClient } from '@prisma/client';

declare global {
  var __regnantPrisma: PrismaClient | undefined;
}

export const db = global.__regnantPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__regnantPrisma = db;
}
