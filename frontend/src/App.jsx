import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import WardDashboard from './components/WardDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminAnalytics from './components/AdminAnalytics';
import AdminPatientRecords from './components/AdminPatientRecords';
import TvQueueDisplay from './components/TvQueueDisplay';
import './App.css';
import InjectionRoom from './components/InjectionRoom';
import LabDashboard from './components/LabDashboard';
import DirectoryLedger from './components/DirectoryLedger';
import UtilityLogs from './components/UtilityLogs';
const API_BASE = import.meta.env.VITE_API_URL || '';

import {
  Stethoscope,
  LogOut,
  Users,
  DollarSign,
  Calendar,
  Pill,
  Bed,
  Activity,
  Shield,
  FileText,
  Menu,
  X,
  Monitor,
  Syringe,
  FlaskConical,
  BookOpen,
  ClipboardList,
  BarChart2,
  Search,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';

// Setup default Doctors
const DEFAULT_DOCTORS = [
  { id: 1, name: 'Dr. Vijayan', specialty: 'General Medicine', email: 'doctor1@vijayas.com' },
  { id: 2, name: 'Dr. Sarah', specialty: 'Pediatrician', email: 'doctor2@vijayas.com' }
];

// Setup default Staff
const DEFAULT_STAFF = [
  { id: 1, name: 'Receptionist Staff', email: 'receptionist@vijayas.com', role: 'receptionist' },
  { id: 2, name: 'Pharmacy Staff 1', email: 'pharmacy1@vijayas.com', role: 'pharmacy' },
  { id: 3, name: 'Pharmacy Staff 2', email: 'pharmacy2@vijayas.com', role: 'pharmacy' },
  { id: 4, name: 'Ward Room Staff', email: 'ward@vijayas.com', role: 'ward' }
];

// Pre-populated patients for easy testing
const INITIAL_PATIENTS = [
  {
    id: 1,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    contact: '+91 98765 43210',
    address: '12, Gandhi Street, Chennai',
    assignedDoctorId: 1,
    status: 'In Queue',
    diagnosis: '',
    prescription: null,
    issuedMedication: null,
    paymentStatus: 'Unpaid',
    wardBedId: null
  },
  {
    id: 2,
    name: 'Aisha Rahman',
    age: 28,
    gender: 'Female',
    contact: '+91 87654 32109',
    address: '45B, Pearl Road, Madurai',
    assignedDoctorId: 2,
    status: 'At Pharmacy',
    diagnosis: 'Throat Infection & Fever',
    prescription: [
      { name: 'Amoxicillin 500mg', dosage: '1-0-1 after food', duration: 10 },
      { name: 'Paracetamol 650mg', dosage: '1-1-1 SOS', duration: 5 }
    ],
    issuedMedication: null,
    paymentStatus: 'Unpaid',
    wardBedId: null
  },
  {
    id: 3,
    name: 'Kumar Swamy',
    age: 62,
    gender: 'Male',
    contact: '+91 76543 21098',
    address: '7, Temple View Lane, Coimbatore',
    assignedDoctorId: 1,
    status: 'Reviewing',
    diagnosis: 'Severe Knee Pain & Inflammation',
    prescription: [
      { name: 'Aceclofenac 100mg', dosage: '1-0-1 after food', duration: 14 },
      { name: 'Pantoprazole 40mg', dosage: '1-0-0 before food', duration: 14 }
    ],
    issuedMedication: 'Partial Duration (5 Days)',
    paymentStatus: 'Unpaid',
    wardBedId: null
  }
];

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('hms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Each tab always starts at 'admin' view — never persisted so tabs are fully independent
  const [adminActiveView, setAdminActiveView] = useState('admin');
  const [currentStaffView, setCurrentStaffView] = useState('');
  const [tvMode, setTvMode] = useState(false);

  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI / UX States: Theme, Density, Quick Search, Notifications
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hms_theme') || 'light');
  const [isCompact, setIsCompact] = useState(() => localStorage.getItem('hms_density') === 'compact');
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync Theme & Density DOM attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('hms_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (isCompact) {
      document.documentElement.setAttribute('data-density', 'compact');
      localStorage.setItem('hms_density', 'compact');
    } else {
      document.documentElement.removeAttribute('data-density');
      localStorage.setItem('hms_density', 'normal');
    }
  }, [isCompact]);

  // Global Ctrl + K Keyboard Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowQuickSearch(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Ward Admit Modal
  const [wardAdmitPatient, setWardAdmitPatient] = useState(null); // patient to admit
  const [wardAdmitBedId, setWardAdmitBedId] = useState('');

  const BEDS_CONFIG = [
    { id: '101A', room: '101', name: 'Bed A' },
    { id: '101B', room: '101', name: 'Bed B' },
    { id: '102A', room: '102', name: 'Bed A' },
    { id: '102B', room: '102', name: 'Bed B' },
    { id: '103A', room: '103', name: 'Bed A' },
    { id: '103B', room: '103', name: 'Bed B' },
    { id: '104A', room: '104', name: 'Bed A' },
    { id: '104B', room: '104', name: 'Bed B' },
    { id: '105A', room: '105', name: 'Bed A' },
    { id: '105B', room: '105', name: 'Bed B' }
  ];

  const handleOpenWardAdmit = (patient) => {
    setWardAdmitPatient(patient);
    setWardAdmitBedId('');
  };

  const handleConfirmWardAdmit = async () => {
    if (!wardAdmitPatient || !wardAdmitBedId) return;
    await handleAssignBed(wardAdmitPatient.id, wardAdmitBedId);
    setWardAdmitPatient(null);
    setWardAdmitBedId('');
  };

  // Sync user state to sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('hms_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('hms_user');
    }
  }, [user]);


  // Fetch initial data and start polling from Backend Node API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [patientsRes, doctorsRes, staffRes] = await Promise.all([
          fetch(`${API_BASE}/api/patients`),
          fetch(`${API_BASE}/api/doctors`),
          fetch(`${API_BASE}/api/staff`)
        ]);

        if (patientsRes.ok && doctorsRes.ok && staffRes.ok) {
          const patientsData = await patientsRes.json();
          const doctorsData = await doctorsRes.json();
          const staffData = await staffRes.json();

          setPatients(patientsData);
          setDoctorsList(doctorsData);
          setStaffList(staffData);
        }
      } catch (err) {
        console.error("Error loading data from server:", err);
      } finally {
        setLoading(false);
      }
    };

    const pollPatients = async () => {
      try {
        const patientsRes = await fetch(`${API_BASE}/api/patients`);
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
        }
      } catch (err) {
        console.error("Error polling patients:", err);
      }
    };

    if (user) {
      loadInitialData();
      const interval = setInterval(pollPatients, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setAdminActiveView('admin');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPatients([]);
    setAdminActiveView('admin');
    sessionStorage.removeItem('hms_user');
  };

  // Admin Actions
  const handleAddDoctor = async (docData) => {
    try {
      const response = await fetch(`${API_BASE}/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      if (response.ok) {
        const newDoc = await response.json();
        setDoctorsList(prev => [...prev, newDoc]);
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Error adding doctor:", err.message);
        return false;
      }
    } catch (err) {
      console.error("Error adding doctor:", err);
      return false;
    }
  };

  const handleDeleteDoctor = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/doctors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDoctorsList(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
    }
  };

  const handleAddStaff = async (staffData) => {
    try {
      const response = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      if (response.ok) {
        const newStaff = await response.json();
        setStaffList(prev => [...prev, newStaff]);
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Error adding staff:", err.message);
        return false;
      }
    } catch (err) {
      console.error("Error adding staff:", err);
      return false;
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/staff/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStaffList(staffList.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPatients(patients.map(p => p.id === id ? { ...p, status: 'Inactive', tokenNumber: null, registrationDate: null } : p));
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
    }
  };

  const handleDeleteAllPatients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/patients`, { method: 'DELETE' });
      if (response.ok) {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error deleting all patients:", err);
    }
  };

  // Receptionist Actions
  const handleRegisterPatient = async (newPatientData) => {
    try {
      const docId = parseInt(newPatientData.assignedDoctorId);
      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

      // Filter patients assigned to this doctor registered today
      const activeForDocToday = patients.filter(p =>
        p.assignedDoctorId === docId &&
        p.registrationDate === todayStr
      );

      const nextToken = activeForDocToday.length > 0
        ? Math.max(...activeForDocToday.map(p => p.tokenNumber || 0)) + 1
        : 1;

      const patientWithToken = {
        ...newPatientData,
        tokenNumber: nextToken,
        registrationDate: todayStr
      };

      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientWithToken)
      });
      if (response.ok) {
        const newPatient = await response.json();
        setPatients([...patients, newPatient]);
        return newPatient;
      }
    } catch (err) {
      console.error("Error registering patient:", err);
    }
  };

  const handleReRegisterPatient = async (patientId, doctorId, vitalsData = {}) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const doctors = doctorsList;
      let updatedHistory = patient.history || [];

      if (patient.diagnosis || (patient.prescription && patient.prescription.length > 0) || patient.prescriptionImg) {
        const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
        const archiveEntry = {
          visitId: Date.now(),
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          doctorName: assignedDoc ? assignedDoc.name : 'Unknown Doctor',
          diagnosis: patient.diagnosis || 'No diagnosis recorded',
          prescription: patient.prescription || [],
          prescriptionImg: patient.prescriptionImg || null,
          issuedMedication: patient.issuedMedication || 'None',
          paymentStatus: patient.paymentStatus,
          status: patient.status
        };

        const isDuplicate = updatedHistory.some(h =>
          h.diagnosis === archiveEntry.diagnosis &&
          JSON.stringify(h.prescription) === JSON.stringify(archiveEntry.prescription) &&
          h.prescriptionImg === archiveEntry.prescriptionImg
        );

        if (!isDuplicate) {
          updatedHistory = [...updatedHistory, archiveEntry];
        }
      }

      const docIdInt = parseInt(doctorId);
      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

      // Filter patients assigned to this doctor registered today
      const activeForDocToday = patients.filter(p =>
        p.assignedDoctorId === docIdInt &&
        p.registrationDate === todayStr
      );

      const nextToken = activeForDocToday.length > 0
        ? Math.max(...activeForDocToday.map(p => p.tokenNumber || 0)) + 1
        : 1;

      const updatedPatientData = {
        ...patient,
        assignedDoctorId: docIdInt,
        status: 'In Queue',
        diagnosis: '',
        prescription: null,
        prescriptionImg: null,
        issuedMedication: null,
        paymentStatus: 'Unpaid',
        wardBedId: null,
        tokenNumber: nextToken,
        registrationDate: todayStr,
        history: updatedHistory,
        ...vitalsData
      };

      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatientData)
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
        return updatedPatient;
      }
    } catch (err) {
      console.error("Error re-registering patient:", err);
    }
  };

  const handleUpdatePaymentStatus = async (patientId, newStatus, paidAmount = 0, feeBreakdown = '') => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const updatedData = {
        paymentStatus: newStatus,
        status: (newStatus && newStatus.startsWith('Paid')) && patient.status === 'Completed' ? 'Completed' : patient.status,
        paidAmount: parseFloat(paidAmount) || 0,
        feeBreakdown: feeBreakdown
      };
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // Doctor Actions
  const handleSubmitPrescription = async (patientId, data) => {
    try {
      const updatedData = {
        status: 'At Pharmacy',
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        prescriptionImg: data.prescriptionImg,
        wardBedId: data.wardBedId !== undefined ? data.wardBedId : null,
        bedAdmissionPending: data.bedAdmissionPending !== undefined ? data.bedAdmissionPending : 0
      };
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error submitting prescription:", err);
      return false;
    }
  };

  const handleSubmitReview = async (patientId, data) => {
    try {
      const updatedData = {
        status: 'Completed',
        followUpNotes: data.followUpNotes,
        nextVisitDate: data.nextVisitDate
      };
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  const handleStartConsultation = async (patientId) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Consulting' })
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error starting consultation:", err);
    }
  };

  // Pharmacy Actions
  const handleIssueMedication = async (patientId, issuedString, injectionData = null) => {
    try {
      const updatedData = {
        status: 'Completed',
        issuedMedication: issuedString
      };
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));

        if (injectionData) {
          const list = Array.isArray(injectionData) ? injectionData : [injectionData];
          for (const inj of list) {
            if (inj && (inj.name || inj.injectionName)) {
              try {
                await fetch(`${API_BASE}/api/injections`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    patientId: patientId,
                    injectionName: inj.name || inj.injectionName,
                    dosage: inj.dosage || '',
                    status: 'Pending Approval',
                    dateGiven: ''
                  })
                });
              } catch (err) {
                console.error("Error saving injection:", err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error issuing medication:", err);
    }
  };

  // Ward Staff Actions
  const handleAssignBed = async (patientId, bedId) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardBedId: bedId, bedAdmissionPending: 0 })
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error assigning bed:", err);
    }
  };

  const handleDischargePatient = async (patientId) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardBedId: null, bedAdmissionPending: 0 })
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error discharging patient:", err);
    }
  };

  // Printing & Email simulation helper functions
  const handlePrintPrescription = () => {
    window.print();
  };

  const handleEmailPrescription = (sharePatient) => {
    console.log(`Emailed prescription to ${sharePatient.name} at patient@gmail.com`);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (tvMode) {
    return (
      <TvQueueDisplay
        patients={patients}
        doctors={doctorsList}
        onExit={() => setTvMode(false)}
      />
    );
  }

  const activeView = user.role === 'admin' ? adminActiveView : (currentStaffView || user.role);

  // Dashboard Renderer based on current active view
  const renderDashboard = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
          <div className="logo-icon" style={{ padding: '1rem', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }}>
            <Stethoscope size={36} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching hospital records...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'analytics':
        return (
          <AdminAnalytics
            patients={patients}
            doctors={doctorsList}
            staffList={staffList}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            patients={patients}
            doctors={doctorsList}
            staffList={staffList}
            onAddDoctor={handleAddDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onDeletePatient={handleDeletePatient}
            onDeleteAllPatients={handleDeleteAllPatients}
          />
        );
      case 'patients':
        return (
          <AdminPatientRecords
            patients={patients}
            doctors={doctorsList}
            onDeletePatient={handleDeletePatient}
            onDeleteAllPatients={handleDeleteAllPatients}
            onAdmitToWard={handleOpenWardAdmit}
          />
        );
      case 'receptionist':
        return (
          <ReceptionistDashboard
            patients={patients}
            doctors={doctorsList}
            onRegisterPatient={handleRegisterPatient}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onReRegisterPatient={handleReRegisterPatient}
            isAdmin={user?.role === 'admin'}
            onDeletePatient={handleDeletePatient}
            onAdmitToWard={handleOpenWardAdmit}
          />
        );
      case 'doctor':
        return (
          <DoctorDashboard
            patients={patients}
            doctors={doctorsList}
            doctorEmail={user.email}
            userRole={user.role}
            onSubmitPrescription={handleSubmitPrescription}
            onSubmitReview={handleSubmitReview}
            onStartConsultation={handleStartConsultation}
            onPrintPrescription={handlePrintPrescription}
            onEmailPrescription={handleEmailPrescription}
            onAdmitToWard={handleOpenWardAdmit}
          />
        );
      case 'pharmacy':
        return (
          <PharmacyDashboard
            patients={patients}
            doctors={doctorsList}
            onIssueMedication={handleIssueMedication}
            onPrintPrescription={handlePrintPrescription}
            onEmailPrescription={handleEmailPrescription}
          />
        );
      case 'ward':
        return (
          <WardDashboard
            patients={patients}
            onAssignBed={handleAssignBed}
            onDischargePatient={handleDischargePatient}
          />
        );
      case 'injection':
        return (
          <InjectionRoom patients={patients} />
        );
      case 'lab':
        return (
          <LabDashboard patients={patients} />
        );
      case 'directory':
        return (
          <DirectoryLedger />
        );
      case 'utility':
        return (
          <UtilityLogs />
        );
      default:
        return (
          <div style={{ textAlign: 'center', marginTop: '5rem' }}>
            <h2>Unauthorized access</h2>
          </div>
        );
    }
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile top navigation bar */}
      <div className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <div className="logo-icon" style={{ padding: '0.35rem', boxShadow: 'none' }}>
            <Stethoscope size={18} />
          </div>
          <span className="logo-text-mobile">Vijaya's <span className="logo-sub">Health Care</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="theme-toggle-btn-mobile"
            onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            aria-label="Toggle Dark Mode"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {themeMode === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
          </button>
          <div className="mobile-avatar" onClick={() => setIsSidebarOpen(true)}>
            {user.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Sidebar backdrop overlay */}
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>

        <div className="logo-container">
          <div className="logo-icon">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="logo-text">Vijaya's <span className="logo-sub">Health Care</span></h1>
          </div>
        </div>

        <div className="nav-links">
          {user.role === 'admin' && (
            <>
              <div
                className={`nav-item ${adminActiveView === 'admin' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('admin'); setIsSidebarOpen(false); }}
              >
                <Shield size={18} />
                <span>Admin Console</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'analytics' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('analytics'); setIsSidebarOpen(false); }}
              >
                <BarChart2 size={18} />
                <span>Analytics</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'patients' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('patients'); setIsSidebarOpen(false); }}
              >
                <FileText size={18} />
                <span>Patient Records</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'receptionist' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('receptionist'); setIsSidebarOpen(false); }}
              >
                <Users size={18} />
                <span>Receptionist Module</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'doctor' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('doctor'); setIsSidebarOpen(false); }}
              >
                <Activity size={18} />
                <span>Doctor Consultations</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'pharmacy' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('pharmacy'); setIsSidebarOpen(false); }}
              >
                <Pill size={18} />
                <span>Pharmacy Module</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'ward' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('ward'); setIsSidebarOpen(false); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bed size={18} />
                  <span>Ward & Beds Module</span>
                </div>
                {patients.filter(p => p.bedAdmissionPending === 1 && p.status !== 'Inactive').length > 0 && (
                  <span style={{
                    background: 'var(--warning)',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    padding: '0.1rem 0.5rem',
                    lineHeight: '1.2'
                  }}>
                    {patients.filter(p => p.bedAdmissionPending === 1 && p.status !== 'Inactive').length}
                  </span>
                )}
              </div>
              <div
                className={`nav-item ${adminActiveView === 'injection' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('injection'); setIsSidebarOpen(false); }}
              >
                <Syringe size={18} />
                <span>Injection Desk</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'lab' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('lab'); setIsSidebarOpen(false); }}
              >
                <FlaskConical size={18} />
                <span>Laboratory Module</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'directory' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('directory'); setIsSidebarOpen(false); }}
              >
                <BookOpen size={18} />
                <span>Directory & Ledgers</span>
              </div>
              <div
                className={`nav-item ${adminActiveView === 'utility' ? 'active' : ''}`}
                onClick={() => { setAdminActiveView('utility'); setIsSidebarOpen(false); }}
              >
                <ClipboardList size={18} />
                <span>Checklists & Logs</span>
              </div>
            </>
          )}

          {user.role === 'receptionist' && (
            <div className="nav-item active">
              <Users size={18} />
              <span>Receptionist Module</span>
            </div>
          )}
          {user.role === 'doctor' && (
            <div className="nav-item active">
              <Activity size={18} />
              <span>Doctor Consultations</span>
            </div>
          )}
          {user.role === 'pharmacy' && (
            <div className="nav-item active">
              <Pill size={18} />
              <span>Pharmacy Module</span>
            </div>
          )}
          {user.role === 'ward' && (
            <div className="nav-item active" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bed size={18} />
                <span>Ward & Beds Module</span>
              </div>
              {patients.filter(p => p.bedAdmissionPending === 1 && p.status !== 'Inactive').length > 0 && (
                <span style={{
                  background: 'var(--warning)',
                  color: '#000',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '0.1rem 0.5rem',
                  lineHeight: '1.2'
                }}>
                  {patients.filter(p => p.bedAdmissionPending === 1 && p.status !== 'Inactive').length}
                </span>
              )}
            </div>
          )}
          {user.role === 'injection' && (
            <div className="nav-item active" style={{ borderLeft: '3px solid #f59e0b' }}>
              <Syringe size={18} style={{ color: '#f59e0b' }} />
              <span>Injection Desk</span>
            </div>
          )}
          {user.role === 'lab' && (
            <div className="nav-item active" style={{ borderLeft: '3px solid #10b981' }}>
              <FlaskConical size={18} style={{ color: '#10b981' }} />
              <span>Laboratory Module</span>
            </div>
          )}

          <div
            className="nav-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', opacity: 0.8 }}
            onClick={() => { setTvMode(true); setIsSidebarOpen(false); }}
          >
            <Monitor size={18} />
            <span>TV Queue Display</span>
          </div>
        </div>

        {/* User profile section at the bottom */}
        <div className="user-profile">
          <div className="avatar">
            {user.name.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role.toUpperCase()}</span>
          </div>
          <button className="btn-logout" onClick={() => { handleLogout(); setIsSidebarOpen(false); }} title="Sign Out">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main dashboard viewport */}
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h2 className="header-title">
              {activeView === 'analytics' && 'Analytics Dashboard'}
              {activeView === 'admin' && 'System Admin Console'}
              {activeView === 'patients' && 'Patient Records'}
              {activeView === 'receptionist' && 'Receptionist Dashboard'}
              {activeView === 'doctor' && 'Doctor Consultation Terminal'}
              {activeView === 'pharmacy' && 'Pharmacy Dispatch Desk'}
              {activeView === 'ward' && 'Ward Room Occupancy System'}
              {activeView === 'injection' && 'Injection Desk'}
              {activeView === 'lab' && 'Laboratory Investigation Module'}
              {activeView === 'directory' && 'Directory & Expense Ledger Book'}
              {activeView === 'utility' && 'Housekeeping, Attendance & Waste Logs'}
            </h2>
            <p className="header-subtitle">Welcome back, {user.name} • Hospital Management Workspace</p>
          </div>

          {/* Header Action Controls */}
          <div className="header-actions">
            {/* Dark / Light Theme Toggle Button */}
            <button
              className="header-btn theme-toggle-btn"
              onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
              title={themeMode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme Mode"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun size={15} style={{ color: '#f59e0b' }} />
                  <span className="hide-mobile">Light</span>
                </>
              ) : (
                <>
                  <Moon size={15} style={{ color: '#6366f1' }} />
                  <span className="hide-mobile">Dark</span>
                </>
              )}
            </button>

            {/* Quick Search Button */}
            <button className="header-btn" onClick={() => setShowQuickSearch(true)} title="Quick Search Patients (Ctrl + K)">
              <Search size={15} />
              <span className="hide-mobile">Search</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.7, background: 'rgba(0,0,0,0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.2rem' }}>Ctrl+K</span>
            </button>




            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button className="header-btn" onClick={() => setShowNotifications(!showNotifications)} title="Notifications Center">
                <Bell size={15} />
                {patients.filter(p => ['Registered', 'Consulting', 'At Pharmacy'].includes(p.status)).length > 0 && (
                  <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute', right: 0, top: '120%', width: '320px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)',
                  padding: '1rem', zIndex: 9999, animation: 'fadeIn 0.15s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Live Notifications</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>● Active</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Activity size={14} style={{ color: '#6366f1' }} />
                      <div><strong>{patients.filter(p => p.status === 'Registered').length} Patients</strong> waiting in Queue</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Pill size={14} style={{ color: '#f59e0b' }} />
                      <div><strong>{patients.filter(p => p.status === 'At Pharmacy').length} Prescriptions</strong> pending dispatch</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Bed size={14} style={{ color: '#ef4444' }} />
                      <div><strong>{patients.filter(p => p.bedAdmissionPending === 1).length} Bed Admission</strong> requests</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {renderDashboard()}
      </main>

      {/* ===== GLOBAL WARD ADMIT MODAL ===== */}
      {wardAdmitPatient && (() => {
        const occupiedBedIds = new Set(
          patients
            .filter(p => p.wardBedId && p.id !== wardAdmitPatient.id && p.status !== 'Inactive')
            .map(p => p.wardBedId)
        );
        return (
          <div
            onClick={() => setWardAdmitPatient(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(10, 20, 35, 0.72)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff',
                color: '#111',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
                borderRadius: '18px 18px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛏️ Admit to Ward Room
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    Patient: <strong style={{ color: '#fff' }}>{wardAdmitPatient.name}</strong> • {wardAdmitPatient.age} Yrs • #{wardAdmitPatient.id}
                  </div>
                </div>
                <button
                  onClick={() => setWardAdmitPatient(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: '50%', width: '34px', height: '34px',
                    color: '#fff', cursor: 'pointer', fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', marginTop: 0 }}>
                  Select an available bed below to admit this patient directly.
                </p>

                {/* Bed Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {BEDS_CONFIG.map(bed => {
                    const isOccupied = occupiedBedIds.has(bed.id);
                    const isSelected = wardAdmitBedId === bed.id;
                    return (
                      <button
                        key={bed.id}
                        disabled={isOccupied}
                        onClick={() => !isOccupied && setWardAdmitBedId(bed.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '12px',
                          border: isSelected
                            ? '2.5px solid #0f766e'
                            : isOccupied ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(14,116,144,0.12))'
                            : isOccupied ? '#fef2f2' : '#f8fafc',
                          cursor: isOccupied ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          opacity: isOccupied ? 0.65 : 1,
                          position: 'relative'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room {bed.room}</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isOccupied ? '#ef4444' : isSelected ? '#0f766e' : '#1e293b', marginTop: '0.15rem' }}>
                          🛏 {bed.name}
                        </div>
                        <div style={{
                          marginTop: '0.4rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isOccupied ? '#ef4444' : '#10b981',
                          display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOccupied ? '#ef4444' : '#10b981', display: 'inline-block' }} />
                          {isOccupied ? 'Occupied' : 'Available'}
                        </div>
                        {isSelected && (
                          <div style={{
                            position: 'absolute', top: '8px', right: '10px',
                            background: '#0f766e', color: '#fff',
                            borderRadius: '50%', width: '20px', height: '20px',
                            fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
                          }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Confirm Button */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleConfirmWardAdmit}
                    disabled={!wardAdmitBedId}
                    style={{
                      flex: 1, padding: '0.85rem',
                      background: wardAdmitBedId ? 'linear-gradient(135deg, #0f766e, #0e7490)' : '#e2e8f0',
                      color: wardAdmitBedId ? '#fff' : '#94a3b8',
                      border: 'none', borderRadius: '10px',
                      fontWeight: 800, fontSize: '0.95rem',
                      cursor: wardAdmitBedId ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      boxShadow: wardAdmitBedId ? '0 4px 15px rgba(15,118,110,0.3)' : 'none'
                    }}
                  >
                    ✅ Confirm Ward Admission
                  </button>
                  <button
                    onClick={() => setWardAdmitPatient(null)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: 'transparent', border: '1.5px solid #e2e8f0',
                      borderRadius: '10px', color: '#64748b',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                    }}
                  >Cancel</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== GLOBAL QUICK SEARCH MODAL (Ctrl + K) ===== */}
      {showQuickSearch && (
        <div className="quick-search-backdrop" onClick={() => setShowQuickSearch(false)}>
          <div className="quick-search-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <Search size={18} style={{ color: 'var(--primary)', marginRight: '0.75rem' }} />
              <input
                type="text"
                className="quick-search-input"
                placeholder="Search patient by Name, ID, Phone, Token No... (Esc to close)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => setShowQuickSearch(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem' }}
              >✕</button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
              {!searchQuery.trim() ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  <Sparkles size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <div>Type any patient name, ID number, or phone number to find records instantly.</div>
                </div>
              ) : (() => {
                const q = searchQuery.toLowerCase().trim();
                const qClean = q.replace(/^vh|^#/i, '').trim(); // Remove 'VH' or '#' prefix for matching numeric ID

                const matched = patients.filter(p => {
                  const nameMatch = p.name.toLowerCase().includes(q);
                  const rawId = String(p.id).toLowerCase();
                  const vhId = `vh${rawId.padStart(3, '0')}`.toLowerCase(); // Format: vh019, vh001
                  const vhShortId = `vh${rawId}`.toLowerCase(); // Format: vh19
                  const hashId = `#${rawId}`.toLowerCase();

                  const idMatch =
                    rawId.includes(q) ||
                    rawId.includes(qClean) ||
                    vhId.includes(q) ||
                    vhShortId.includes(q) ||
                    hashId.includes(q);

                  const phoneMatch = p.contact && String(p.contact).includes(q);
                  const tokenMatch = p.tokenNumber && String(p.tokenNumber).includes(q);

                  return nameMatch || idMatch || phoneMatch || tokenMatch;
                });

                if (matched.length === 0) {
                  return (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No patients found matching "<strong>{searchQuery}</strong>".
                    </div>
                  );
                }

                return matched.map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {p.name} <span style={{ color: 'var(--primary)', fontSize: '0.82rem', marginLeft: '0.4rem', fontWeight: 800 }}>#VH{String(p.id).padStart(3, '0')}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {p.age} Yrs • {p.gender} {p.contact ? `• ${p.contact}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge badge-${(p.status || 'registered').toLowerCase().replace(' ', '')}`}>
                        {p.status === 'Registered' ? 'In Queue' : p.status}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
