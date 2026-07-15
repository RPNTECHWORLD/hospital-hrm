import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbJsonPath = path.join(__dirname, 'db.json');

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

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hospital_db';

if (connectionString.includes('sslmode=')) {
  connectionString = connectionString.replace(/[\?&]sslmode=[^&]+/gi, '');
}

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false
});

// Helper to convert SQLite ? to Postgres $1, $2, etc.
const convertPlaceholders = (sql) => {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
};

export const dbRun = async (query, params = []) => {
  let sql = convertPlaceholders(query);

  if (sql.toUpperCase().includes('INSERT OR IGNORE')) {
    sql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT');
    if (sql.toLowerCase().includes('staff')) {
      sql += ' ON CONFLICT (email) DO NOTHING';
    } else if (sql.toLowerCase().includes('doctors')) {
      sql += ' ON CONFLICT (email) DO NOTHING';
    }
  }

  const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !sql.toUpperCase().includes('RETURNING')) {
    sql += ' RETURNING id';
  }

  const result = await pool.query(sql, params);

  if (isInsert && result.rows && result.rows.length > 0) {
    return { lastID: result.rows[0].id };
  }
  return { lastID: null, rowsAffected: result.rowCount };
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
  specialinvestigationnotes: 'specialInvestigationNotes'
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
  const sql = convertPlaceholders(query);
  const result = await pool.query(sql, params);
  return camelizeObject(result.rows);
};

export const dbGet = async (query, params = []) => {
  const sql = convertPlaceholders(query);
  const result = await pool.query(sql, params);
  return camelizeObject(result.rows[0]) || null;
};

// Initialize Database Tables
export const initDB = async () => {
  // Create Doctors
  await dbRun(`
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Create Staff
  await dbRun(`
    CREATE TABLE IF NOT EXISTS staff (
      id SERIAL PRIMARY KEY,
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
      address TEXT,
      assignedDoctorId INTEGER,
      status TEXT NOT NULL,
      diagnosis TEXT,
      prescription TEXT, -- JSON string of prescription array
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

  // Migrate existing patients table if missing motherOrGuardianName or bedAdmissionPending
  await dbRun(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS motherOrGuardianName TEXT`);
  await dbRun(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS bedAdmissionPending INTEGER DEFAULT 0`);
  try {
    await dbRun(`ALTER TABLE patients ALTER COLUMN wardbedid TYPE TEXT`);
  } catch (e) {
    console.log("Migration warning for wardbedid column type:", e.message);
  }
  try {
    await dbRun(`ALTER TABLE patients ADD COLUMN paidamount NUMERIC DEFAULT 0`);
  } catch (e) {
    if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
      console.log("Migration warning for paidamount column:", e.message);
    }
  }
  try {
    await dbRun(`ALTER TABLE patients ADD COLUMN feebreakdown TEXT`);
  } catch (e) {
    if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
      console.log("Migration warning for feebreakdown column:", e.message);
    }
  }
  try { await dbRun(`ALTER TABLE patients ADD COLUMN ischild INTEGER DEFAULT 0`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childga TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childbirthdate TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childbirthweight TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childplaceofbirth TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childdeliverytype TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN childnicuhistory TEXT`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN specialinvestigation INTEGER DEFAULT 0`); } catch (e) {}
  try { await dbRun(`ALTER TABLE patients ADD COLUMN specialinvestigationnotes TEXT`); } catch (e) {}

  // Create Patient History
  await dbRun(`
    CREATE TABLE IF NOT EXISTS patient_history (
      id SERIAL PRIMARY KEY,
      patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visitId BIGINT,
      date TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      diagnosis TEXT,
      prescription TEXT, -- JSON string of prescription array
      prescriptionImg TEXT,
      issuedMedication TEXT,
      paymentStatus TEXT,
      status TEXT
    )
  `);

  // Create Staff Attendance
  await dbRun(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id SERIAL PRIMARY KEY,
      staffId INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      markedBy TEXT,
      shift TEXT DEFAULT 'Day'
    )
  `);
  try {
    await dbRun(`ALTER TABLE staff_attendance ADD COLUMN shift TEXT DEFAULT 'Day'`);
  } catch (e) {
    if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
      console.log("Migration warning for shift column in staff_attendance:", e.message);
    }
  }

  // Create Directory Ledger
  await dbRun(`
    CREATE TABLE IF NOT EXISTS directory_ledger (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      agencyName TEXT
    )
  `);

  // Create Lab Logs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS lab_logs (
      id SERIAL PRIMARY KEY,
      patientId TEXT NOT NULL,
      testName TEXT NOT NULL,
      dateOrdered TEXT NOT NULL,
      status TEXT NOT NULL,
      reportNotes TEXT,
      reportImg TEXT
    )
  `);
  try {
    await dbRun(`ALTER TABLE lab_logs ADD COLUMN IF NOT EXISTS reportImg TEXT`);
  } catch (e) {
    console.log("Migration warning for reportImg column in lab_logs:", e.message);
  }

  // Create Vaccinations Log
  await dbRun(`
    CREATE TABLE IF NOT EXISTS vaccinations_log (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      patientId TEXT NOT NULL,
      injectionName TEXT NOT NULL,
      dosage TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      dateGiven TEXT
    )
  `);

  // Ensure injection and lab default staff accounts always exist
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
  if (docCount.count === 0 && fs.existsSync(dbJsonPath)) {
    console.log("Migrating data from db.json to SQLite database...");
    try {
      const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

      // Insert doctors
      if (dbJson.doctors) {
        for (const doc of dbJson.doctors) {
          await dbRun(
            `INSERT OR IGNORE INTO doctors (id, name, specialty, email, password) VALUES (?, ?, ?, ?, ?)`,
            [doc.id, doc.name, doc.specialty, doc.email, doc.password || 'password123']
          );
        }
      }

      // Insert staff
      if (dbJson.staff) {
        for (const st of dbJson.staff) {
          await dbRun(
            `INSERT OR IGNORE INTO staff (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)`,
            [st.id, st.name, st.email, st.role, st.password || 'password123']
          );
        }
      }

      // Insert patients and their history
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
              pat.status || 'Registered',
              pat.diagnosis || '',
              pat.prescription ? JSON.stringify(pat.prescription) : null,
              pat.issuedMedication || null,
              pat.paymentStatus || 'Unpaid',
              pat.wardBedId
            ]
          );

          // Insert patient history
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
};

// Database APIs
export const getDoctors = () => dbAll(`SELECT * FROM doctors`);
export const addDoctor = async (doc) => {
  const id = doc.id || Date.now();
  await dbRun(
    `INSERT INTO doctors (id, name, specialty, email, password) VALUES (?, ?, ?, ?, ?)`,
    [id, doc.name, doc.specialty, doc.email, doc.password || 'password123']
  );
  return { id, name: doc.name, specialty: doc.specialty, email: doc.email };
};
export const deleteDoctor = (id) => dbRun(`DELETE FROM doctors WHERE id = ?`, [id]);

export const getStaff = () => dbAll(`SELECT * FROM staff`);
export const addStaff = async (st) => {
  const id = st.id || Date.now();
  await dbRun(
    `INSERT INTO staff (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)`,
    [id, st.name, st.email, st.role, st.password || 'password123']
  );
  return { id, name: st.name, email: st.email, role: st.role };
};
export const deleteStaff = (id) => dbRun(`DELETE FROM staff WHERE id = ?`, [id]);
export const deletePatient = (id) => dbRun(
  `UPDATE patients SET status = 'Inactive', tokenNumber = NULL, registrationDate = NULL WHERE id = ?`,
  [id]
);
export const deleteAllPatients = async () => {
  await dbRun(`DELETE FROM patients`);
  await dbRun(`DELETE FROM patient_history`);
};

export const getPatients = async () => {
  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  await dbRun(
    `UPDATE patients 
     SET status = 'Inactive', tokenNumber = NULL, registrationDate = NULL 
     WHERE (registrationDate != ? OR registrationDate IS NULL) 
       AND status != 'Inactive'
       AND (wardBedId IS NULL OR wardBedId = '')`,
    [todayStr]
  );

  const patients = await dbAll(`SELECT * FROM patients`);
  const result = [];
  for (const pat of patients) {
    const historyRows = await dbAll(`SELECT * FROM patient_history WHERE patientId = ?`, [pat.id]);
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

    result.push({
      id: pat.id,
      name: pat.name,
      age: pat.age,
      gender: pat.gender,
      contact: pat.contact,
      address: pat.address,
      assignedDoctorId: pat.assignedDoctorId,
      status: pat.status,
      diagnosis: pat.diagnosis,
      prescription: pat.prescription ? JSON.parse(pat.prescription) : null,
      issuedMedication: pat.issuedMedication,
      paymentStatus: pat.paymentStatus,
      wardBedId: pat.wardBedId,
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
      paidAmount: pat.paidAmount ? parseFloat(pat.paidAmount) : 0,
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
      history: history
    });
  }
  return result;
};

export const getPatientById = async (id) => {
  const pat = await dbGet(`SELECT * FROM patients WHERE id = ?`, [id]);
  if (!pat) return null;

  const historyRows = await dbAll(`SELECT * FROM patient_history WHERE patientId = ?`, [id]);
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
    address: pat.address,
    assignedDoctorId: pat.assignedDoctorId,
    status: pat.status,
    diagnosis: pat.diagnosis,
    prescription: pat.prescription ? JSON.parse(pat.prescription) : null,
    issuedMedication: pat.issuedMedication,
    paymentStatus: pat.paymentStatus,
    wardBedId: pat.wardBedId,
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
    paidAmount: pat.paidAmount ? parseFloat(pat.paidAmount) : 0,
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
    history: history
  };
};


const getNextPatientId = async () => {
  const patients = await dbAll(`SELECT id FROM patients`);
  let maxNum = 0;
  for (const pat of patients) {
    const idStr = String(pat.id);
    if (idStr.startsWith('VH')) {
      const num = parseInt(idStr.substring(2));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `VH${String(nextNum).padStart(3, '0')}`;
};

export const addPatient = async (pat) => {
  const id = pat.id || (await getNextPatientId());
  await dbRun(
    `INSERT INTO patients (id, name, age, gender, contact, address, assignedDoctorId, status, diagnosis, prescription, issuedMedication, paymentStatus, wardBedId, bedAdmissionPending, fatherOrHusbandName, motherOrGuardianName, alternatePhone, tokenNumber, registrationDate, prescriptionImg, height, weight, bp, hr, spo2, grbs, temp, complaints, pastHistory, examination, investigation, bmi, ischild, childga, childbirthdate, childbirthweight, childplaceofbirth, childdeliverytype, childnicuhistory, specialinvestigation, specialinvestigationnotes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      pat.name,
      pat.age,
      pat.gender,
      pat.contact,
      pat.address || '',
      pat.assignedDoctorId,
      pat.status || 'Registered',
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
      pat.specialInvestigationNotes || ''
    ]
  );

  return {
    id,
    name: pat.name,
    age: pat.age,
    gender: pat.gender,
    contact: pat.contact,
    address: pat.address || '',
    assignedDoctorId: pat.assignedDoctorId,
    status: pat.status || 'Registered',
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
    history: []
  };
};

export const updatePatient = async (id, data) => {
  const existing = await dbGet(`SELECT * FROM patients WHERE id = ?`, [id]);
  if (!existing) throw new Error("Patient not found");

  const fields = [];
  const params = [];

  const keys = [
    'name', 'age', 'gender', 'contact', 'address',
    'assignedDoctorId', 'status', 'diagnosis',
    'prescription', 'issuedMedication', 'paymentStatus', 'wardBedId', 'bedAdmissionPending',
    'fatherOrHusbandName', 'motherOrGuardianName', 'alternatePhone', 'tokenNumber', 'registrationDate',
    'prescriptionImg', 'height', 'weight', 'bp', 'hr', 'spo2', 'grbs', 'temp',
    'complaints', 'pastHistory', 'examination', 'investigation', 'bmi', 'paidAmount', 'feeBreakdown',
    'isChild', 'childGa', 'childBirthDate', 'childBirthWeight', 'childPlaceOfBirth', 'childDeliveryType', 'childNicuHistory',
    'specialInvestigation', 'specialInvestigationNotes'
  ];

  for (const k of keys) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      if (k === 'prescription') {
        params.push(data[k] ? JSON.stringify(data[k]) : null);
      } else {
        params.push(data[k]);
      }
    }
  }

  if (fields.length > 0) {
    params.push(id);
    await dbRun(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  // Handle history updates if present
  if (data.history !== undefined) {
    await dbRun(`DELETE FROM patient_history WHERE patientId = ?`, [id]);
    for (const h of data.history) {
      await dbRun(
        `INSERT INTO patient_history (patientId, visitId, date, doctorName, diagnosis, prescription, prescriptionImg, issuedMedication, paymentStatus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
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

  const updated = await dbGet(`SELECT * FROM patients WHERE id = ?`, [id]);
  const historyRows = await dbAll(`SELECT * FROM patient_history WHERE patientId = ?`, [id]);
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
    id: updated.id,
    name: updated.name,
    age: updated.age,
    gender: updated.gender,
    contact: updated.contact,
    address: updated.address,
    assignedDoctorId: updated.assignedDoctorId,
    status: updated.status,
    diagnosis: updated.diagnosis,
    prescription: updated.prescription ? JSON.parse(updated.prescription) : null,
    issuedMedication: updated.issuedMedication,
    paymentStatus: updated.paymentStatus,
    wardBedId: updated.wardBedId,
    bedAdmissionPending: updated.bedAdmissionPending || 0,
    fatherOrHusbandName: updated.fatherOrHusbandName || '',
    motherOrGuardianName: updated.motherOrGuardianName || '',
    alternatePhone: updated.alternatePhone || '',
    tokenNumber: updated.tokenNumber || null,
    registrationDate: updated.registrationDate || '',
    prescriptionImg: updated.prescriptionImg || null,
    height: updated.height || '',
    weight: updated.weight || '',
    bp: updated.bp || '',
    hr: updated.hr || '',
    spo2: updated.spo2 || '',
    grbs: updated.grbs || '',
    temp: updated.temp || '',
    complaints: updated.complaints || '',
    pastHistory: updated.pastHistory || '',
    examination: updated.examination || '',
    investigation: updated.investigation || '',
    bmi: updated.bmi || '',
    paidAmount: updated.paidAmount ? parseFloat(updated.paidAmount) : 0,
    feeBreakdown: updated.feeBreakdown || '',
    isChild: updated.isChild || 0,
    childGa: updated.childGa || '',
    childBirthDate: updated.childBirthDate || '',
    childBirthWeight: updated.childBirthWeight || '',
    childPlaceOfBirth: updated.childPlaceOfBirth || '',
    childDeliveryType: updated.childDeliveryType || '',
    childNicuHistory: updated.childNicuHistory || '',
    history: history
  };
};

// Staff Attendance
export const getAttendance = () => dbAll(`SELECT * FROM staff_attendance`);
export const addAttendance = (att) => dbRun(
  `INSERT INTO staff_attendance (staffId, date, status, markedBy, shift) VALUES (?, ?, ?, ?, ?)`,
  [att.staffId, att.date, att.status, att.markedBy, att.shift || 'Day']
);

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

// Medical Waste
export const getMedicalWaste = () => dbAll(`SELECT * FROM medical_waste`);
export const addMedicalWaste = async (waste) => {
  const result = await dbRun(
    `INSERT INTO medical_waste (date, wasteType, weight, agencyName, billAmount, billAttachment) VALUES (?, ?, ?, ?, ?, ?)`,
    [waste.date, waste.wasteType, waste.weight, waste.agencyName, waste.billAmount, waste.billAttachment]
  );
  return { id: result.lastID, ...waste };
};

// Pharmacy Ledger
export const getPharmacyLedger = () => dbAll(`SELECT * FROM pharmacy_ledger`);
export const addPharmacyLedger = async (ledger) => {
  const result = await dbRun(
    `INSERT INTO pharmacy_ledger (date, type, description, amount, agencyName) VALUES (?, ?, ?, ?, ?)`,
    [ledger.date, ledger.type, ledger.description, ledger.amount, ledger.agencyName]
  );
  return { id: result.lastID, ...ledger };
};

// Lab Logs
export const getLabLogs = () => dbAll(`SELECT * FROM lab_logs`);
export const addLabLog = async (log) => {
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
export const getInjections = () => dbAll(`SELECT * FROM injections_log`);
export const addInjection = async (inj) => {
  const result = await dbRun(
    `INSERT INTO injections_log (patientId, injectionName, dosage, status, dateGiven) VALUES (?, ?, ?, ?, ?)`,
    [inj.patientId, inj.injectionName, inj.dosage, inj.status || 'Pending', inj.dateGiven || '']
  );
  return { id: result.lastID, ...inj };
};
export const updateInjectionStatus = (id, status, dateGiven) => dbRun(
  `UPDATE injections_log SET status = ?, dateGiven = ? WHERE id = ?`,
  [status, dateGiven, id]
);
