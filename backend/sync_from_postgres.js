import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqliteDbPath = path.join(__dirname, 'hospital.db');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rpntechworld24@db.keofupiarihqkxnnmloy.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sqliteDb = new sqlite3.Database(sqliteDbPath);

const run = async () => {
  console.log("Starting data migration from Supabase PostgreSQL to SQLite (hospital.db)...");

  await new Promise(r => sqliteDb.run("PRAGMA foreign_keys = OFF;", r));

  const tables = [
    'doctors',
    'staff',
    'patients',
    'patient_history',
    'staff_attendance',
    'directory_ledger',
    'housekeeping_checklist',
    'medical_waste',
    'pharmacy_ledger',
    'lab_logs',
    'vaccinations_log',
    'injections_log'
  ];

  for (const table of tables) {
    try {
      const pgRes = await pool.query(`SELECT * FROM ${table}`);
      const rows = pgRes.rows;
      console.log(`Fetched ${rows.length} rows from PostgreSQL table '${table}'`);

      if (rows.length > 0) {
        await new Promise((resolve, reject) => {
          sqliteDb.run(`DELETE FROM ${table}`, (err) => err ? reject(err) : resolve());
        });

        const cols = Object.keys(rows[0]);
        const placeholders = cols.map(() => '?').join(', ');
        const insertSql = `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = cols.map(c => {
            const val = row[c];
            if (val !== null && typeof val === 'object') {
              return JSON.stringify(val);
            }
            return val;
          });

          await new Promise((resolve, reject) => {
            sqliteDb.run(insertSql, values, (err) => {
              if (err) {
                console.error(`Error inserting into ${table}:`, err.message);
                resolve();
              } else {
                resolve();
              }
            });
          });
        }
        console.log(`Successfully migrated ${rows.length} rows to SQLite table '${table}'`);
      }
    } catch (e) {
      console.error(`Failed to migrate table '${table}':`, e.message);
    }
  }

  await new Promise(r => sqliteDb.run("PRAGMA foreign_keys = ON;", r));
  await pool.end();
  console.log("Migration finished successfully!");
};

run().catch(console.error);
