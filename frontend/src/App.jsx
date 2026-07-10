import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import WardDashboard from './components/WardDashboard';
import AdminDashboard from './components/AdminDashboard';
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
  ClipboardList
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
    status: 'Registered',
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
  const [tvMode, setTvMode] = useState(false);

  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setDoctorsList([...doctorsList, newDoc]);
      }
    } catch (err) {
      console.error("Error adding doctor:", err);
    }
  };

  const handleDeleteDoctor = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/doctors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDoctorsList(doctorsList.filter(d => d.id !== id));
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
        setStaffList([...staffList, newStaff]);
      }
    } catch (err) {
      console.error("Error adding staff:", err);
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
      const todayStr = new Date().toLocaleDateString();
      
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
      const todayStr = new Date().toLocaleDateString();
      
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
        status: 'Registered',
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

  const handleUpdatePaymentStatus = async (patientId, newStatus) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const updatedData = {
        paymentStatus: newStatus,
        status: newStatus === 'Paid' && patient.status === 'Completed' ? 'Completed' : patient.status
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
        prescriptionImg: data.prescriptionImg
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
      console.error("Error submitting prescription:", err);
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
        status: 'Reviewing',
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
          try {
            await fetch(`${API_BASE}/api/injections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: patientId,
                injectionName: injectionData.name,
                dosage: injectionData.dosage,
                status: 'Pending Approval',
                dateGiven: ''
              })
            });
          } catch (err) {
            console.error("Error saving injection:", err);
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
        body: JSON.stringify({ wardBedId: bedId })
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
        body: JSON.stringify({ wardBedId: null })
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

  const activeView = user.role === 'admin' ? adminActiveView : user.role;

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
          />
        );
      case 'doctor':
        return (
          <DoctorDashboard 
            patients={patients} 
            doctorEmail={user.email}
            onSubmitPrescription={handleSubmitPrescription}
            onSubmitReview={handleSubmitReview}
            onStartConsultation={handleStartConsultation}
            onPrintPrescription={handlePrintPrescription}
            onEmailPrescription={handleEmailPrescription}
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
          <span className="logo-text-mobile">Vijayas <span className="logo-sub">HMS</span></span>
        </div>
        <div className="mobile-avatar" onClick={() => setIsSidebarOpen(true)}>
          {user.name.charAt(0)}
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
            <h1 className="logo-text">Vijayas <span className="logo-sub">HMS</span></h1>
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
              >
                <Bed size={18} />
                <span>Ward & Beds Module</span>
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
            <div className="nav-item active">
              <Bed size={18} />
              <span>Ward & Beds Module</span>
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
              {activeView === 'admin' && 'System Admin Console'}
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
        </header>

        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
