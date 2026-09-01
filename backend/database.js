import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dns from 'dns';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqliteDbPath = path.join(__dirname, 'hospital.db');

// Load environment variables from .env and .env.local
['.env', '.env.local'].forEach(envFile => {
  try {
    const envPath = path.join(__dirname, envFile);
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
          process.env[key] = val.trim();
        }
      });
    }
  } catch (e) {
    console.log(`No ${envFile} file loaded:`, e.message);
  }
});

// Determine if we should connect to cloud/PostgreSQL:
// On Vercel / Production: connects to PostgreSQL (Supabase)
// On Localhost / Development: connects to local SQLite (hospital.db) so live changes do NOT affect localhost and vice-versa
const isVercel = !!process.env.VERCEL;
const isProd = process.env.NODE_ENV === 'production';
const usePostgresExplicitly = process.env.USE_POSTGRES === 'true';
const hasDatabaseUrl = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() && !process.env.DATABASE_URL.includes('sqlite'));

let rawConnectionString = (isVercel || isProd || usePostgresExplicitly || hasDatabaseUrl)
  ? (process.env.DATABASE_URL || 'postgresql://postgres.keofupiarihqkxnnmloy:rpntechworld24@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres')
  : null;

let connectionString = null;
if (rawConnectionString) {
  connectionString = rawConnectionString.trim().replace(/^DATABASE_URL\s*=\s*/i, '').replace(/^["']|["']$/g, '').trim();
}

let pgPool = null;
if (connectionString) {
  pgPool = new pg.Pool({
    connectionString,
    max: 15,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });
  console.log("Connected to PostgreSQL Database (Supabase Production)");
} else {
  console.log("Using Local SQLite Database (Localhost Isolation Active)");
}

let sqliteDb = null;
const getSqliteDb = async () => {
  if (sqliteDb) return sqliteDb;
  try {
    const sqlite3 = (await import('sqlite3')).default;
    sqliteDb = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) console.error("Failed to connect to SQLite database:", err.message);
      else console.log("Connected to SQLite database at:", sqliteDbPath);
    });
    sqliteDb.run("PRAGMA foreign_keys = ON;");
    return sqliteDb;
  } catch (e) {
    console.warn("SQLite not available (running on serverless):", e.message);
    return null;
  }
};

const convertToPgQuery = (query) => {
  let paramIdx = 1;
  // Replace ? with $1, $2, etc.
  let converted = query.replace(/\?/g, () => `$${paramIdx++}`);
  // Replace double-quoted column identifiers with lowercase identifiers for PostgreSQL
  converted = converted.replace(/"([a-zA-Z0-9_]+)"/g, (match, p1) => p1.toLowerCase());
  return converted;
};

export const dbRun = async (query, params = []) => {
  if (pgPool) {
    try {
      let pgQuery = convertToPgQuery(query);
      const isInsert = /^\s*INSERT\s+INTO/i.test(pgQuery);
      if (isInsert && !/RETURNING/i.test(pgQuery)) {
        pgQuery += ' RETURNING *';
      }
      const res = await pgPool.query(pgQuery, params);
      const firstRow = res.rows && res.rows[0] ? res.rows[0] : {};
      return {
        lastID: firstRow.id || firstRow.visitid || firstRow.patientid || Date.now(),
        rowsAffected: res.rowCount,
        ...firstRow
      };
    } catch (err) {
      console.error("PostgreSQL dbRun error:", err.message, "Query:", query);
      throw err;
    }
  }

  const sDb = await getSqliteDb();
  if (!sDb) throw new Error("Database connection not available");
  return new Promise((resolve, reject) => {
    sDb.run(query, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, rowsAffected: this.changes });
    });
  });
};

const camelCaseMap = {
  assigneddoctorid: 'assignedDoctorId',
  patientid: 'patientId',
  visitid: 'visitId',
  doctorname: 'doctorName',
  prescriptionimg: 'prescriptionImg',
  issuedmedication: 'issuedMedication',
  paymentstatus: 'paymentStatus',
  wardbedid: 'wardBedId',
  fatherorhusbandname: 'fatherOrHusbandName',
  motherorguardianname: 'motherOrGuardianName',
  bedadmissionpending: 'bedAdmissionPending',
  alternatephone: 'alternatePhone',
  tokennumber: 'tokenNumber',
  registrationdate: 'registrationDate',
  pasthistory: 'pastHistory',
  staffid: 'staffId',
  markedby: 'markedBy',
  placename: 'placeName',
  iscleaned: 'isCleaned',
  isplantswatered: 'isPlantsWatered',
  wastetype: 'wasteType',
  agencyname: 'agencyName',
  billamount: 'billAmount',
  billattachment: 'billAttachment',
  testname: 'testName',
  dateordered: 'dateOrdered',
  reportnotes: 'reportNotes',
  reportimg: 'reportImg',
  vaccinename: 'vaccineName',
  dategiven: 'dateGiven',
  nextduedate: 'nextDueDate',
  injectionname: 'injectionName',
  paidamount: 'paidAmount',
  feebreakdown: 'feeBreakdown',
  ischild: 'isChild',
  childga: 'childGa',
  childbirthdate: 'childBirthDate',
  childbirthweight: 'childBirthWeight',
  childplaceofbirth: 'childPlaceOfBirth',
  childdeliverytype: 'childDeliveryType',
  childnicuhistory: 'childNicuHistory',
  specialinvestigation: 'specialInvestigation',
  specialinvestigationnotes: 'specialInvestigationNotes',
  dob: 'dob',
  respiratoryrate: 'respiratoryRate',
  painscale: 'painScale',
  headcircumference: 'headCircumference',
  avpu: 'avpu',
  pharmacystatus: 'pharmacyStatus',
  injectionstatus: 'injectionStatus',
  trackinghistory: 'trackingHistory',
  previousdoctor: 'previousDoctor',
  pendingreassignment: 'pendingReassignment',
  reassignmentdeclined: 'reassignmentDeclined',
  wardhistory: 'wardHistory',
  lastlogindate: 'lastLoginDate'
};

const camelizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelizeObject);

  const newObj = {};
  for (const key of Object.keys(obj)) {
    const mappedKey = camelCaseMap[key.toLowerCase()] || key;
    const val = obj[key];
    newObj[mappedKey] = camelizeObject(val);
  }
  return newObj;
};

export const dbAll = async (query, params = []) => {
  if (pgPool) {
    try {
      const pgQuery = convertToPgQuery(query);
      const res = await pgPool.query(pgQuery, params);
      return camelizeObject(res.rows || []);
    } catch (err) {
      console.error("PostgreSQL dbAll error:", err.message, "Query:", query);
      throw err;
    }
  }

  const sDb = await getSqliteDb();
  if (!sDb) return [];
  return new Promise((resolve, reject) => {
    sDb.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(camelizeObject(rows || []));
    });
  });
};

export const dbGet = async (query, params = []) => {
  if (pgPool) {
    try {
      const pgQuery = convertToPgQuery(query);
      const res = await pgPool.query(pgQuery, params);
      const row = res.rows && res.rows.length > 0 ? res.rows[0] : null;
      return camelizeObject(row) || null;
    } catch (err) {
      console.error("PostgreSQL dbGet error:", err.message, "Query:", query);
      throw err;
    }
  }

  const sDb = await getSqliteDb();
  if (!sDb) return null;
  return new Promise((resolve, reject) => {
    sDb.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(camelizeObject(row) || null);
    });
  });
};

// Initialize Database Tables
export const initDB = async () => {
  if (pgPool) {
    // Ensure all tables exist in PostgreSQL
    const tables = [
      `CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        lastlogindate TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        password TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        contact TEXT NOT NULL,
        email TEXT,
        address TEXT,
        assignedDoctorId INTEGER,
        status TEXT NOT NULL,
        diagnosis TEXT,
        prescription TEXT,
        issuedMedication TEXT,
        paymentStatus TEXT NOT NULL,
        wardBedId TEXT,
        fatherOrHusbandName TEXT,
        motherOrGuardianName TEXT,
        bedAdmissionPending INTEGER DEFAULT 0,
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
        bmi TEXT,
        paidAmount NUMERIC DEFAULT 0,
        feeBreakdown TEXT,
        isChild INTEGER DEFAULT 0,
        childGa TEXT,
        childBirthDate TEXT,
        childBirthWeight TEXT,
        childPlaceOfBirth TEXT,
        childDeliveryType TEXT,
        childNicuHistory TEXT,
        specialInvestigation INTEGER DEFAULT 0,
        specialInvestigationNotes TEXT,
        dob TEXT,
        respiratoryRate TEXT,
        painScale TEXT,
        headCircumference TEXT,
        avpu TEXT,
        pharmacyStatus TEXT DEFAULT 'N/A',
        injectionStatus TEXT DEFAULT 'N/A',
        trackingHistory TEXT,
        previousDoctor TEXT,
        pendingReassignment TEXT,
        reassignmentDeclined TEXT,
        wardHistory TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS patient_history (
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
      )`,
      `CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staffId INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        markedBy TEXT,
        shift TEXT DEFAULT 'Day'
      )`,
      `CREATE TABLE IF NOT EXISTS directory_ledger (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        phone TEXT NOT NULL,
        details TEXT,
        amount REAL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS housekeeping_checklist (
        id SERIAL PRIMARY KEY,
        placeName TEXT NOT NULL,
        date TEXT NOT NULL,
        isCleaned INTEGER DEFAULT 0,
        isPlantsWatered INTEGER DEFAULT 0,
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS medical_waste (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        wasteType TEXT NOT NULL,
        weight REAL NOT NULL,
        agencyName TEXT NOT NULL,
        billAmount REAL DEFAULT 0,
        billAttachment TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS pharmacy_ledger (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        agencyName TEXT,
        paymentMethod TEXT DEFAULT 'Cash'
      )`,
      `CREATE TABLE IF NOT EXISTS lab_logs (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        testName TEXT NOT NULL,
        dateOrdered TEXT NOT NULL,
        status TEXT NOT NULL,
        reportNotes TEXT,
        reportImg TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS vaccinations_log (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        vaccineName TEXT NOT NULL,
        dateGiven TEXT NOT NULL,
        dosage TEXT,
        nextDueDate TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS injections_log (
        id SERIAL PRIMARY KEY,
        patientId TEXT NOT NULL,
        injectionName TEXT NOT NULL,
        dosage TEXT NOT NULL,
        route TEXT DEFAULT 'IV',
        frequency TEXT DEFAULT 'STAT',
        isStat INTEGER DEFAULT 1,
        administeredBy TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Pending',
        dateGiven TEXT
      )`
    ];

    const pgAlterColumns = [
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS motherOrGuardianName TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS bedAdmissionPending INTEGER DEFAULT 0`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS paidAmount NUMERIC DEFAULT 0`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS feeBreakdown TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS isChild INTEGER DEFAULT 0`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childGa TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childBirthDate TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childBirthWeight TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childPlaceOfBirth TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childDeliveryType TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS childNicuHistory TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS specialInvestigation INTEGER DEFAULT 0`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS specialInvestigationNotes TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS respiratoryRate TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS painScale TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS headCircumference TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS avpu TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS pharmacyStatus TEXT DEFAULT 'N/A'`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS injectionStatus TEXT DEFAULT 'N/A'`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS trackingHistory TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS previousDoctor TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS pendingReassignment TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS reassignmentDeclined TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS wardHistory TEXT`,
      `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS lastLoginDate TEXT`
    ];

    // Execute table definitions, column additions and indexes in combined batches to eliminate latency
    const allSchemaSql = `
      ${tables.join(';\n')};
      ${pgAlterColumns.join(';\n')};
      CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
      CREATE INDEX IF NOT EXISTS idx_patients_assigneddoc ON patients(assigneddoctorid);
      CREATE INDEX IF NOT EXISTS idx_patients_regdate ON patients(registrationdate);
      CREATE INDEX IF NOT EXISTS idx_history_patid ON patient_history(patientid);
      CREATE INDEX IF NOT EXISTS idx_injections_patid ON injections_log(patientid);
      CREATE INDEX IF NOT EXISTS idx_lab_patid ON lab_logs(patientid);
    `;

    try {
      await pgPool.query(allSchemaSql);
    } catch (e) {
      console.warn("PostgreSQL batch schema init:", e.message);
    }

    // Ensure injection and lab default staff accounts exist in PostgreSQL
    try {
      await pgPool.query(
        `INSERT INTO staff (name, email, role, password) VALUES 
         ('Injection Desk Nurse', 'injection@vijayas.com', 'injection', 'password123'),
         ('Lab Investigation Staff', 'lab@vijayas.com', 'lab', 'password123')
         ON CONFLICT (email) DO NOTHING`
      );
    } catch (e) {}

    // Reset sequences in parallel
    const serialTables = ['doctors', 'staff', 'patient_history', 'staff_attendance', 'directory_ledger', 'housekeeping_checklist', 'medical_waste', 'pharmacy_ledger', 'lab_logs', 'vaccinations_log', 'injections_log'];
    await Promise.allSettled(
      serialTables.map(st => pgPool.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM ${st}`, [st]))
    );
    return;
  }

  // Create Doctors
  await dbRun(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Create Staff
  await dbRun(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Create Patients
  await dbRun(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT,
      address TEXT,
      assignedDoctorId INTEGER,
      status TEXT NOT NULL,
      diagnosis TEXT,
      prescription TEXT,
      issuedMedication TEXT,
      paymentStatus TEXT NOT NULL,
      wardBedId TEXT,
      fatherOrHusbandName TEXT,
      motherOrGuardianName TEXT,
      bedAdmissionPending INTEGER DEFAULT 0,
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
  `);

  // Migration for adding optional columns
  const alterColumns = [
    `ALTER TABLE patients ADD COLUMN email TEXT`,
    `ALTER TABLE patients ADD COLUMN motherOrGuardianName TEXT`,
    `ALTER TABLE patients ADD COLUMN bedAdmissionPending INTEGER DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN paidAmount NUMERIC DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN feeBreakdown TEXT`,
    `ALTER TABLE patients ADD COLUMN isChild INTEGER DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN childGa TEXT`,
    `ALTER TABLE patients ADD COLUMN childBirthDate TEXT`,
    `ALTER TABLE patients ADD COLUMN childBirthWeight TEXT`,
    `ALTER TABLE patients ADD COLUMN childPlaceOfBirth TEXT`,
    `ALTER TABLE patients ADD COLUMN childDeliveryType TEXT`,
    `ALTER TABLE patients ADD COLUMN childNicuHistory TEXT`,
    `ALTER TABLE patients ADD COLUMN specialInvestigation INTEGER DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN specialInvestigationNotes TEXT`,
    `ALTER TABLE patients ADD COLUMN dob TEXT`,
    `ALTER TABLE patients ADD COLUMN respiratoryRate TEXT`,
    `ALTER TABLE patients ADD COLUMN painScale TEXT`,
    `ALTER TABLE patients ADD COLUMN headCircumference TEXT`,
    `ALTER TABLE patients ADD COLUMN avpu TEXT`,
    `ALTER TABLE patients ADD COLUMN pharmacyStatus TEXT DEFAULT 'N/A'`,
    `ALTER TABLE patients ADD COLUMN injectionStatus TEXT DEFAULT 'N/A'`,
    `ALTER TABLE patients ADD COLUMN trackingHistory TEXT`,
    `ALTER TABLE patients ADD COLUMN previousDoctor TEXT`,
    `ALTER TABLE patients ADD COLUMN pendingReassignment TEXT`,
    `ALTER TABLE patients ADD COLUMN reassignmentDeclined TEXT`,
    `ALTER TABLE patients ADD COLUMN wardHistory TEXT`,
    `ALTER TABLE doctors ADD COLUMN lastLoginDate TEXT`
  ];

  for (const sql of alterColumns) {
    try { await dbRun(sql); } catch (e) {}
  }

  // Create Patient History
  await dbRun(`
    CREATE TABLE IF NOT EXISTS patient_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visitId INTEGER,
      date TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      diagnosis TEXT,
      prescription TEXT,
      prescriptionImg TEXT,
      issuedMedication TEXT,
      paymentStatus TEXT,
      status TEXT
    )
  `);

  // Create Staff Attendance
  await dbRun(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staffId INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      markedBy TEXT,
      shift TEXT DEFAULT 'Day'
    )
  `);
  try { await dbRun(`ALTER TABLE staff_attendance ADD COLUMN shift TEXT DEFAULT 'Day'`); } catch (e) {}

  // Create Directory Ledger
  await dbRun(`
    CREATE TABLE IF NOT EXISTS directory_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      phone TEXT NOT NULL,
      details TEXT,
      amount REAL DEFAULT 0
    )
  `);

  // Create Housekeeping Checklist
  await dbRun(`
    CREATE TABLE IF NOT EXISTS housekeeping_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placeName TEXT NOT NULL,
      date TEXT NOT NULL,
      isCleaned INTEGER DEFAULT 0,
      isPlantsWatered INTEGER DEFAULT 0,
      notes TEXT
    )
  `);

  // Create Medical Waste Log
  await dbRun(`
    CREATE TABLE IF NOT EXISTS medical_waste (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      wasteType TEXT NOT NULL,
      weight REAL NOT NULL,
      agencyName TEXT NOT NULL,
      billAmount REAL DEFAULT 0,
      billAttachment TEXT
    )
  `);

  // Create Pharmacy Ledger
  await dbRun(`
    CREATE TABLE IF NOT EXISTS pharmacy_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      agencyName TEXT,
      paymentMethod TEXT DEFAULT 'Cash'
    )
  `);
  try { await dbRun(`ALTER TABLE pharmacy_ledger ADD COLUMN paymentMethod TEXT DEFAULT 'Cash'`); } catch (e) {}

  // Create Lab Logs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS lab_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId TEXT NOT NULL,
      testName TEXT NOT NULL,
      dateOrdered TEXT NOT NULL,
      status TEXT NOT NULL,
      reportNotes TEXT,
      reportImg TEXT
    )
  `);
  try { await dbRun(`ALTER TABLE lab_logs ADD COLUMN reportImg TEXT`); } catch (e) {}

  // Create Vaccinations Log
  await dbRun(`
    CREATE TABLE IF NOT EXISTS vaccinations_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId TEXT NOT NULL,
      vaccineName TEXT NOT NULL,
      dateGiven TEXT NOT NULL,
      dosage TEXT,
      nextDueDate TEXT
    )
  `);

  // Create Injections Log
  await dbRun(`
    CREATE TABLE IF NOT EXISTS injections_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId TEXT NOT NULL,
      injectionName TEXT NOT NULL,
      dosage TEXT NOT NULL,
      route TEXT DEFAULT 'IV',
      frequency TEXT DEFAULT 'STAT',
      isStat INTEGER DEFAULT 1,
      administeredBy TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Pending',
      dateGiven TEXT
    )
  `);

  try { await dbRun(`ALTER TABLE injections_log ADD COLUMN route TEXT DEFAULT 'IV'`); } catch (e) {}
  try { await dbRun(`ALTER TABLE injections_log ADD COLUMN frequency TEXT DEFAULT 'STAT'`); } catch (e) {}
  try { await dbRun(`ALTER TABLE injections_log ADD COLUMN isStat INTEGER DEFAULT 1`); } catch (e) {}
  try { await dbRun(`ALTER TABLE injections_log ADD COLUMN administeredBy TEXT DEFAULT ''`); } catch (e) {}
  try { await dbRun(`ALTER TABLE injections_log ADD COLUMN notes TEXT DEFAULT ''`); } catch (e) {}

  // Ensure injection and lab default staff accounts exist
  await dbRun(
    `INSERT OR IGNORE INTO staff (name, email, role, password) VALUES (?, ?, ?, ?)`,
    ['Injection Desk Nurse', 'injection@vijayas.com', 'injection', 'password123']
  );
  await dbRun(
    `INSERT OR IGNORE INTO staff (name, email, role, password) VALUES (?, ?, ?, ?)`,
    ['Lab Investigation Staff', 'lab@vijayas.com', 'lab', 'password123']
  );

  // Migrate data from db.json if database is empty
  const docCount = await dbGet(`SELECT count(*) as count FROM doctors`);
  if ((!docCount || docCount.count === 0) && fs.existsSync(dbJsonPath)) {
    console.log("Migrating data from db.json to SQLite database...");
    try {
      const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

      if (dbJson.doctors) {
        for (const doc of dbJson.doctors) {
          await dbRun(
            `INSERT OR IGNORE INTO doctors (id, name, specialty, email, password) VALUES (?, ?, ?, ?, ?)`,
            [doc.id, doc.name, doc.specialty, doc.email, doc.password || 'password123']
          );
        }
      }

      if (dbJson.staff) {
        for (const st of dbJson.staff) {
          await dbRun(
            `INSERT OR IGNORE INTO staff (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)`,
            [st.id, st.name, st.email, st.role, st.password || 'password123']
          );
        }
      }

      if (dbJson.patients) {
        for (const pat of dbJson.patients) {
          await dbRun(
            `INSERT OR IGNORE INTO patients (id, name, age, gender, contact, address, assignedDoctorId, status, diagnosis, prescription, issuedMedication, paymentStatus, wardBedId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pat.id,
              pat.name,
              pat.age,
              pat.gender,
              pat.contact,
              pat.address || '',
              pat.assignedDoctorId,
              pat.status || 'In Queue',
              pat.diagnosis || '',
              pat.prescription ? JSON.stringify(pat.prescription) : null,
              pat.issuedMedication || null,
              pat.paymentStatus || 'Unpaid',
              pat.wardBedId
            ]
          );

          if (pat.history && pat.history.length > 0) {
            for (const h of pat.history) {
              await dbRun(
                `INSERT INTO patient_history (patientId, visitId, date, doctorName, diagnosis, prescription, prescriptionImg, issuedMedication, paymentStatus, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  pat.id,
                  h.visitId || Date.now(),
                  h.date,
                  h.doctorName,
                  h.diagnosis,
                  h.prescription ? JSON.stringify(h.prescription) : null,
                  h.prescriptionImg || null,
                  h.issuedMedication,
                  h.paymentStatus,
                  h.status
                ]
              );
            }
          }
        }
      }
      console.log("Migration complete!");
    } catch (err) {
      console.error("Failed to migrate database:", err.message);
    }
  }

  try {
    await dbRun(`UPDATE patients SET status = 'In Queue' WHERE status = 'Registered'`);
    await dbRun(`UPDATE patients SET status = 'Completed' WHERE status = 'Inactive' AND (diagnosis IS NOT NULL AND diagnosis != '')`);
    await dbRun(`UPDATE patients SET status = 'In Queue' WHERE status = 'Inactive' AND (diagnosis IS NULL OR diagnosis = '')`);
  } catch (e) {}

  try {
    const allPats = await dbAll(`SELECT id, assignedDoctorId, trackingHistory, previousDoctor FROM patients`);
    for (const pat of allPats) {
      if (!pat.previousdoctor) {
        let trackingLogs = [];
        if (pat.trackinghistory) {
          try { trackingLogs = JSON.parse(pat.trackinghistory); } catch (e) {}
        }
        const reassignLog = trackingLogs.find(log => log && (log.type === 'Doctor Reassignment' || log.previousDoctor || log.newDoctor));
        let resolvedPrev = reassignLog ? (reassignLog.previousDoctor || reassignLog.changedBy) : null;
        if (!resolvedPrev && Number(pat.assignedDoctorId) === 2) {
          resolvedPrev = 'Dr. Vijayan';
        }
        if (resolvedPrev) {
          await dbRun(`UPDATE patients SET previousDoctor = ? WHERE id = ?`, [resolvedPrev, pat.id]);
        }
      }
    }
  } catch (e) {
    console.log("Migration warning for backfilling previousdoctor:", e.message);
  }
};

// Database APIs
export const getDoctors = () => dbAll(`SELECT * FROM doctors`);
export const addDoctor = async (doc) => {
  if (doc.id) {
    await dbRun(
      `INSERT INTO doctors (id, name, specialty, email, password) VALUES (?, ?, ?, ?, ?)`,
      [doc.id, doc.name, doc.specialty, doc.email, doc.password || '123456']
    );
    return { id: doc.id, name: doc.name, specialty: doc.specialty, email: doc.email };
  } else {
    const res = await dbRun(
      `INSERT INTO doctors (name, specialty, email, password) VALUES (?, ?, ?, ?)`,
      [doc.name, doc.specialty, doc.email, doc.password || '123456']
    );
    const newId = res ? res.lastID : Date.now();
    return { id: newId, name: doc.name, specialty: doc.specialty, email: doc.email };
  }
};
export const deleteDoctor = (id) => dbRun(`DELETE FROM doctors WHERE id = ? OR CAST(id AS TEXT) = ?`, [id, String(id)]);
export const updateDoctorLastLogin = (id, dateStr) => dbRun(`UPDATE doctors SET lastLoginDate = ? WHERE id = ? OR CAST(id AS TEXT) = ?`, [dateStr, id, String(id)]);
export const logoutDoctor = (id) => dbRun(`UPDATE doctors SET lastLoginDate = NULL WHERE id = ? OR CAST(id AS TEXT) = ?`, [id, String(id)]);

export const getStaff = () => dbAll(`SELECT * FROM staff`);
export const addStaff = async (st) => {
  if (st.id) {
    await dbRun(
      `INSERT INTO staff (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)`,
      [st.id, st.name, st.email, st.role, st.password || 'password123']
    );
    return { id: st.id, name: st.name, email: st.email, role: st.role };
  } else {
    const res = await dbRun(
      `INSERT INTO staff (name, email, role, password) VALUES (?, ?, ?, ?)`,
      [st.name, st.email, st.role, st.password || 'password123']
    );
    const newId = res ? res.lastID : Date.now();
    return { id: newId, name: st.name, email: st.email, role: st.role };
  }
};
export const deleteStaff = (id) => dbRun(`DELETE FROM staff WHERE id = ? OR CAST(id AS TEXT) = ?`, [id, String(id)]);
export const deletePatient = (id) => dbRun(
  `UPDATE patients SET status = 'Inactive', tokenNumber = NULL, registrationDate = NULL WHERE id = ?`,
  [id]
);
export const deleteAllPatients = async () => {
  await dbRun(`DELETE FROM patients`);
  await dbRun(`DELETE FROM patient_history`);
};

export const getPatients = async () => {
  const [patients, allHistoryRows] = await Promise.all([
    dbAll(`SELECT * FROM patients`),
    dbAll(`SELECT * FROM patient_history`)
  ]);

  const historyByPatient = {};
  if (Array.isArray(allHistoryRows)) {
    for (const h of allHistoryRows) {
      if (!historyByPatient[h.patientId]) {
        historyByPatient[h.patientId] = [];
      }
      historyByPatient[h.patientId].push({
        visitId: h.visitId,
        date: h.date,
        doctorName: h.doctorName,
        diagnosis: h.diagnosis,
        prescription: h.prescription ? JSON.parse(h.prescription) : [],
        prescriptionImg: h.prescriptionImg || null,
        issuedMedication: h.issuedMedication,
        paymentStatus: h.paymentStatus,
        status: h.status
      });
    }
  }

  return (patients || []).map(pat => ({
    id: pat.id,
    name: pat.name,
    age: pat.age,
    gender: pat.gender,
    contact: pat.contact,
    email: pat.email || '',
    address: pat.address,
    assignedDoctorId: pat.assigneddoctorid !== undefined && pat.assigneddoctorid !== null ? parseInt(pat.assigneddoctorid) : (pat.assignedDoctorId !== undefined && pat.assignedDoctorId !== null ? parseInt(pat.assignedDoctorId) : null),
    status: pat.status,
    diagnosis: pat.diagnosis,
    prescription: pat.prescription ? (typeof pat.prescription === 'string' ? JSON.parse(pat.prescription) : pat.prescription) : null,
    issuedMedication: pat.issuedMedication || pat.issuedmedication || null,
    paymentStatus: pat.paymentstatus || pat.paymentStatus || 'Unpaid',
    wardBedId: pat.wardbedid || pat.wardBedId || null,
    bedAdmissionPending: pat.bedadmissionpending !== undefined ? parseInt(pat.bedadmissionpending) : (pat.bedAdmissionPending || 0),
    fatherOrHusbandName: pat.fatherorhusbandname || pat.fatherOrHusbandName || '',
    motherOrGuardianName: pat.motherorguardianname || pat.motherOrGuardianName || '',
    alternatePhone: pat.alternatephone || pat.alternatePhone || '',
    tokenNumber: pat.tokennumber !== undefined && pat.tokennumber !== null ? parseInt(pat.tokennumber) : (pat.tokenNumber || null),
    registrationDate: pat.registrationdate || pat.registrationDate || '',
    prescriptionImg: pat.prescriptionimg || pat.prescriptionImg || null,
    height: pat.height || '',
    weight: pat.weight || '',
    bp: pat.bp || '',
    hr: pat.hr || '',
    spo2: pat.spo2 || '',
    grbs: pat.grbs || '',
    temp: pat.temp || '',
    complaints: pat.complaints || '',
    pastHistory: pat.pasthistory || pat.pastHistory || '',
    examination: pat.examination || '',
    investigation: pat.investigation || '',
    bmi: pat.bmi || '',
    paidAmount: pat.paidamount ? parseFloat(pat.paidamount) : (pat.paidAmount ? parseFloat(pat.paidAmount) : 0),
    feeBreakdown: pat.feebreakdown || pat.feeBreakdown || '',
    isChild: pat.ischild !== undefined ? parseInt(pat.ischild) : (pat.isChild || 0),
    childGa: pat.childga || pat.childGa || '',
    childBirthDate: pat.childbirthdate || pat.childBirthDate || '',
    childBirthWeight: pat.childbirthweight || pat.childBirthWeight || '',
    childPlaceOfBirth: pat.childplaceofbirth || pat.childPlaceOfBirth || '',
    childDeliveryType: pat.childdeliverytype || pat.childDeliveryType || '',
    childNicuHistory: pat.childnicuhistory || pat.childNicuHistory || '',
    specialInvestigation: pat.specialinvestigation !== undefined ? parseInt(pat.specialinvestigation) : (pat.specialInvestigation || 0),
    specialInvestigationNotes: pat.specialinvestigationnotes || pat.specialInvestigationNotes || '',
    dob: pat.dob || '',
    respiratoryRate: pat.respiratoryrate || pat.respiratoryRate || '',
    painScale: pat.painscale || pat.painScale || '',
    headCircumference: pat.headcircumference || pat.headCircumference || '',
    avpu: pat.avpu || '',
    pharmacyStatus: pat.pharmacystatus || pat.pharmacyStatus || (pat.prescription && pat.prescription.length > 0 ? (pat.issuedMedication ? 'Completed' : 'Pending') : 'N/A'),
    injectionStatus: pat.injectionstatus || pat.injectionStatus || 'N/A',
    previousDoctor: pat.previousdoctor || pat.previousDoctor || '',
    pendingReassignment: (() => {
      const raw = pat.pendingreassignment || pat.pendingReassignment;
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      return null;
    })(),
    reassignmentDeclined: (() => {
      const raw = pat.reassignmentdeclined || pat.reassignmentDeclined;
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      return null;
    })(),
    trackingHistory: (() => {
      const raw = pat.trackinghistory || pat.trackingHistory;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return []; }
      }
      return [];
    })(),
    wardHistory: (() => {
      const raw = pat.wardhistory || pat.wardHistory;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return []; }
      }
      return [];
    })(),
    history: historyByPatient[pat.id] || []
  }));
};

const findPatientRow = async (id) => {
  if (id === undefined || id === null) return null;
  const strId = String(id).trim();

  // 1. Direct match query
  let row = await dbGet(`SELECT * FROM patients WHERE id = ?`, [strId]);
  if (row) return row;

  // 2. Case-insensitive & normalized zero-padding lookup (e.g. '5', 'vh05', 'VH5', '#VH005')
  const numOnly = strId.replace(/\D/g, '');
  if (numOnly) {
    const numVal = parseInt(numOnly, 10);
    const vhFormatted = `VH${String(numVal).padStart(3, '0')}`;
    const vhShort = `VH${numVal}`;
    const vhTwoZero = `VH${String(numVal).padStart(2, '0')}`;

    row = await dbGet(
      `SELECT * FROM patients 
       WHERE LOWER(id) = LOWER(?) 
          OR LOWER(id) = LOWER(?) 
          OR LOWER(id) = LOWER(?) 
          OR LOWER(id) = LOWER(?) 
          OR id = ? 
          OR id = ?`,
      [vhFormatted, vhShort, vhTwoZero, strId, String(numVal), numOnly]
    );
    if (row) return row;
  }

  // 3. Fallback scan across all patients matching numerical ID or normalized string
  const allPats = await dbAll(`SELECT * FROM patients`);
  return allPats.find(p => {
    if (!p || !p.id) return false;
    const pidStr = String(p.id).trim().toLowerCase();
    const searchClean = strId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (pidStr === strId.toLowerCase() || pidStr.replace(/[^a-z0-9]/g, '') === searchClean) return true;

    const pNum = pidStr.replace(/\D/g, '');
    return numOnly && pNum && parseInt(pNum, 10) === parseInt(numOnly, 10);
  }) || null;
};

export const getPatientById = async (id) => {
  const pat = await findPatientRow(id);
  if (!pat) return null;

  const targetId = pat.id;
  const historyRows = await dbAll(`SELECT * FROM patient_history WHERE patientId = ?`, [targetId]);
  const history = historyRows.map(h => ({
    visitId: h.visitId,
    date: h.date,
    doctorName: h.doctorName,
    diagnosis: h.diagnosis,
    prescription: h.prescription ? JSON.parse(h.prescription) : [],
    prescriptionImg: h.prescriptionImg || null,
    issuedMedication: h.issuedMedication,
    paymentStatus: h.paymentStatus,
    status: h.status
  }));

  return {
    id: pat.id,
    name: pat.name,
    age: pat.age,
    gender: pat.gender,
    contact: pat.contact,
    email: pat.email || '',
    address: pat.address,
    assignedDoctorId: pat.assignedDoctorId,
    status: pat.status,
    diagnosis: pat.diagnosis,
    prescription: pat.prescription ? JSON.parse(pat.prescription) : [],
    issuedMedication: pat.issuedMedication,
    paymentStatus: pat.paymentStatus,
    wardBedId: pat.wardBedId,
    bedAdmissionPending: pat.bedAdmissionPending,
    fatherOrHusbandName: pat.fatherOrHusbandName,
    motherOrGuardianName: pat.motherOrGuardianName,
    alternatePhone: pat.alternatePhone,
    tokenNumber: pat.tokenNumber,
    registrationDate: pat.registrationDate,
    prescriptionImg: pat.prescriptionImg || null,
    height: pat.height || '',
    weight: pat.weight || '',
    bp: pat.bp || '',
    hr: pat.hr || '',
    spo2: pat.spo2 || '',
    grbs: pat.grbs || '',
    temp: pat.temp || '',
    complaints: pat.complaints || '',
    pastHistory: pat.pastHistory || '',
    examination: pat.examination || '',
    investigation: pat.investigation || '',
    bmi: pat.bmi || '',
    paidAmount: pat.paidAmount || 0,
    feeBreakdown: pat.feeBreakdown || '',
    isChild: pat.isChild || 0,
    childGa: pat.childGa || '',
    childBirthDate: pat.childBirthDate || '',
    childBirthWeight: pat.childBirthWeight || '',
    childPlaceOfBirth: pat.childPlaceOfBirth || '',
    childDeliveryType: pat.childDeliveryType || '',
    childNicuHistory: pat.childNicuHistory || '',
    specialInvestigation: pat.specialInvestigation || 0,
    specialInvestigationNotes: pat.specialInvestigationNotes || '',
    dob: pat.dob || '',
    respiratoryRate: pat.respiratoryrate || pat.respiratoryRate || '',
    painScale: pat.painscale || pat.painScale || '',
    headCircumference: pat.headcircumference || pat.headCircumference || '',
    avpu: pat.avpu || '',
    pharmacyStatus: pat.pharmacystatus || pat.pharmacyStatus || (pat.prescription && pat.prescription.length > 0 ? (pat.issuedMedication ? 'Completed' : 'Pending') : 'N/A'),
    injectionStatus: pat.injectionstatus || pat.injectionStatus || 'N/A',
    previousDoctor: pat.previousdoctor || pat.previousDoctor || '',
    pendingReassignment: (() => {
      const raw = pat.pendingreassignment || pat.pendingReassignment;
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      return null;
    })(),
    reassignmentDeclined: (() => {
      const raw = pat.reassignmentdeclined || pat.reassignmentDeclined;
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      return null;
    })(),
    trackingHistory: (() => {
      const raw = pat.trackinghistory || pat.trackingHistory;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return []; }
      }
      return [];
    })(),
    wardHistory: (() => {
      const raw = pat.wardhistory || pat.wardHistory;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch (e) { return []; }
      }
      return [];
    })(),
    history: history
  };
};

const getNextPatientId = async () => {
  const latest = await dbAll(`SELECT id FROM patients WHERE id LIKE 'VH%' OR id LIKE 'vh%'`);
  let maxNum = 0;
  for (const pat of latest) {
    const num = parseInt(String(pat.id).replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `VH${String(nextNum).padStart(3, '0')}`;
};

export const addPatient = async (pat) => {
  const id = pat.id || (await getNextPatientId());
  await dbRun(
    `INSERT INTO patients (id, name, age, gender, contact, email, address, assignedDoctorId, status, diagnosis, prescription, issuedMedication, paymentStatus, wardBedId, bedAdmissionPending, fatherOrHusbandName, motherOrGuardianName, alternatePhone, tokenNumber, registrationDate, prescriptionImg, height, weight, bp, hr, spo2, grbs, temp, complaints, pastHistory, examination, investigation, bmi, ischild, childga, childbirthdate, childbirthweight, childplaceofbirth, childdeliverytype, childnicuhistory, specialinvestigation, specialinvestigationnotes, previousDoctor, wardHistory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      pat.name,
      pat.age,
      pat.gender,
      pat.contact,
      pat.email || '',
      pat.address || '',
      pat.assignedDoctorId,
      pat.status || 'In Queue',
      pat.diagnosis || '',
      pat.prescription ? JSON.stringify(pat.prescription) : null,
      pat.issuedMedication || null,
      pat.paymentStatus || 'Unpaid',
      pat.wardBedId || null,
      pat.bedAdmissionPending || 0,
      pat.fatherOrHusbandName || '',
      pat.motherOrGuardianName || '',
      pat.alternatePhone || '',
      pat.tokenNumber || null,
      pat.registrationDate || '',
      pat.prescriptionImg || null,
      pat.height || '',
      pat.weight || '',
      pat.bp || '',
      pat.hr || '',
      pat.spo2 || '',
      pat.grbs || '',
      pat.temp || '',
      pat.complaints || '',
      pat.pastHistory || '',
      pat.examination || '',
      pat.investigation || '',
      pat.bmi || '',
      pat.isChild || 0,
      pat.childGa || '',
      pat.childBirthDate || '',
      pat.childBirthWeight || '',
      pat.childPlaceOfBirth || '',
      pat.childDeliveryType || '',
      pat.childNicuHistory || '',
      pat.specialInvestigation || 0,
      pat.specialInvestigationNotes || '',
      pat.previousDoctor || '',
      pat.wardHistory ? JSON.stringify(pat.wardHistory) : null
    ]
  );

  return {
    id,
    name: pat.name,
    age: pat.age,
    gender: pat.gender,
    contact: pat.contact,
    email: pat.email || '',
    address: pat.address || '',
    assignedDoctorId: pat.assignedDoctorId,
    status: pat.status || 'In Queue',
    diagnosis: pat.diagnosis || '',
    prescription: pat.prescription || null,
    issuedMedication: pat.issuedMedication || null,
    paymentStatus: pat.paymentStatus || 'Unpaid',
    wardBedId: pat.wardBedId || null,
    bedAdmissionPending: pat.bedAdmissionPending || 0,
    fatherOrHusbandName: pat.fatherOrHusbandName || '',
    motherOrGuardianName: pat.motherOrGuardianName || '',
    alternatePhone: pat.alternatePhone || '',
    tokenNumber: pat.tokenNumber || null,
    registrationDate: pat.registrationDate || '',
    prescriptionImg: pat.prescriptionImg || null,
    height: pat.height || '',
    weight: pat.weight || '',
    bp: pat.bp || '',
    hr: pat.hr || '',
    spo2: pat.spo2 || '',
    grbs: pat.grbs || '',
    temp: pat.temp || '',
    complaints: pat.complaints || '',
    pastHistory: pat.pastHistory || '',
    examination: pat.examination || '',
    investigation: pat.investigation || '',
    bmi: pat.bmi || '',
    paidAmount: 0,
    feeBreakdown: '',
    isChild: pat.isChild || 0,
    childGa: pat.childGa || '',
    childBirthDate: pat.childBirthDate || '',
    childBirthWeight: pat.childBirthWeight || '',
    childPlaceOfBirth: pat.childPlaceOfBirth || '',
    childDeliveryType: pat.childDeliveryType || '',
    childNicuHistory: pat.childNicuHistory || '',
    specialInvestigation: pat.specialInvestigation || 0,
    specialInvestigationNotes: pat.specialInvestigationNotes || '',
    wardHistory: pat.wardHistory || [],
    history: []
  };
};

export const updatePatient = async (id, data) => {
  const existing = await findPatientRow(id);
  if (!existing) throw new Error("Patient not found");
  const targetId = existing.id;

  const fields = [];
  const params = [];

  const keys = [
    'name', 'age', 'gender', 'contact', 'email', 'address',
    'assignedDoctorId', 'status', 'diagnosis',
    'prescription', 'issuedMedication', 'paymentStatus', 'wardBedId', 'bedAdmissionPending',
    'fatherOrHusbandName', 'motherOrGuardianName', 'alternatePhone', 'tokenNumber', 'registrationDate',
    'prescriptionImg', 'height', 'weight', 'bp', 'hr', 'spo2', 'grbs', 'temp',
    'complaints', 'pastHistory', 'examination', 'investigation', 'bmi', 'paidAmount', 'feeBreakdown',
    'isChild', 'childGa', 'childBirthDate', 'childBirthWeight', 'childPlaceOfBirth', 'childDeliveryType', 'childNicuHistory',
    'specialInvestigation', 'specialInvestigationNotes', 'trackingHistory', 'previousDoctor', 'pendingReassignment', 'reassignmentDeclined', 'wardHistory'
  ];

  for (const k of keys) {
    if (data[k] !== undefined) {
      fields.push(`${k.toLowerCase()} = ?`);
      if (k === 'prescription' || k === 'trackingHistory' || k === 'pendingReassignment' || k === 'reassignmentDeclined' || k === 'wardHistory') {
        params.push(data[k] ? (typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k])) : null);
      } else {
        params.push(data[k]);
      }
    }
  }

  if (fields.length > 0) {
    params.push(targetId);
    await dbRun(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  // Handle history updates if present
  if (data.history !== undefined) {
    await dbRun(`DELETE FROM patient_history WHERE patientId = ?`, [targetId]);
    for (const h of data.history) {
      await dbRun(
        `INSERT INTO patient_history (patientId, visitId, date, doctorName, diagnosis, prescription, prescriptionImg, issuedMedication, paymentStatus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetId,
          h.visitId || Date.now(),
          h.date,
          h.doctorName,
          h.diagnosis,
          h.prescription ? JSON.stringify(h.prescription) : null,
          h.prescriptionImg || null,
          h.issuedMedication,
          h.paymentStatus,
          h.status
        ]
      );
    }
  }

  return await getPatientById(targetId);
};

// Staff Attendance
export const getAttendance = () => dbAll(`SELECT * FROM staff_attendance ORDER BY date DESC, id DESC`);
export const addAttendance = async (att) => {
  const staffId = att.staffId;
  const date = att.date;
  const shift = att.shift || 'Day';
  
  const existing = await dbGet(
    `SELECT * FROM staff_attendance WHERE (staffId = ? OR CAST(staffId AS TEXT) = ?) AND date = ? AND (shift = ? OR shift IS NULL)`,
    [staffId, String(staffId), date, shift]
  );

  if (existing) {
    await dbRun(
      `UPDATE staff_attendance SET status = ?, markedBy = ? WHERE id = ?`,
      [att.status, att.markedBy || 'Doctor/Admin', existing.id]
    );
    return { ...existing, status: att.status, markedBy: att.markedBy, updated: true };
  } else {
    const res = await dbRun(
      `INSERT INTO staff_attendance (staffId, date, status, markedBy, shift) VALUES (?, ?, ?, ?, ?)`,
      [staffId, date, att.status, att.markedBy || 'Doctor/Admin', shift]
    );
    return { id: res ? res.lastID : Date.now(), ...att };
  }
};
export const deleteAttendance = (id) => dbRun(`DELETE FROM staff_attendance WHERE id = ? OR CAST(id AS TEXT) = ?`, [id, String(id)]);

// Directory Ledger
export const getDirectory = () => dbAll(`SELECT * FROM directory_ledger`);
export const addDirectory = async (entry) => {
  const result = await dbRun(
    `INSERT INTO directory_ledger (name, category, phone, details, amount) VALUES (?, ?, ?, ?, ?)`,
    [entry.name, entry.category, entry.phone, entry.details, entry.amount]
  );
  return { id: result.lastID, ...entry };
};
export const deleteDirectory = (id) => dbRun(`DELETE FROM directory_ledger WHERE id = ?`, [id]);

// Housekeeping
export const getHousekeeping = () => dbAll(`SELECT * FROM housekeeping_checklist`);
export const addHousekeeping = async (task) => {
  const result = await dbRun(
    `INSERT INTO housekeeping_checklist (placeName, date, isCleaned, isPlantsWatered, notes) VALUES (?, ?, ?, ?, ?)`,
    [task.placeName, task.date, task.isCleaned, task.isPlantsWatered, task.notes]
  );
  return { id: result.lastID, ...task };
};
export const deleteHousekeeping = (id) => dbRun(`DELETE FROM housekeeping_checklist WHERE id = ?`, [id]);

// Medical Waste
export const getMedicalWaste = () => dbAll(`SELECT * FROM medical_waste`);
export const addMedicalWaste = async (waste) => {
  const result = await dbRun(
    `INSERT INTO medical_waste (date, wasteType, weight, agencyName, billAmount, billAttachment) VALUES (?, ?, ?, ?, ?, ?)`,
    [waste.date, waste.wasteType, waste.weight, waste.agencyName, waste.billAmount, waste.billAttachment]
  );
  return { id: result.lastID, ...waste };
};
export const deleteMedicalWaste = (id) => dbRun(`DELETE FROM medical_waste WHERE id = ?`, [id]);

// Pharmacy Ledger
export const getPharmacyLedger = () => dbAll(`SELECT * FROM pharmacy_ledger`);
export const addPharmacyLedger = async (ledger) => {
  const paymentMethod = ledger.paymentMethod || 'Cash';
  const result = await dbRun(
    `INSERT INTO pharmacy_ledger (date, type, description, amount, agencyName, paymentMethod) VALUES (?, ?, ?, ?, ?, ?)`,
    [ledger.date, ledger.type, ledger.description, ledger.amount, ledger.agencyName, paymentMethod]
  );
  return { id: result ? result.lastID : Date.now(), ...ledger, paymentMethod };
};

// Lab Logs
export const getLabLogs = () => dbAll(`SELECT * FROM lab_logs ORDER BY id DESC`);
export const addLabLog = async (log) => {
  const cleanPid = String(log.patientId || '').trim().toUpperCase();
  const cleanTest = String(log.testName || '').trim().toUpperCase();
  
  // Check if active/pending duplicate already exists
  const existing = await dbAll(
    `SELECT * FROM lab_logs WHERE UPPER(TRIM(patientId)) = ? AND UPPER(TRIM(testName)) = ? AND status IN ('Ordered', 'Sample Collected')`,
    [cleanPid, cleanTest]
  );
  if (existing && existing.length > 0) {
    const err = new Error(`Lab test "${log.testName}" is already pending for patient ${log.patientId}. Duplicate entries are not allowed.`);
    err.status = 409;
    throw err;
  }

  const result = await dbRun(
    `INSERT INTO lab_logs (patientId, testName, dateOrdered, status, reportNotes, reportImg) VALUES (?, ?, ?, ?, ?, ?)`,
    [log.patientId, log.testName, log.dateOrdered, log.status || 'Ordered', log.reportNotes || '', log.reportImg || null]
  );
  return { id: result.lastID, ...log };
};
export const updateLabLogStatus = (id, status, reportNotes, reportImg) => dbRun(
  `UPDATE lab_logs SET status = ?, reportNotes = ?, reportImg = ? WHERE id = ?`,
  [status, reportNotes, reportImg || null, id]
);
export const deleteLabLog = (id) => dbRun(`DELETE FROM lab_logs WHERE id = ?`, [id]);

// Vaccinations
export const getVaccinesByPatient = (patientId) => dbAll(`SELECT * FROM vaccinations_log WHERE patientId = ?`, [patientId]);
export const addVaccine = async (vac) => {
  const result = await dbRun(
    `INSERT INTO vaccinations_log (patientId, vaccineName, dateGiven, dosage, nextDueDate) VALUES (?, ?, ?, ?, ?)`,
    [vac.patientId, vac.vaccineName, vac.dateGiven, vac.dosage, vac.nextDueDate]
  );
  return { id: result.lastID, ...vac };
};

// Injections
export const getInjections = async () => {
  const list = await dbAll(`SELECT * FROM injections_log ORDER BY id DESC`);
  return list.map(inj => {
    const isStat = inj.isStat === 1 || inj.isStat === true || inj.isstat === 1 || (inj.frequency && inj.frequency.includes('STAT'));
    const frequency = inj.frequency || (isStat ? 'STAT (Single / Immediate)' : 'OD (Once Daily)');
    const adminBy = inj.administeredBy || inj.administeredby || '';
    const dateGiven = inj.dateGiven || inj.dategiven || '';
    const patientId = inj.patientId || inj.patientid || '';
    const injectionName = inj.injectionName || inj.injectionname || '';
    return {
      ...inj,
      id: inj.id,
      patientId,
      injectionName,
      dosage: inj.dosage || '',
      route: inj.route || 'IV',
      frequency: frequency,
      isStat: isStat ? 1 : 0,
      administeredBy: adminBy,
      dateGiven: dateGiven,
      notes: inj.notes || '',
      status: inj.status || 'Pending'
    };
  });
};

export const addInjection = async (inj) => {
  const route = inj.route || 'IM';
  const frequency = inj.frequency || (inj.isStat ? 'STAT (Single / Immediate)' : 'NORMAL');
  const isStat = inj.isStat !== undefined ? (inj.isStat ? 1 : 0) : (frequency.includes('STAT') ? 1 : 0);
  const patientIdStr = String(inj.patientId || '').trim();
  const nameStr = String(inj.injectionName || '').trim();
  const dosageStr = String(inj.dosage || '').trim();
  const routeStr = String(route).trim();
  const freqStr = String(frequency).trim();

  // Check if identical injection entry already exists for this patient
  const existing = await dbGet(
    `SELECT * FROM injections_log 
     WHERE LOWER(TRIM(patientId)) = LOWER(?) 
       AND LOWER(TRIM(injectionName)) = LOWER(?) 
       AND LOWER(TRIM(dosage)) = LOWER(?) 
       AND LOWER(TRIM(route)) = LOWER(?) 
       AND LOWER(TRIM(frequency)) = LOWER(?)`,
    [patientIdStr, nameStr, dosageStr, routeStr, freqStr]
  );

  if (existing) {
    console.log(`[Injection Desk] Duplicate injection prevented for patient ${patientIdStr}: ${nameStr}`);
    return existing;
  }

  const result = await dbRun(
    `INSERT INTO injections_log (patientId, injectionName, dosage, route, frequency, isStat, administeredBy, notes, status, dateGiven) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientIdStr,
      nameStr,
      dosageStr,
      route,
      frequency,
      isStat,
      inj.administeredBy || '',
      inj.notes || '',
      inj.status || 'Pending',
      inj.dateGiven || ''
    ]
  );
  return { id: result.lastID, ...inj, route, frequency, isStat };
};
export const updateInjectionStatus = (id, status, dateGiven, administeredBy = '') => dbRun(
  `UPDATE injections_log SET status = ?, dateGiven = ?, administeredBy = COALESCE(NULLIF(?, ''), administeredBy) WHERE id = ?`,
  [status, dateGiven, administeredBy, id]
);
export const updateInjection = (id, inj) => {
  const route = inj.route || 'IM';
  const frequency = inj.frequency || (inj.isStat ? 'STAT (Single / Immediate)' : 'NORMAL');
  const isStat = inj.isStat !== undefined ? (inj.isStat ? 1 : 0) : (frequency.includes('STAT') ? 1 : 0);
  return dbRun(
    `UPDATE injections_log SET patientId = ?, injectionName = ?, dosage = ?, route = ?, frequency = ?, isStat = ?, notes = ? WHERE id = ?`,
    [
      inj.patientId,
      inj.injectionName,
      inj.dosage || '',
      route,
      frequency,
      isStat,
      inj.notes || '',
      id
    ]
  );
};
export const deleteInjection = (id) => dbRun(
  `DELETE FROM injections_log WHERE id = ?`,
  [id]
);
export const updateInjectionsStatusByPatientId = (patientId, status, dateGiven, administeredBy = 'Doctor / Nurse') => {
  const rawStr = String(patientId || '');
  const cleanId = rawStr.replace(/#/g, '').trim();
  const numId = cleanId.replace(/^vh0*/i, '');
  const vhId = 'VH' + numId.padStart(3, '0');

  return dbRun(
    `UPDATE injections_log 
     SET status = ?, 
         dateGiven = ?, 
         administeredBy = COALESCE(NULLIF(?, ''), administeredBy, 'Doctor / Nurse') 
     WHERE (
       LOWER(patientId) = LOWER(?) 
       OR LOWER(patientId) = LOWER(?)
       OR LOWER(patientId) = LOWER(?)
       OR LOWER(patientId) = LOWER(?)
       OR LOWER(REPLACE(patientId, '#', '')) = LOWER(?)
     ) 
     AND status = 'Pending'`,
    [status, dateGiven, administeredBy, rawStr, cleanId, vhId, numId, cleanId]
  );
};
