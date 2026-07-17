import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// We need to use postgres/pg directly to run raw SQL since Supabase JS client 
// does not easily support running arbitrary DDL strings.
import pg from 'pg';
const { Client } = pg;

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL; // e.g. postgresql://postgres:password@host:6543/postgres
    
    if (!dbUrl) {
        console.error("DATABASE_URL is not set in .env");
        process.exit(1);
    }

    const sqlPath = 'C:\\Users\\userpc\\.gemini\\antigravity\\brain\\9092386d-8cb4-43ef-a5b2-055808e8ae1e\\supabase_migration_pricing.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("Connected to Supabase PostgreSQL.");
        console.log("Executing pricing engine migration script...");
        
        await client.query(sql);
        
        console.log("Migration executed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
