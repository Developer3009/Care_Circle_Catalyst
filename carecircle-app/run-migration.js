const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = 'postgresql://postgres:Care_Circle_30@db.xuedgbtguelwqeorhtte.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');
    
    const sql = fs.readFileSync(path.join(__dirname, 'supabase-schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Supabase tables created successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

migrate();
