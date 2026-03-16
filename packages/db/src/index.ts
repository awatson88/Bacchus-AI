import { PrismaClient } from "@prisma/client";

export const databaseProvider = "postgresql";
export const databaseUrlEnvVar = "DATABASE_URL";

export function createPrismaClient() {
  return new PrismaClient();
}

export type BacchusPrismaClient = PrismaClient;
