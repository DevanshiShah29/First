import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaStamp?: string;
};

/** Bump when the generated client must replace the dev singleton. */
const SCHEMA_STAMP = "publish-status-v1";

// Use DIRECT_URL for the app client so Prisma interactive transactions work
// with Neon (the pooler URL is still used by `prisma db push` via schema).
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

/**
 * Opens a Prisma client against the direct Neon URL when it is set.
 * @example createPrismaClient() // PrismaClient
 */
function createPrismaClient() {
  return new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaStamp !== SCHEMA_STAMP
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaStamp = SCHEMA_STAMP;
}
