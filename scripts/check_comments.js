const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        // Check existing comments
        const comments = await prisma.comments.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        console.log('Recent comments:', JSON.stringify(comments, null, 2));

        // Get a valid product and user for testing
        const product = await prisma.products.findFirst({ select: { id: true } });
        const user = await prisma.user.findFirst({ select: { id: true } });
        console.log('\nTest product:', product);
        console.log('Test user:', user);

        if (product && user) {
            // Test creating a comment with the same structure as socket payload
            const payload = { productId: product.id, userId: user.id, content: 'Test comment from script' };
            console.log('\nCreating with payload:', JSON.stringify(payload));
            const created = await prisma.comments.create({ data: payload });
            console.log('Created successfully:', JSON.stringify(created, null, 2));

            // Clean up
            await prisma.comments.delete({ where: { id: created.id } });
            console.log('Cleaned up test comment');
        } else {
            console.log('No product or user found for testing');
        }
    } catch (e) {
        console.error('Error:', e.message);
        console.error('Full error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
