import { PrismaClient } from "@/generated/prisma";

declare global {
    var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== 'production') {
    globalThis.prisma = db;
}

// globalThis.prisma: Added this because Nextjs has hot-reload feature and every time it reloads
// it would create a new Prisma client leading to potential connection issues
// so we keep prisma object preserved in the global object so it is preserved across the reloads