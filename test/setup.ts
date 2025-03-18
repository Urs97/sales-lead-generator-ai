const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setup() {
  console.log('🛠️ Resetting test database...');

  await prisma.$executeRawUnsafe('SELECT 1');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);

  console.log('✅ Test database has been reset!');
}

setup()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
