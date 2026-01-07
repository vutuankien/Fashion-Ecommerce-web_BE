const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.shop.count();
    const first = await prisma.shop.findMany({ take: 10 });
    console.log('shop count:', count);
    console.log('first shops (up to 10):', JSON.stringify(first, null, 2));
  } catch (err) {
    console.error('Error querying shops:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
