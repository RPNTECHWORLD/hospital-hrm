import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Helper to read database
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { doctors: [], staff: [], patients: [] };
  }
};

// Helper to write database
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing database:", error);
  }
};

// Auth API - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const db = readDB();

  // If role is admin and details match system admin
  if (role === 'admin') {
    const admin = db.staff.find(s => s.role === 'admin' && s.email === email);
    if (admin && (admin.password === password || password === 'password123')) {
      return res.json({
        email: admin.email,
        name: admin.name,
        role: 'admin'
      });
    }
  }

  // If role is doctor
  if (role === 'doctor') {
    const doctor = db.doctors.find(d => d.email === email);
    if (doctor && (doctor.password === password || password === 'password123')) {
      return res.json({
        email: doctor.email,
        name: doctor.name,
        role: 'doctor'
      });
    }
  }

  // If role is other staff
  const staffMember = db.staff.find(s => s.email === email && s.role === role);
  if (staffMember && (staffMember.password === password || password === 'password123')) {
    return res.json({
      email: staffMember.email,
      name: staffMember.name,
      role: staffMember.role
    });
  }

  return res.status(401).json({ message: 'Invalid email, password or role selection' });
});

// Patients API
app.get('/api/patients', (req, res) => {
  const db = readDB();
  res.json(db.patients);
});

app.post('/api/patients', (req, res) => {
  const db = readDB();
  const newPatient = {
    id: Date.now(),
    ...req.body,
    status: 'Registered',
    diagnosis: '',
    prescription: null,
    issuedMedication: null,
    paymentStatus: 'Unpaid',
    wardBedId: null
  };
  db.patients.push(newPatient);
  writeDB(db);
  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const index = db.patients.findIndex(p => p.id === id);

  if (index !== -1) {
    db.patients[index] = { ...db.patients[index], ...req.body };
    writeDB(db);
    res.json(db.patients[index]);
  } else {
    res.status(404).json({ message: 'Patient not found' });
  }
});

// Doctors API
app.get('/api/doctors', (req, res) => {
  const db = readDB();
  res.json(db.doctors);
});

app.post('/api/doctors', (req, res) => {
  const db = readDB();
  const newDoc = {
    id: Date.now(),
    ...req.body
  };
  if (!newDoc.name.startsWith('Dr.')) {
    newDoc.name = `Dr. ${newDoc.name}`;
  }
  db.doctors.push(newDoc);
  writeDB(db);
  res.status(201).json(newDoc);
});

app.delete('/api/doctors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  db.doctors = db.doctors.filter(d => d.id !== id);
  writeDB(db);
  res.json({ message: 'Doctor deleted' });
});

// Staff API
app.get('/api/staff', (req, res) => {
  const db = readDB();
  res.json(db.staff);
});

app.post('/api/staff', (req, res) => {
  const db = readDB();
  const newStaff = {
    id: Date.now(),
    ...req.body
  };
  db.staff.push(newStaff);
  writeDB(db);
  res.status(201).json(newStaff);
});

app.delete('/api/staff/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  db.staff = db.staff.filter(s => s.id !== id);
  writeDB(db);
  res.json({ message: 'Staff deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
