import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqliteDbPath = path.join(__dirname, 'hospital.db');

// Load environment variables from .env.local
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.log("No .env.local file loaded:", e.message);
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hospital_db';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const ssl = connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('neon.tech')
  ? { rejectUnauthorized: false }
  : false;

const tablesToMigrate = [
  {
    name: 'doctors',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `
  },
  {
    name: 'staff',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        password TEXT NOT NULL
      )
    `
  },
  {
    name: 'patients',
    idCol: 'id',
    isSerial: false,
    schema: `
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        contact TEXT NOT NULL,
        address TEXT,
        assignedDoctorId INTEGER,
        status TEXT NOT NULL,
        diagnosis TEXT,
        prescription TEXT,
        issuedMedication TEXT,
        paymentStatus TEXT NOT NULL,
        wardBedId INTEGER,
        fatherOrHusbandName TEXT,
        alternatePhone TEXT,
        tokenNumber INTEGER,
        registrationDate TEXT,
        prescriptionImg TEXT,
        height TEXT,
        weight TEXT,
        bp TEXT,
        hr TEXT,
        spo2 TEXT,
        grbs TEXT,
        temp TEXT,
        complaints TEXT,
        pastHistory TEXT,
        examination TEXT,
        investigation TEXT,
        bmi TEXT
      )
    `
  },
  {
    name: 'patient_history',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS patient_history (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        visitId BIGINT,
        date TEXT NOT NULL,
        doctorName TEXT NOT NULL,
        diagnosis TEXT,
        prescription TEXT,
        prescriptionImg TEXT,
        issuedMedication TEXT,
        paymentStatus TEXT,
        status TEXT
      )
    `
  },
  {
    name: 'staff_attendance',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staffId INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        markedBy TEXT
      )
    `
  },
  {
    name: 'directory_ledger',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS directory_ledger (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        phone TEXT NOT NULL,
        details TEXT,
        amount REAL DEFAULT 0
      )
    `
  },
  {
    name: 'housekeeping_checklist',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS housekeeping_checklist (
        id SERIAL PRIMARY KEY,
        placeName TEXT NOT NULL,
        date TEXT NOT NULL,
        isCleaned INTEGER DEFAULT 0,
        isPlantsWatered INTEGER DEFAULT 0,
        notes TEXT
      )
    `
  },
  {
    name: 'medical_waste',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS medical_waste (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        wasteType TEXT NOT NULL,
        weight REAL NOT NULL,
        agencyName TEXT NOT NULL,
        billAmount REAL DEFAULT 0,
        billAttachment TEXT
      )
    `
  },
  {
    name: 'pharmacy_ledger',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS pharmacy_ledger (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        agencyName TEXT
      )
    `
  },
  {
    name: 'lab_logs',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS lab_logs (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        testName TEXT NOT NULL,
        dateOrdered TEXT NOT NULL,
        status TEXT NOT NULL,
        reportNotes TEXT
      )
    `
  },
  {
    name: 'vaccinations_log',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS vaccinations_log (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        vaccineName TEXT NOT NULL,
        dateGiven TEXT NOT NULL,
        dosage TEXT,
        nextDueDate TEXT
      )
    `
  },
  {
    name: 'injections_log',
    idCol: 'id',
    isSerial: true,
    schema: `
      CREATE TABLE IF NOT EXISTS injections_log (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        injectionName TEXT NOT NULL,
        dosage TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        dateGiven TEXT
      )
    `
  }
];

const runMigration = async () => {
  console.log("Starting PostgreSQL migration...");
  
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`SQLite database not found at ${sqliteDbPath}. Nothing to migrate.`);
    process.exit(1);
  }

  // 1. Connect to Postgres server and ensure database exists (local only)
  const isCloudDb = connectionString.includes('supabase.co') || connectionString.includes('neon.tech');

  if (!isCloudDb) {
    console.log("Connecting to local Postgres server...");
    const initClient = new pg.Client({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });

    try {
      await initClient.connect();
      const dbCheck = await initClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, ['hospital_db']);
      if (dbCheck.rows.length === 0) {
        console.log(`Database "hospital_db" does not exist. Creating it now...`);
        await initClient.query(`CREATE DATABASE "hospital_db"`);
        console.log(`Database "hospital_db" created successfully.`);
      }
    } catch (err) {
      console.warn("Failed to connect or create Postgres database:", err.message);
    } finally {
      try {
        await initClient.end();
      } catch (e) {}
    }
  }

  // 2. Open SQLite connection
  const sqliteDb = new sqlite3.Database(sqliteDbPath);
  const sqliteAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  // 3. Connect to target database
  console.log("Connecting to target database...");
  const pgClient = new pg.Client({
    connectionString,
    ssl
  });
  try {
    await pgClient.connect();
    console.log("Connected to target PostgreSQL database successfully.");

    // 4. Create Tables
    for (const table of tablesToMigrate) {
      console.log(`Creating table ${table.name} in PostgreSQL...`);
      await pgClient.query(table.schema);
    }

    // 5. Migrate Data Table-by-Table
    for (const table of tablesToMigrate) {
      console.log(`Migrating table: ${table.name}...`);
      
      // Read from SQLite
      const rows = await sqliteAll(`SELECT * FROM ${table.name}`);
      if (rows.length === 0) {
        console.log(`Table ${table.name} is empty in SQLite. Skipping data transfer.`);
        continue;
      }

      // Truncate target table to ensure fresh sync
      console.log(`Truncating table ${table.name} in PostgreSQL...`);
      await pgClient.query(`TRUNCATE TABLE ${table.name} CASCADE`);

      // Filter orphaned records referencing deleted patients
      let rowsToInsert = rows;
      if (['patient_history', 'lab_logs', 'vaccinations_log', 'injections_log'].includes(table.name)) {
        const patientsRes = await pgClient.query(`SELECT id FROM patients`);
        const validPatientIds = new Set(patientsRes.rows.map(r => r.id));
        rowsToInsert = rows.filter(r => {
          const pid = r.patientId || r.patientid;
          return validPatientIds.has(pid);
        });
        if (rows.length !== rowsToInsert.length) {
          console.log(`Filtered out ${rows.length - rowsToInsert.length} orphaned rows from ${table.name} due to foreign key constraints.`);
        }
      }

      if (rowsToInsert.length === 0) {
        console.log(`No valid rows to insert into ${table.name} after filtering.`);
        continue;
      }

      console.log(`Found ${rowsToInsert.length} records in SQLite for ${table.name}. Transferring...`);
      
      // Build dynamic INSERT query
      const columns = Object.keys(rowsToInsert[0]);
      const columnsCsv = columns.map(c => `"${c.toLowerCase()}"`).join(', ');
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      const insertQuery = `INSERT INTO ${table.name} (${columnsCsv}) VALUES (${placeholders})`;

      // Insert batch
      for (const row of rowsToInsert) {
        const values = columns.map(c => row[c]);
        await pgClient.query(insertQuery, values);
      }

      console.log(`Transferred ${rowsToInsert.length} records for ${table.name}.`);

      // 6. Reset primary key sequence counters if serial
      if (table.isSerial) {
        console.log(`Resetting primary key auto-increment sequence for ${table.name}...`);
        await pgClient.query(
          `SELECT setval(pg_get_serial_sequence($1, $2), coalesce(max(${table.idCol}), 1)) FROM ${table.name}`,
          [table.name, table.idCol]
        );
      }
    }

    console.log("\nMigration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
};

runMigration();
