import { prisma } from './lib/db';

async function main() {
  try {
    console.log('Testing database connection...');

    // Test query
    const userCount = await prisma.user.count();
    console.log(`✓ Database connected successfully!`);
    console.log(`✓ Found ${userCount} users in database`);

    // Test Person query
    const personCount = await prisma.person.count();
    console.log(`✓ Found ${personCount} people in database`);

    // Test PersonPosition query
    const positionCount = await prisma.personPosition.count();
    console.log(`✓ Found ${positionCount} person positions in database`);

    console.log('\n✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
