type PrismaModel = {
  findFirst(args: object): Promise<any>;
  findMany(args?: object): Promise<any[]>;
  findUnique(args: object): Promise<any>;
  upsert(args: object): Promise<any>;
  create(args: object): Promise<any>;
  createMany(args: object): Promise<any>;
  update(args: object): Promise<any>;
  deleteMany(args: object): Promise<any>;
  updateMany?(args: object): Promise<any>;
};

type PrismaClientLike = {
  workspace: PrismaModel;
  assessment: PrismaModel;
  contact: PrismaModel;
  assessmentAttempt: PrismaModel;
  emailEvent: PrismaModel;
  crmLinkage: PrismaModel;
  resultBand: PrismaModel;
  question: PrismaModel;
  scoreCategory: PrismaModel;
  assessmentSection: PrismaModel;
  $transaction<T>(callback: (transaction: PrismaClientLike) => Promise<T>): Promise<T>;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientLike };

export function getPrisma(): PrismaClientLike {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const PrismaClientConstructor = require("@prisma/client").PrismaClient as new () => PrismaClientLike;
  globalForPrisma.prisma = new PrismaClientConstructor();
  return globalForPrisma.prisma;
}
