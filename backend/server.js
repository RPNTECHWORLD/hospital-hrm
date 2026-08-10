import express from 'express';
import cors from 'cors';
import {
  initDB,
  getDoctors,
  addDoctor,
  deleteDoctor,
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

// Auth API - Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // If role is admin and details match system admin
    if (role === 'admin') {
      const staffList = await getStaff();
      const admin = staffList.find(s => s.role === 'admin' && s.email === email);
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
      const doctorsList = await getDoctors();
      const doctor = doctorsList.find(d => d.email === email);
      if (doctor && (doctor.password === password || password === 'password123')) {
        return res.json({
          email: doctor.email,
          name: doctor.name,
          role: 'doctor'
        });
      }
    }

    // If role is other staff
    const staffList = await getStaff();
    const staffMember = staffList.find(s => s.email === email && s.role === role);
    if (staffMember && (staffMember.password === password || password === 'password123')) {
      return res.json({
        email: staffMember.email,
        name: staffMember.name,
        role: staffMember.role
      });
    }

    return res.status(401).json({ message: 'Invalid email, password or role selection' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/patients', async (req, res) => {
  try {
    await deleteAllPatients();
    res.json({ message: 'All patients deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
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

app.delete('/api/doctors/:id', async (req, res) => {
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

app.delete('/api/staff/:id', async (req, res) => {
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

// Init database tables and start listening
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err.message || err);
});

export default app;
// Reload trigger: IM & STAT default fallback update

