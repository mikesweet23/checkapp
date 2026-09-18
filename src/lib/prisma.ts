type PrismaRecord = { id: string };
type PrismaModel = {
  upsert(args: object): Promise<PrismaRecord>;
  create(args: object): Promise<PrismaRecord>;
};
type PrismaClientLike = {
  workspace: PrismaModel;
  assessment: PrismaModel;
  contact: PrismaModel;
  assessmentAttempt: PrismaModel;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientLike };

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const PrismaClientConstructor = require("@prisma/client").PrismaClient as new () => PrismaClientLike;
  globalForPrisma.prisma = new PrismaClientConstructor();
  return globalForPrisma.prisma;
}
