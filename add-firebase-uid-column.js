
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addFirebaseUidColumn() {
  console.log('🔧 Adding Firebase UID column to users table...');
  
  try {
    // Check if firebase_uid column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'firebase_uid'
    `);

    if (columnCheck.rows.length === 0) {
      // Add firebase_uid column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN firebase_uid VARCHAR(255) UNIQUE
      `);
      console.log('✅ Added firebase_uid column to users table');
    } else {
      console.log('ℹ️  firebase_uid column already exists');
    }

    // Check if photo_url column exists
    const photoUrlCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'photo_url'
    `);

    if (photoUrlCheck.rows.length === 0) {
      // Add photo_url column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN photo_url TEXT
      `);
      console.log('✅ Added photo_url column to users table');
    } else {
      console.log('ℹ️  photo_url column already exists');
    }

    // Check if email_verified column exists
    const emailVerifiedCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);

    if (emailVerifiedCheck.rows.length === 0) {
      // Add email_verified column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT false
      `);
      console.log('✅ Added email_verified column to users table');
    } else {
      console.log('ℹ️  email_verified column already exists');
    }

    console.log('🎉 Database schema updated successfully for Google authentication!');

  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

addFirebaseUidColumn();
