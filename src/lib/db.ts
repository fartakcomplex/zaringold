import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Invalidate cached client if schema changed (forces fresh PrismaClient)
if (globalForPrisma.prisma && !(globalForPrisma.prisma as Record<string, unknown>).insuranceProvider) {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
