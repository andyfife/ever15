import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function exportDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔍 Parsing DATABASE_URL...');

  // Parse the connection string
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = url.port;
  const database = url.pathname.slice(1).split('?')[0];
  const username = url.username;
  const password = url.password;

  const exportDir = path.join(process.cwd(), 'database-exports');

  // Create exports directory if it doesn't exist
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFile = path.join(exportDir, `ever15-export-${timestamp}.sql`);

  console.log(`📦 Exporting database to: ${exportFile}`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);

  // Set environment variable for password
  process.env.PGPASSWORD = password;

  try {
    // Export the database using pg_dump
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${exportFile}"`;

    console.log('\n🚀 Starting export...');
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('WARNING')) {
      console.error('⚠️  Warnings:', stderr);
    }

    // Get file size
    const stats = fs.statSync(exportFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Export completed successfully!`);
    console.log(`   File: ${exportFile}`);
    console.log(`   Size: ${fileSizeMB} MB`);

    return exportFile;
  } catch (error: any) {
    console.error('❌ Export failed:', error.message);
    throw error;
  } finally {
    // Clean up password from environment
    delete process.env.PGPASSWORD;
  }
}

// Run if executed directly
if (require.main === module) {
  exportDatabase()
    .then((file) => {
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Wait for AWS RDS instance to be created`);
      console.log(`   2. Update DATABASE_URL in .env to point to RDS`);
      console.log(`   3. Run: npx tsx scripts/import-database.ts ${file}`);
    })
    .catch((error) => {
      console.error('Export failed:', error);
      process.exit(1);
    });
}

export { exportDatabase };
