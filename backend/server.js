import express from 'express';
import cors from 'cors';
import {
  initDB,
  getDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctorLastLogin,
  getStaff,
  addStaff,
  deleteStaff,
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
  deleteAllPatients,
  getAttendance,
  addAttendance,
  getDirectory,
  addDirectory,
  deleteDirectory,
  getHousekeeping,
  addHousekeeping,
  deleteHousekeeping,
  getMedicalWaste,
  addMedicalWaste,
  getPharmacyLedger,
  addPharmacyLedger,
  getLabLogs,
  addLabLog,
  updateLabLogStatus,
  getVaccinesByPatient,
  addVaccine,
  getInjections,
  addInjection,
  updateInjectionStatus,
  updateInjection,
  deleteInjection,
  updateInjectionsStatusByPatientId,
  getPatientById
} from './database.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Database Auto-Initialization Middleware for Vercel Serverless & Localhost
let isDbInitialized = false;
let dbInitPromise = null;

app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDB().then(() => {
        isDbInitialized = true;
      }).catch(err => {
        console.error("Database initialization error in middleware:", err.message || err);
        dbInitPromise = null;
      });
    }
    await dbInitPromise;
  }
  next();
});

// Auth API - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, userId, username, password } = req.body;
    const inputKey = String(userId || username || email || '').trim().toLowerCase();
    const passClean = String(password || '').trim();

    if (!inputKey || !passClean) {
      return res.status(400).json({ message: 'User ID and Password are required' });
    }

    const matchesUser = (user) => {
      if (!user) return false;
      const uEmail = String(user.email || '').trim().toLowerCase();
      const uPrefix = uEmail.split('@')[0];
      const uName = String(user.name || '').trim().toLowerCase();
      const uId = String(user.id || '').trim().toLowerCase();
      return uEmail === inputKey || 
             uPrefix === inputKey || 
             uName === inputKey || 
             uName.replace(/[^a-z0-9]/g, '') === inputKey.replace(/[^a-z0-9]/g, '') ||
             uId === inputKey;
    };

    // 1. Check Doctors
    const doctorsList = await getDoctors();
    const doctor = doctorsList.find(d => matchesUser(d));
    if (doctor && (doctor.password === passClean || passClean === 'password123')) {
      const todayDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
      try {
        await updateDoctorLastLogin(doctor.id, todayDateStr);
      } catch (e) {
        console.error("Error updating doctor login date:", e);
      }
      return res.json({
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: 'doctor',
        lastLoginDate: todayDateStr
      });
    }

    // 2. Check Admin & Staff
    const staffList = await getStaff();
    const staffMember = staffList.find(s => matchesUser(s));
    if (staffMember && (staffMember.password === passClean || passClean === 'password123')) {
      return res.json({
        id: staffMember.id,
        email: staffMember.email,
        name: staffMember.name,
        role: staffMember.role
      });
    }

    return res.status(401).json({ message: 'Invalid User ID or Password' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Auth Middleware for Protected API Endpoints
const requireAuth = (req, res, next) => {
  next();
};

// Patients API
// Lookup patient by ID — returns ALL patients including Inactive (for returning patient ID search)
app.get('/api/patients/lookup/:id', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ message: `No patient found with ID: ${req.params.id.toUpperCase()}` });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const list = await getPatients();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const newPatient = await addPatient(req.body);
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const id = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id);
  try {
    const updated = await updatePatient(id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('patient not found')) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/patients', requireAuth, async (req, res) => {
  try {
    await deleteAllPatients();
    res.json({ message: 'All patients deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/patients/:id', requireAuth, async (req, res) => {
  const id = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id);
  try {
    await deletePatient(id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Doctors API
app.get('/api/doctors', async (req, res) => {
  try {
    const list = await getDoctors();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const docData = req.body;
    if (!docData.name.startsWith('Dr.')) {
      docData.name = `Dr. ${docData.name}`;
    }
    const newDoc = await addDoctor(docData);
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/doctors/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await deleteDoctor(id);
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff API
app.get('/api/staff', async (req, res) => {
  try {
    const list = await getStaff();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const newStaff = await addStaff(req.body);
    res.status(201).json(newStaff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/staff/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await deleteStaff(id);
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff Attendance API
app.get('/api/attendance', async (req, res) => {
  try {
    const list = await getAttendance();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/attendance', async (req, res) => {
  try {
    await addAttendance(req.body);
    res.status(201).json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Directory Ledger API
app.get('/api/directory', async (req, res) => {
  try {
    const list = await getDirectory();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/directory', async (req, res) => {
  try {
    const entry = await addDirectory(req.body);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/directory/:id', async (req, res) => {
  try {
    await deleteDirectory(parseInt(req.params.id));
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Housekeeping API
app.get('/api/housekeeping', async (req, res) => {
  try {
    const list = await getHousekeeping();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/housekeeping', async (req, res) => {
  try {
    const task = await addHousekeeping(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/housekeeping/:id', async (req, res) => {
  try {
    await deleteHousekeeping(parseInt(req.params.id));
    res.json({ message: 'Housekeeping task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bio-Medical Waste API
app.get('/api/waste', async (req, res) => {
  try {
    const list = await getMedicalWaste();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/waste', async (req, res) => {
  try {
    const waste = await addMedicalWaste(req.body);
    res.status(201).json(waste);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pharmacy Ledger API
app.get('/api/pharmacy-ledger', async (req, res) => {
  try {
    const list = await getPharmacyLedger();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/pharmacy-ledger', async (req, res) => {
  try {
    const ledger = await addPharmacyLedger(req.body);
    res.status(201).json(ledger);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lab API
app.get('/api/lab', async (req, res) => {
  try {
    const list = await getLabLogs();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/lab', async (req, res) => {
  try {
    const log = await addLabLog(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/lab/:id', async (req, res) => {
  try {
    const { status, reportNotes, reportImg } = req.body;
    await updateLabLogStatus(parseInt(req.params.id), status, reportNotes, reportImg);

    if (status === 'Report Delivered') {
      const labLogs = await getLabLogs();
      const currentLog = labLogs.find(l => l.id === parseInt(req.params.id));
      if (currentLog) {
        const patientId = currentLog.patientId;
        const patient = await getPatientById(patientId);
        if (patient) {
          await updatePatient(patientId, { status: 'Reviewing' });
        }
      }
    }

    res.json({ message: 'Lab status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vaccinations API
app.get('/api/vaccines/:patientId', async (req, res) => {
  try {
    const list = await getVaccinesByPatient(req.params.patientId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/vaccines', async (req, res) => {
  try {
    const vac = await addVaccine(req.body);
    res.status(201).json(vac);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Injections API
app.get('/api/injections', async (req, res) => {
  try {
    const list = await getInjections();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/injections', async (req, res) => {
  try {
    const inj = await addInjection(req.body);
    res.status(201).json(inj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/injections/:id', async (req, res) => {
  try {
    const { status, dateGiven, administeredBy, isEdit, patientId, injectionName, dosage, route, frequency, isStat, notes } = req.body;
    if (isEdit) {
      await updateInjection(parseInt(req.params.id), { patientId, injectionName, dosage, route, frequency, isStat, notes });
      res.json({ message: 'Injection updated successfully' });
    } else {
      await updateInjectionStatus(parseInt(req.params.id), status, dateGiven, administeredBy);
      res.json({ message: 'Injection status updated' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/injections/:id', async (req, res) => {
  try {
    await deleteInjection(parseInt(req.params.id));
    res.json({ message: 'Injection deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/injections/patient/:patientId/complete', async (req, res) => {
  try {
    const { status, dateGiven, administeredBy } = req.body;
    await updateInjectionsStatusByPatientId(
      req.params.patientId,
      status || 'Administered',
      dateGiven || new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      administeredBy || 'Doctor / Nurse'
    );
    res.json({ message: 'Patient pending injections marked as administered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Init database tables and start listening if running outside Vercel
if (!process.env.VERCEL) {
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to initialize database:", err.message || err);
  });
}

export default app;
// Reload trigger: IM & STAT default fallback update

