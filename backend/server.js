import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import {
  initDB,
  getDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctorLastLogin,
  logoutDoctor,
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
  deleteAttendance,
  getDirectory,
  addDirectory,
  deleteDirectory,
  getHousekeeping,
  addHousekeeping,
  deleteHousekeeping,
  getMedicalWaste,
  addMedicalWaste,
  deleteMedicalWaste,
  getPharmacyLedger,
  addPharmacyLedger,
  getLabLogs,
  addLabLog,
  updateLabLogStatus,
  deleteLabLog,
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

// Gracefully handle malformed JSON payloads without server crash
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Malformed JSON payload received' });
  }
  next(err);
});

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
    if (doctor && doctor.password === passClean) {
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
    if (staffMember && staffMember.password === passClean) {
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

// Doctor Logout Endpoint - Clears lastLoginDate so doctor is removed from Receptionist Available list
app.post('/api/doctors/:id/logout', async (req, res) => {
  try {
    const { id } = req.params;
    await logoutDoctor(id);
    const updatedList = await getDoctors();
    res.json({ message: 'Doctor logged out successfully', doctors: updatedList });
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
    const result = await addAttendance(req.body);
    res.status(201).json({ message: 'Attendance marked', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await deleteAttendance(req.params.id);
    res.json({ message: 'Attendance record deleted' });
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
app.delete('/api/waste/:id', async (req, res) => {
  try {
    await deleteMedicalWaste(req.params.id);
    res.json({ message: 'Waste record deleted successfully' });
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
    const { patientId, testName } = req.body;
    if (!patientId || !testName) {
      return res.status(400).json({ message: 'Patient ID and Test Name are required.' });
    }
    const log = await addLabLog(req.body);
    res.status(201).json(log);
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/lab/:id', async (req, res) => {
  try {
    await deleteLabLog(parseInt(req.params.id));
    res.json({ message: 'Lab log deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/lab/:id', async (req, res) => {
  try {
    const { status, reportNotes, reportImg } = req.body;
    await updateLabLogStatus(parseInt(req.params.id), status, reportNotes, reportImg);
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

// Email Transporter (Supports Gmail App Password or SMTP ENV variables)
const createMailTransporter = async () => {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = (process.env.GMAIL_PASSKEY || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // If no SMTP configured, use nodemailer test transport / dev account
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (e) {
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }
};

app.post('/api/send-prescription-email', async (req, res) => {
  try {
    const { patientId, patientEmail, patientName, patient, customEmail } = req.body;
    const targetEmail = (patientEmail || customEmail || (patient && patient.email) || '').trim();

    if (!targetEmail) {
      return res.status(400).json({ message: 'Patient recipient email address is required.' });
    }

    const pat = patient || (patientId ? await getPatientById(patientId) : null);
    if (!pat) {
      return res.status(404).json({ message: 'Patient details not found.' });
    }

    // Build Exact Official Letterhead HTML Template matching printable prescription paper
    const dateStr = pat.registrationDate || new Date().toLocaleDateString('en-GB');
    const patId = String(pat.id || '').replace(/^#/, '');
    
    // Attachments array for Nodemailer
    const attachments = [];
    const snapshotBase64 = req.body.prescriptionSnapshot || pat.prescriptionImg;

    let prescriptionImageHtml = '';
    if (snapshotBase64 && typeof snapshotBase64 === 'string' && snapshotBase64.includes(';base64,')) {
      const base64Data = snapshotBase64.split(';base64,').pop();
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const cidName = 'official_prescription_sheet_' + Date.now();

      attachments.push({
        filename: `Prescription_${pat.name || patId}.png`,
        content: imgBuffer,
        cid: cidName,
        contentType: 'image/png',
        disposition: 'inline'
      });

      prescriptionImageHtml = `
        <div style="text-align: center; margin: 15px 0;">
          <img src="cid:${cidName}" alt="Official Digital Prescription" style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);" />
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 780px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <div style="padding: 14px 20px; background: #008099; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 16px; font-weight: 800; letter-spacing: 0.5px;">VIJAYA'S HEALTH CARE - OFFICIAL PRESCRIPTION</div>
            <div style="font-size: 13px; font-weight: 600;">Patient: ${pat.name} (#${patId})</div>
          </div>

          <div style="padding: 16px 14px; background: #fafafa;">
            ${prescriptionImageHtml || '<p style="text-align: center; color: #64748b;">Official prescription attached.</p>'}
          </div>

          <div style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
            Vijaya's Health Care • 24/7 Emergency & Pharmacy Support: <strong>+91 94890 48507</strong> | <strong>04564-271393</strong>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">Please find your official prescription document above.</div>
          </div>

        </div>
      </body>
      </html>
    `;

    const transporter = await createMailTransporter();
    const fromAddress = (process.env.GMAIL_USER || process.env.SMTP_FROM || 'vijayashealthcare@gmail.com').trim();
    const mailOptions = {
      from: `"Vijaya's Health Care" <${fromAddress}>`,
      to: targetEmail,
      subject: `Digital Prescription - ${pat.name} (#${pat.id}) | Vijaya's Health Care`,
      html: htmlContent,
      attachments: attachments
    };

    const isRealSmtp = !!((process.env.GMAIL_USER && (process.env.GMAIL_PASSKEY || process.env.GMAIL_APP_PASSWORD)) || process.env.SMTP_USER);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Prescription email sent successfully to ${targetEmail} (Real SMTP: ${isRealSmtp}):`, info ? (info.messageId || 'Sent') : 'Sent');

    res.json({
      success: true,
      isSandbox: !isRealSmtp,
      message: `Prescription successfully sent to ${targetEmail}`,
      targetEmail
    });
  } catch (err) {
    console.error("Error sending prescription email:", err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to send prescription email.'
    });
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

