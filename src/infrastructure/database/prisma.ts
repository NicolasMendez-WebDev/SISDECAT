// import { PrismaClient } from '@prisma/client';

// If DATABASE_URL is not set (e.g., during development in AI Studio),
// we don't want the app to crash on startup. We export a dummy proxy
// or just instantiate it conditionally.
let prisma: any;

if (process.env.DATABASE_URL) {
  // prisma = new PrismaClient();
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} else {
  console.warn('⚠️ DATABASE_URL is not set. PrismaClient will not be initialized. Using mock data is recommended.');
  // Create a dummy proxy that throws a clear error if someone tries to use it without a DB
  prisma = new Proxy({} as any, {
    get: (target, prop) => {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      throw new Error(`Prisma is not initialized because DATABASE_URL is missing. Attempted to access: ${String(prop)}`);
    }
  });
}

export default prisma;
