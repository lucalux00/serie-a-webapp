import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Creating news table...');
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        link TEXT NOT NULL UNIQUE,
        pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
        source VARCHAR(100) NOT NULL,
        clean_title VARCHAR(500),
        time VARCHAR(50),
        snippet TEXT,
        type VARCHAR(50) DEFAULT 'live',
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Success!');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

main();
