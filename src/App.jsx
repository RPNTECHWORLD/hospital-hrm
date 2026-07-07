import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import WardDashboard from './components/WardDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

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
  FileText
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
  const [user, setUser] = useState(null);
  const [adminActiveView, setAdminActiveView] = useState('admin');

  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Backend Node API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [patientsRes, doctorsRes, staffRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/doctors'),
          fetch('/api/staff')
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

    if (user) {
      loadInitialData();
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
  };

  // Admin Actions
  const handleAddDoctor = async (docData) => {
    try {
      const response = await fetch('/api/doctors', {
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
      const response = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDoctorsList(doctorsList.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
    }
  };

  const handleAddStaff = async (staffData) => {
    try {
      const response = await fetch('/api/staff', {
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
      const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStaffList(staffList.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  // Receptionist Actions
  const handleRegisterPatient = async (newPatientData) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatientData)
      });
      if (response.ok) {
        const newPatient = await response.json();
        setPatients([...patients, newPatient]);
      }
    } catch (err) {
      console.error("Error registering patient:", err);
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
      const response = await fetch(`/api/patients/${patientId}`, {
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
      const response = await fetch(`/api/patients/${patientId}`, {
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
      const response = await fetch(`/api/patients/${patientId}`, {
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

  // Pharmacy Actions
  const handleIssueMedication = async (patientId, issuedString) => {
    try {
      const isPartial = issuedString.toLowerCase().includes('partial');
      const updatedData = {
        status: isPartial ? 'Reviewing' : 'Completed',
        issuedMedication: issuedString
      };
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error issuing medication:", err);
    }
  };

  // Ward Staff Actions
  const handleAssignBed = async (patientId, bedId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
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
      const response = await fetch(`/api/patients/${patientId}`, {
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
          />
        );
      case 'receptionist':
        return (
          <ReceptionistDashboard 
            patients={patients} 
            doctors={doctorsList} 
            onRegisterPatient={handleRegisterPatient}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        );
      case 'doctor':
        return (
          <DoctorDashboard 
            patients={patients} 
            doctorEmail={user.email}
            onSubmitPrescription={handleSubmitPrescription}
            onSubmitReview={handleSubmitReview}
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
      default:
        return (
          <div style={{ textAlign: 'center', marginTop: '5rem' }}>
            <h2>Unauthorized access</h2>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
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
                onClick={() => setAdminActiveView('admin')}
              >
                <Shield size={18} />
                <span>Admin Console</span>
              </div>
              <div 
                className={`nav-item ${adminActiveView === 'receptionist' ? 'active' : ''}`}
                onClick={() => setAdminActiveView('receptionist')}
              >
                <Users size={18} />
                <span>Receptionist Module</span>
              </div>
              <div 
                className={`nav-item ${adminActiveView === 'doctor' ? 'active' : ''}`}
                onClick={() => setAdminActiveView('doctor')}
              >
                <Activity size={18} />
                <span>Doctor Consultations</span>
              </div>
              <div 
                className={`nav-item ${adminActiveView === 'pharmacy' ? 'active' : ''}`}
                onClick={() => setAdminActiveView('pharmacy')}
              >
                <Pill size={18} />
                <span>Pharmacy Module</span>
              </div>
              <div 
                className={`nav-item ${adminActiveView === 'ward' ? 'active' : ''}`}
                onClick={() => setAdminActiveView('ward')}
              >
                <Bed size={18} />
                <span>Ward & Beds Module</span>
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
          <button className="btn-logout" onClick={handleLogout} title="Sign Out">
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
