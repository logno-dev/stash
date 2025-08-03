const { createClient } = require('@libsql/client');

async function migrateDatabase() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('Starting migration to add user_id column...');
    
    // First, add the column as nullable
    await client.execute('ALTER TABLE bookmarks ADD COLUMN user_id text');
    console.log('Added user_id column');
    
    // Set a default user_id for existing records (you can change this)
    const defaultUserId = 'default-user';
    await client.execute({
      sql: 'UPDATE bookmarks SET user_id = ? WHERE user_id IS NULL',
      args: [defaultUserId]
    });
    console.log(`Set default user_id for existing records: ${defaultUserId}`);
    
    console.log('Migration completed successfully!');
    console.log('Note: Existing bookmarks have been assigned to user_id:', defaultUserId);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

migrateDatabase();