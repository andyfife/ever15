import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

async function importDatabase(sqlFile: string) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!fs.existsSync(sqlFile)) {
    throw new Error(`SQL file not found: ${sqlFile}`);
  }

  console.log('🔍 Parsing DATABASE_URL...');

  // Parse the connection string
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = url.port;
  const database = url.pathname.slice(1).split('?')[0];
  const username = url.username;
  const password = url.password;

  console.log(`📥 Importing database from: ${sqlFile}`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);

  // Set environment variable for password
  process.env.PGPASSWORD = password;

  try {
    // Import the database using psql
    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${sqlFile}"`;

    console.log('\n🚀 Starting import...');
    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log(stdout);
    }

    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('SET')) {
      console.error('⚠️  Warnings:', stderr);
    }

    console.log(`\n✅ Import completed successfully!`);

    return true;
  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    throw error;
  } finally {
    // Clean up password from environment
    delete process.env.PGPASSWORD;
  }
}

// Run if executed directly
if (require.main === module) {
  const sqlFile = process.argv[2];

  if (!sqlFile) {
    console.error('Usage: npx tsx scripts/import-database.ts <path-to-sql-file>');
    process.exit(1);
  }

  importDatabase(sqlFile)
    .then(() => {
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Run: npx prisma db pull`);
      console.log(`   2. Run: npx prisma generate`);
      console.log(`   3. Test your application`);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importDatabase };
