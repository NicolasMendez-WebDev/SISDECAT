import prisma from './src/infrastructure/database/prisma';

async function main() {
  console.log("DATABASE_URL is:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  if (!process.env.DATABASE_URL) return;
  try {
    // Check if we can run a raw query
    console.log("Testing connection...");
    const result = await prisma.$queryRaw`SELECT 1 as one`;
    console.log("Connection success:", result);
  } catch (e) {
    console.error("Connection error:", e);
  }
}

main();
