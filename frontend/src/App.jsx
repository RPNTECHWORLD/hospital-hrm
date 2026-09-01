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
import ConfirmModal from './components/ConfirmModal';
import ToastNotification from './components/ToastNotification';
import { generateFullPrescriptionImage, capturePrescriptionDOMImage } from './components/PrescriptionTemplate';
import { printPrescriptionDirectly } from './utils/printHelper';
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
  Check,
  UserPlus,
  CheckCircle
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

const isSameId = (a, b) => {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  if (a === b || String(a) === String(b)) return true;
  const strA = String(a).toLowerCase().replace(/[^a-z0-9]/g, '');
  const strB = String(b).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (strA === strB) return true;
  const numA = parseInt(String(a).replace(/\D/g, ''), 10);
  const numB = parseInt(String(b).replace(/\D/g, ''), 10);
  if (!isNaN(numA) && !isNaN(numB) && numA > 0 && numA === numB) return true;
  return false;
};

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
  const [doctorsList, setDoctorsList] = useState(DEFAULT_DOCTORS);
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [injectionsList, setInjectionsList] = useState([]);
  const [labLogsList, setLabLogsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI / UX States: Theme, Density, Quick Search, Notifications, Custom Confirm & Toast
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hms_theme') || 'light');
  const [isCompact, setIsCompact] = useState(() => localStorage.getItem('hms_density') === 'compact');
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [toastConfig, setToastConfig] = useState(null);

  // Sync Theme & Density DOM attributes
  useEffect(() => {
    if (!user) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', themeMode);
      localStorage.setItem('hms_theme', themeMode);
    }
  }, [themeMode, user]);

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

  const handleRequestWardAdmit = async (patientId, bedId) => {
    try {
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const updatedData = {
        wardBedId: bedId,
        bedAdmissionPending: 1
      };

      // Instant optimistic update so Ward Module badge & request banner appear immediately
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? { ...p, ...updatedData } : p));
      setToastConfig({ message: `Patient admitted to Bed ${bedId} successfully!`, type: 'success' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error requesting ward admission:", err);
    }
  };

  const handleConfirmWardAdmit = async () => {
    if (!wardAdmitPatient || !wardAdmitBedId) return;
    const pat = wardAdmitPatient;
    const bed = wardAdmitBedId;

    // 1. In-memory check against active already-admitted patients
    const occupiedPatient = patients.find(p =>
      p.wardBedId === bed &&
      !isSameId(p.id, pat.id) &&
      p.status !== 'Inactive' &&
      !p.bedAdmissionPending &&
      p.bedAdmissionPending != 1
    );

    if (occupiedPatient) {
      const docName = (doctorsList || []).find(d => isSameId(d.id, occupiedPatient.assignedDoctorId))?.name || occupiedPatient.assignedDoctorName || occupiedPatient.doctorName || 'another Doctor';
      setToastConfig({
        message: `⚠️ Bed Conflict Warning! Bed ${bed} is already occupied by patient ${occupiedPatient.name} (#${occupiedPatient.id}) under ${docName}. Please choose another available bed.`,
        type: 'danger'
      });
      return;
    }

    // 2. Real-time fetch verification to prevent simultaneous race conditions between multiple doctors
    try {
      const res = await fetch(`${API_BASE}/api/patients`);
      if (res.ok) {
        const freshList = await res.json();
        if (Array.isArray(freshList)) {
          setPatients(freshList);
          const freshConflict = freshList.find(p =>
            p.wardBedId === bed &&
            !isSameId(p.id, pat.id) &&
            p.status !== 'Inactive' &&
            !p.bedAdmissionPending &&
            p.bedAdmissionPending != 1
          );
          if (freshConflict) {
            const docName = (doctorsList || []).find(d => isSameId(d.id, freshConflict.assignedDoctorId))?.name || freshConflict.assignedDoctorName || freshConflict.doctorName || 'another Doctor';
            setToastConfig({
              message: `⚠️ Bed Conflict Warning! Bed ${bed} was just occupied by patient ${freshConflict.name} (#${freshConflict.id}) under ${docName}. Please choose another bed.`,
              type: 'danger'
            });
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Could not verify live bed status:", e);
    }

    setWardAdmitPatient(null);
    setWardAdmitBedId('');
    await handleRequestWardAdmit(pat.id, bed);
  };

  // Sync user state to sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('hms_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('hms_user');
    }
  }, [user]);

  const isPollingRef = React.useRef(false);

  // Fetch initial data and start polling from Backend Node API
  const pollData = async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const controller = new AbortController();
    const pollTimeout = setTimeout(() => controller.abort(), 6000);

    try {
      const fetchOpts = { signal: controller.signal };
      const [patientsRes, doctorsRes, staffRes, injRes, labRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/patients`, fetchOpts),
        fetch(`${API_BASE}/api/doctors`, fetchOpts),
        fetch(`${API_BASE}/api/staff`, fetchOpts),
        fetch(`${API_BASE}/api/injections`, fetchOpts),
        fetch(`${API_BASE}/api/lab`, fetchOpts)
      ]);

      if (patientsRes.status === 'fulfilled' && patientsRes.value.ok) {
        const rawPatientsData = await patientsRes.value.json();
        const patientsData = normalizeTokensForPatients(rawPatientsData);
        setPatients(prev => {
          if (!prev) return patientsData;
          if (prev.length !== patientsData.length) return patientsData;
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(patientsData);
          return prevStr !== nextStr ? patientsData : prev;
        });
      }
      if (doctorsRes.status === 'fulfilled' && doctorsRes.value.ok) {
        const doctorsData = await doctorsRes.value.json();
        if (Array.isArray(doctorsData)) {
          setDoctorsList(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(doctorsData);
            return prevStr !== nextStr ? doctorsData : prev;
          });
        }
      }
      if (staffRes.status === 'fulfilled' && staffRes.value.ok) {
        const staffData = await staffRes.value.json();
        if (Array.isArray(staffData)) {
          setStaffList(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(staffData);
            return prevStr !== nextStr ? staffData : prev;
          });
        }
      }
      if (injRes.status === 'fulfilled' && injRes.value.ok) {
        const injData = await injRes.value.json();
        if (Array.isArray(injData)) {
          setInjectionsList(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(injData);
            return prevStr !== nextStr ? injData : prev;
          });
        }
      }
      if (labRes.status === 'fulfilled' && labRes.value.ok) {
        const labData = await labRes.value.json();
        if (Array.isArray(labData)) {
          setLabLogsList(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(labData);
            return prevStr !== nextStr ? labData : prev;
          });
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error polling data:", err);
      }
    } finally {
      clearTimeout(pollTimeout);
      isPollingRef.current = false;
    }
  };

  // ⚡ Live Real-Time Background Auto-Sync (Every 3.5 seconds + on Window Focus / Visibility Change)
  useEffect(() => {
    if (!user) return;

    // 1. Initial Load
    pollData().finally(() => setLoading(false));

    // 2. Periodic background poll every 3.5 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        pollData();
      }
    }, 3500);

    // 3. Instant sync on tab focus or visibility return
    const handleFocus = () => {
      pollData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user]);

  // ⚡ Instant live sync whenever the user navigates between modules / sidebar tabs
  useEffect(() => {
    if (user) {
      pollData();
    }
  }, [adminActiveView, currentStaffView]);


  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentStaffView('');
    if (userData.role === 'admin') {
      setAdminActiveView('admin');
    }
  };

  const handleLogout = async () => {
    if (user && (user.role === 'doctor' || user.role === 'Doctor')) {
      const docId = user.id;
      // Optimistically clear doctor lastLoginDate in doctorsList state
      setDoctorsList(prev => prev.map(d => (String(d.id) === String(docId) || d.email === user.email) ? { ...d, lastLoginDate: null } : d));
      try {
        await fetch(`${API_BASE}/api/doctors/${encodeURIComponent(docId)}/logout`, { method: 'POST' });
      } catch (e) {
        console.error("Error logging out doctor:", e);
      }
    }
    setUser(null);
    setPatients([]);
    setAdminActiveView('admin');
    setCurrentStaffView('');
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

  const handleDeleteDoctor = (id, docName = '') => {
    const targetDoc = doctorsList.find(d => String(d.id) === String(id));
    const name = docName || (targetDoc ? targetDoc.name : 'Doctor');
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Doctor Account',
      message: 'Are you sure you want to delete this doctor account? This action cannot be undone.',
      itemName: name,
      confirmText: 'Delete Doctor',
      type: 'danger',
      onCancel: () => setConfirmModalConfig(null),
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const response = await fetch(`${API_BASE}/api/doctors/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }
          });
          if (response.ok) {
            setDoctorsList(prev => prev.filter(d => String(d.id) !== String(id)));
            setToastConfig({ message: `${name} deleted successfully!`, type: 'success' });
          } else {
            const err = await response.json().catch(() => ({}));
            setToastConfig({ message: `Failed to delete doctor: ${err.message || 'Server error'}`, type: 'error' });
          }
        } catch (err) {
          console.error("Error deleting doctor:", err);
          setToastConfig({ message: 'Error deleting doctor. Please check connection.', type: 'error' });
        }
      }
    });
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

  const handleDeleteStaff = (id, staffName = '') => {
    const targetStaff = staffList.find(s => String(s.id) === String(id));
    const name = staffName || (targetStaff ? targetStaff.name : 'Staff Member');
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Staff Account',
      message: 'Are you sure you want to delete this staff account? This action cannot be undone.',
      itemName: name,
      confirmText: 'Delete Staff',
      type: 'danger',
      onCancel: () => setConfirmModalConfig(null),
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const response = await fetch(`${API_BASE}/api/staff/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }
          });
          if (response.ok) {
            setStaffList(prev => prev.filter(s => String(s.id) !== String(id)));
            setToastConfig({ message: `${name} deleted successfully!`, type: 'success' });
          } else {
            const err = await response.json().catch(() => ({}));
            setToastConfig({ message: `Failed to delete staff: ${err.message || 'Server error'}`, type: 'error' });
          }
        } catch (err) {
          console.error("Error deleting staff:", err);
          setToastConfig({ message: 'Error deleting staff. Please check connection.', type: 'error' });
        }
      }
    });
  };

  const handleDeletePatient = (id, patName = '') => {
    const targetPat = patients.find(p => String(p.id) === String(id));
    const name = patName || (targetPat ? `${targetPat.name} (#${targetPat.id})` : 'Patient Record');
    setConfirmModalConfig({
      isOpen: true,
      title: 'Inactivate Patient Record',
      message: 'Are you sure you want to delete / inactivate this patient record?',
      itemName: name,
      confirmText: 'Inactivate Record',
      type: 'danger',
      onCancel: () => setConfirmModalConfig(null),
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const response = await fetch(`${API_BASE}/api/patients/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }
          });
          if (response.ok) {
            setPatients(prev => prev.map(p => (String(p.id).toLowerCase() === String(id).toLowerCase() ? { ...p, status: 'Inactive', tokenNumber: null, registrationDate: null } : p)));
            setToastConfig({ message: 'Patient record inactivated successfully!', type: 'success' });
          } else {
            const err = await response.json().catch(() => ({}));
            setToastConfig({ message: `Failed to delete patient: ${err.message || 'Server error'}`, type: 'error' });
          }
        } catch (err) {
          console.error("Error deleting patient:", err);
          setToastConfig({ message: 'Error deleting patient. Please check connection.', type: 'error' });
        }
      }
    });
  };

  const handleDeleteAllPatients = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: '⚠️ Permanent Data Erasure',
      message: 'This will permanently wipe ALL patient consultation records. Type DELETE ALL to confirm:',
      confirmText: 'Delete All Patients',
      type: 'danger',
      requireTextMatch: 'DELETE ALL',
      onCancel: () => setConfirmModalConfig(null),
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const response = await fetch(`${API_BASE}/api/patients`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }
          });
          if (response.ok) {
            setPatients([]);
            setToastConfig({ message: 'All patients deleted successfully!', type: 'success' });
          } else {
            const err = await response.json().catch(() => ({}));
            setToastConfig({ message: `Failed to delete all patients: ${err.message || 'Server error'}`, type: 'error' });
          }
        } catch (err) {
          console.error("Error deleting all patients:", err);
          setToastConfig({ message: 'Error deleting all patients. Please check connection.', type: 'error' });
        }
      }
    });
  };

  // Helper to compare dates robustly across different string formats
  const isSameDayStr = (d1, d2) => {
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    const parseD = (s) => {
      if (!s) return null;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
      const parts = String(s).trim().split(/[/.-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          const tryD = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
          if (!isNaN(tryD.getTime())) return tryD;
        }
      }
      return null;
    };
    const dateA = parseD(d1);
    const dateB = parseD(d2);
    if (dateA && dateB) {
      return dateA.getFullYear() === dateB.getFullYear() &&
             dateA.getMonth() === dateB.getMonth() &&
             dateA.getDate() === dateB.getDate();
    }
    return false;
  };

  // Helper function to deduplicate and normalize token numbers per doctor per day
  const normalizeTokensForPatients = (patientList) => {
    if (!Array.isArray(patientList)) return patientList;
    const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

    // Group active patients by doctor and registration day
    const docDayGroups = {};
    patientList.forEach(p => {
      if (p.status === 'Inactive' || !p.assignedDoctorId || !p.registrationDate) return;
      const docId = parseInt(p.assignedDoctorId);

      const dateObj = new Date(p.registrationDate);
      if (isNaN(dateObj.getTime())) return;

      const dateKey = `${docId}_${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
      if (!docDayGroups[dateKey]) docDayGroups[dateKey] = [];
      docDayGroups[dateKey].push(p);
    });

    const updatedPatients = [...patientList];

    Object.values(docDayGroups).forEach(group => {
      // Sort group by patient numerical ID to keep consistent registration order
      group.sort((a, b) => {
        const numA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
        const numB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      // Re-assign unique sequential 1, 2, 3... tokens
      group.forEach((p, index) => {
        const expectedToken = index + 1;
        const targetIndex = updatedPatients.findIndex(x => x.id === p.id);
        if (targetIndex !== -1 && updatedPatients[targetIndex].tokenNumber !== expectedToken) {
          updatedPatients[targetIndex] = { ...updatedPatients[targetIndex], tokenNumber: expectedToken };
        }
      });
    });

    return updatedPatients;
  };

  // Receptionist Actions
  const handleRegisterPatient = async (newPatientData) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const docId = parseInt(newPatientData.assignedDoctorId);
      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

      // Filter active patients assigned to this doctor REGISTERED TODAY
      const activeForDocToday = patients.filter(p =>
        parseInt(p.assignedDoctorId) === docId &&
        p.status !== 'Inactive' &&
        isSameDayStr(p.registrationDate, todayStr)
      );

      const nextToken = activeForDocToday.length > 0
        ? Math.max(...activeForDocToday.map(p => parseInt(p.tokenNumber) || 0)) + 1
        : 1;

      const patientWithToken = {
        ...newPatientData,
        tokenNumber: nextToken,
        registrationDate: todayStr
      };

      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientWithToken),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const newPatient = await response.json();
        setPatients(prev => normalizeTokensForPatients([...prev, newPatient]));
        return newPatient;
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.message || `Server responded with status ${response.status}`;
        console.error("Error registering patient:", msg);
        throw new Error(msg);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error registering patient:", err);
      if (err.name === 'AbortError') {
        throw new Error("Registration timed out after 12s. Please check server/internet connection and try again.");
      }
      throw err;
    }
  };

  const handleReRegisterPatient = async (patientId, doctorId, vitalsData = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) throw new Error("Patient record not found.");

      const doctors = doctorsList;
      let updatedHistory = patient.history || [];

      if (patient.diagnosis || (patient.prescription && patient.prescription.length > 0) || patient.prescriptionImg) {
        const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
        const originalDate = patient.consultationDate || patient.registrationDate || (new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        const archiveEntry = {
          visitId: Date.now(),
          date: originalDate,
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

      // Filter active patients assigned to this doctor REGISTERED TODAY
      const activeForDocToday = patients.filter(p =>
        parseInt(p.assignedDoctorId) === docIdInt &&
        p.status !== 'Inactive' &&
        isSameDayStr(p.registrationDate, todayStr)
      );

      const nextToken = activeForDocToday.length > 0
        ? Math.max(...activeForDocToday.map(p => parseInt(p.tokenNumber) || 0)) + 1
        : 1;

      const prevDocObj = doctors.find(d => parseInt(d.id) === parseInt(patient.assignedDoctorId));
      const isDoctorChanged = prevDocObj && parseInt(prevDocObj.id) !== docIdInt;
      const prevDocName = isDoctorChanged ? prevDocObj.name : (patient.previousDoctor || null);

      const updatedPatientData = {
        ...patient,
        assignedDoctorId: docIdInt,
        previousDoctor: prevDocName,
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

      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatientData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => normalizeTokensForPatients(prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p)));
        return updatedPatient;
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.message || `Server responded with status ${response.status}`;
        console.error("Error re-registering patient:", msg);
        throw new Error(msg);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error re-registering patient:", err);
      if (err.name === 'AbortError') {
        throw new Error("Re-registration timed out after 12s. Please check server/internet connection and try again.");
      }
      throw err;
    }
  };

  const handleUpdatePaymentStatus = async (patientId, newStatus, paidAmount = 0, feeBreakdown = '') => {
    try {
      const patient = patients.find(p => isSameId(p.id, patientId));
      if (!patient) return;
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const updatedData = {
        paymentStatus: newStatus,
        status: (newStatus && newStatus.startsWith('Paid')) && patient.status === 'Completed' ? 'Completed' : patient.status,
        paidAmount: parseFloat(paidAmount) || 0,
        feeBreakdown: feeBreakdown
      };
      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  const handleUpdatePatientStatus = async (patientId, newStatus) => {
    try {
      const patient = patients.find(p => isSameId(p.id, patientId));
      if (!patient) return;
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => normalizeTokensForPatients(prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p)));
      }
    } catch (err) {
      console.error("Error updating patient status:", err);
    }
  };

  // Doctor Actions
  const handleSubmitPrescription = async (patientId, data) => {
    try {
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const consultationDateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const updatedData = {
        status: 'At Pharmacy',
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        prescriptionImg: data.prescriptionImg,
        consultationDate: consultationDateStr,
        wardBedId: data.wardBedId !== undefined ? data.wardBedId : null,
        bedAdmissionPending: data.bedAdmissionPending !== undefined ? data.bedAdmissionPending : 0
      };

      // ⚡ Instant Optimistic Update
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? { ...p, ...updatedData } : p));

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
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
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const updatedData = {
        status: 'Completed',
        followUpNotes: data?.followUpNotes || '',
        nextVisitDate: data?.nextVisitDate || ''
      };

      // ⚡ Instant Optimistic Update
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? { ...p, ...updatedData } : p));

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));

        // Automatically update any pending injections for this patient to 'Administered' (Given ✅)
        const dateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        try {
          await fetch(`${API_BASE}/api/injections/patient/${patientId}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'Administered',
              dateGiven: dateStr,
              administeredBy: 'Doctor / Nurse'
            })
          });
        } catch (injErr) {
          console.error("Error completing patient injections:", injErr);
        }
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

  const handleReassignDoctor = async (patientId, newDoctorId, reassignInfo = {}) => {
    try {
      const patient = patients.find(p => p && isSameId(p.id, patientId));
      if (!patient) return false;

      let prevDoctorName = 'Doctor';
      if (patient && patient.assignedDoctorId) {
        const prevDoc = doctorsList.find(d => isSameId(d.id, patient.assignedDoctorId));
        if (prevDoc) prevDoctorName = prevDoc.name;
      } else if (reassignInfo.changedBy) {
        prevDoctorName = reassignInfo.changedBy;
      }

      const newDoc = doctorsList.find(d => isSameId(d.id, newDoctorId));
      const newDoctorName = newDoc ? newDoc.name : 'Selected Doctor';

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      const fullDateTime = `${dateStr}, ${timeStr}`;

      const pendingRequestData = {
        fromDoctorId: patient.assignedDoctorId,
        fromDoctorName: prevDoctorName,
        targetDoctorId: parseInt(newDoctorId),
        targetDoctorName: newDoctorName,
        reason: reassignInfo.reason || 'Reassigned from consultation desk',
        requestedAt: fullDateTime
      };

      const historyLog = {
        id: `reassign_req_${Date.now()}`,
        type: 'Doctor Reassignment Requested',
        desk: 'Doctor Reassignment',
        previousDoctor: prevDoctorName,
        newDoctor: newDoctorName,
        dateTime: fullDateTime,
        timestamp: fullDateTime,
        changedBy: reassignInfo.changedBy || user?.name || prevDoctorName,
        reason: reassignInfo.reason || 'Reassigned from consultation desk',
        notes: `Reassignment requested from ${prevDoctorName} to ${newDoctorName} (Pending Doctor Approval)`
      };

      let existingLogs = [];
      if (patient && patient.trackingHistory) {
        if (Array.isArray(patient.trackingHistory)) {
          existingLogs = patient.trackingHistory;
        } else if (typeof patient.trackingHistory === 'string') {
          try { existingLogs = JSON.parse(patient.trackingHistory); } catch (e) {}
        }
      }

      const updatedHistory = [historyLog, ...existingLogs];
      const targetApiId = String(patient.id || patientId).replace(/#/g, '').trim();

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingReassignment: pendingRequestData,
          reassignmentDeclined: null,
          trackingHistory: updatedHistory
        })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => (p && isSameId(p.id, patientId)) ? updatedPatient : p));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error requesting reassign doctor:", err);
      return false;
    }
  };

  const handleAcceptReassignment = async (patientId) => {
    try {
      const patient = patients.find(p => p && isSameId(p.id, patientId));
      if (!patient || !patient.pendingReassignment) return false;

      const req = patient.pendingReassignment;
      const targetDocId = req.targetDoctorId;
      const targetDocName = req.targetDoctorName;
      const fromDocName = req.fromDoctorName;

      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

      // Calculate token for new doctor
      const activeForNewDoc = patients.filter(p =>
        isSameId(p.assignedDoctorId, targetDocId) &&
        p.status !== 'Inactive' &&
        isSameDayStr(p.registrationDate, todayStr)
      );

      const nextToken = activeForNewDoc.length > 0
        ? Math.max(...activeForNewDoc.map(p => parseInt(p.tokenNumber) || 0)) + 1
        : 1;

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      const fullDateTime = `${dateStr}, ${timeStr}`;

      const historyLog = {
        id: `reassign_accept_${Date.now()}`,
        type: 'Doctor Reassignment Accepted',
        desk: 'Doctor Reassignment',
        previousDoctor: fromDocName,
        newDoctor: targetDocName,
        dateTime: fullDateTime,
        timestamp: fullDateTime,
        changedBy: targetDocName,
        reason: req.reason,
        notes: `Reassignment accepted by ${targetDocName}`
      };

      let existingLogs = [];
      if (patient && patient.trackingHistory) {
        if (Array.isArray(patient.trackingHistory)) {
          existingLogs = patient.trackingHistory;
        } else if (typeof patient.trackingHistory === 'string') {
          try { existingLogs = JSON.parse(patient.trackingHistory); } catch (e) {}
        }
      }

      const updatedHistory = [historyLog, ...existingLogs];
      const targetApiId = String(patient.id || patientId).replace(/#/g, '').trim();

      const isReviewing = patient.status === 'Reviewing';
      const targetStatus = isReviewing ? 'Reviewing' : 'In Queue';

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedDoctorId: parseInt(targetDocId),
          previousDoctor: fromDocName,
          pendingReassignment: null,
          status: targetStatus,
          tokenNumber: isReviewing ? (patient.tokenNumber || nextToken) : nextToken,
          registrationDate: todayStr,
          trackingHistory: updatedHistory
        })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => normalizeTokensForPatients(prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p)));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error accepting reassignment:", err);
      return false;
    }
  };

  const handleDeclineReassignment = async (patientId) => {
    try {
      const patient = patients.find(p => p && isSameId(p.id, patientId));
      if (!patient || !patient.pendingReassignment) return false;

      const req = patient.pendingReassignment;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      const fullDateTime = `${dateStr}, ${timeStr}`;

      const historyLog = {
        id: `reassign_decline_${Date.now()}`,
        type: 'Doctor Reassignment Declined',
        desk: 'Doctor Reassignment',
        dateTime: fullDateTime,
        timestamp: fullDateTime,
        changedBy: req.targetDoctorName,
        notes: `Reassignment request to ${req.targetDoctorName} was declined by ${req.targetDoctorName}`
      };

      let existingLogs = [];
      if (patient && patient.trackingHistory) {
        if (Array.isArray(patient.trackingHistory)) {
          existingLogs = patient.trackingHistory;
        } else if (typeof patient.trackingHistory === 'string') {
          try { existingLogs = JSON.parse(patient.trackingHistory); } catch (e) {}
        }
      }

      const updatedHistory = [historyLog, ...existingLogs];
      const targetApiId = String(patient.id || patientId).replace(/#/g, '').trim();

      const declData = {
        targetDoctorId: req.targetDoctorId,
        targetDoctorName: req.targetDoctorName,
        fromDoctorName: req.fromDoctorName,
        declinedAt: fullDateTime
      };

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingReassignment: null,
          reassignmentDeclined: declData,
          trackingHistory: updatedHistory
        })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error declining reassignment:", err);
      return false;
    }
  };

  // Pharmacy Actions
  const handleIssueMedication = async (patientId, issuedString, injectionData = null) => {
    try {
      const cleanId = String(patientId || '').replace(/#/g, '').trim();
      const updatedData = {
        status: 'Reviewing',
        issuedMedication: issuedString
      };

      // ⚡ Instant optimistic update
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? { ...p, ...updatedData } : p));

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
      }

      if (injectionData) {
        const list = Array.isArray(injectionData) ? injectionData : [injectionData];
        for (const inj of list) {
          if (inj && (inj.name || inj.injectionName)) {
            const freq = inj.frequency || (inj.dosage?.toLowerCase().includes('stat') ? 'STAT (Single / Immediate)' : 'NORMAL');
            const isStatDose = inj.isStat || (freq && freq.includes('STAT')) || inj.dosage?.toLowerCase().includes('stat') ? 1 : 0;
            fetch(`${API_BASE}/api/injections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: cleanId,
                injectionName: inj.name || inj.injectionName,
                dosage: inj.dosage || '',
                route: inj.route || 'IM',
                frequency: freq,
                isStat: isStatDose,
                status: 'Pending',
                dateGiven: ''
              })
            }).catch(err => console.error("Error saving injection:", err));
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
      const patient = patients.find(p => isSameId(p.id, patientId));
      if (!patient) return;

      // Bed conflict check ONLY against patients who are ACTUALLY ADMITTED (not pending requests)
      const occupiedPatient = patients.find(p =>
        p.wardBedId === bedId &&
        !isSameId(p.id, patientId) &&
        p.status !== 'Inactive' &&
        !p.bedAdmissionPending &&
        p.bedAdmissionPending != 1
      );

      if (occupiedPatient) {
        const docName = (doctorsList || []).find(d => isSameId(d.id, occupiedPatient.assignedDoctorId))?.name || occupiedPatient.assignedDoctorName || occupiedPatient.doctorName || 'another Doctor';
        setToastConfig({
          message: `⚠️ Bed Conflict Warning! Bed ${bedId} is already occupied by patient ${occupiedPatient.name} (#${occupiedPatient.id}) under ${docName}. Please choose another bed.`,
          type: 'danger'
        });
        return;
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      const fullDateTime = `${dateStr}, ${timeStr}`;

      const roomNum = bedId ? String(bedId).slice(0, 3) : '101';
      const bedLetter = bedId ? String(bedId).slice(3) : 'A';
      const bedLabel = `Room ${roomNum} - Bed ${bedLetter}`;

      let currentWardHistory = [];
      if (patient.wardHistory) {
        if (Array.isArray(patient.wardHistory)) {
          currentWardHistory = [...patient.wardHistory];
        } else if (typeof patient.wardHistory === 'string') {
          try { currentWardHistory = JSON.parse(patient.wardHistory); } catch (e) {}
        }
      }

      // Check if there is already an active stay
      const openStayIndex = currentWardHistory.findIndex(s => s && (s.status === 'Admitted' || !s.dischargeDate));

      const newStayEntry = {
        id: `ward_${Date.now()}`,
        bedId: bedId,
        room: roomNum,
        bedName: `Bed ${bedLetter}`,
        bedLabel: bedLabel,
        admitDate: dateStr,
        admitTime: timeStr,
        admitDateTime: fullDateTime,
        admitTimestamp: now.getTime(),
        admittedBy: user?.name || 'Ward Staff',
        dischargeDate: null,
        dischargeTime: null,
        dischargeDateTime: null,
        dischargeTimestamp: null,
        dischargedBy: null,
        status: 'Admitted',
        stayDuration: 'Currently Admitted (Day 1)',
        totalDays: 1,
        notes: `Admitted to ${bedLabel}`
      };

      if (openStayIndex >= 0) {
        currentWardHistory[openStayIndex] = {
          ...currentWardHistory[openStayIndex],
          bedId: bedId,
          room: roomNum,
          bedName: `Bed ${bedLetter}`,
          bedLabel: bedLabel,
          status: 'Admitted'
        };
      } else {
        currentWardHistory = [newStayEntry, ...currentWardHistory];
      }

      const historyLog = {
        id: `ward_admit_${Date.now()}`,
        type: 'Ward Admission',
        desk: 'Ward Desk',
        dateTime: fullDateTime,
        timestamp: fullDateTime,
        changedBy: user?.name || 'Ward Staff',
        notes: `Patient admitted to ${bedLabel} (#${bedId})`
      };

      let existingLogs = [];
      if (patient.trackingHistory) {
        if (Array.isArray(patient.trackingHistory)) {
          existingLogs = patient.trackingHistory;
        } else if (typeof patient.trackingHistory === 'string') {
          try { existingLogs = JSON.parse(patient.trackingHistory); } catch (e) {}
        }
      }
      const updatedHistory = [historyLog, ...existingLogs];

      const cleanId = String(patientId || '').replace(/#/g, '').trim();

      // Instant optimistic update: mark accepted patient as admitted with bedAdmissionPending = 0
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? {
        ...p,
        wardBedId: bedId,
        bedAdmissionPending: 0,
        wardHistory: currentWardHistory,
        trackingHistory: updatedHistory
      } : p));

      setToastConfig({
        message: `✅ Patient ${patient.name} admitted to ${bedLabel} successfully!`,
        type: 'success'
      });

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardBedId: bedId,
          bedAdmissionPending: 0,
          wardHistory: currentWardHistory,
          trackingHistory: updatedHistory
        })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error assigning bed:", err);
    }
  };

  const handleDischargePatient = async (patientId) => {
    try {
      const patient = patients.find(p => isSameId(p.id, patientId));
      if (!patient) return;

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      const fullDateTime = `${dateStr}, ${timeStr}`;

      let currentWardHistory = [];
      if (patient.wardHistory) {
        if (Array.isArray(patient.wardHistory)) {
          currentWardHistory = [...patient.wardHistory];
        } else if (typeof patient.wardHistory === 'string') {
          try { currentWardHistory = JSON.parse(patient.wardHistory); } catch (e) {}
        }
      }

      const activeBedId = patient.wardBedId;
      const roomNum = activeBedId ? String(activeBedId).slice(0, 3) : '101';
      const bedLetter = activeBedId ? String(activeBedId).slice(3) : 'A';
      const bedLabel = `Room ${roomNum} - Bed ${bedLetter}`;

      const openStayIndex = currentWardHistory.findIndex(s => s && (s.status === 'Admitted' || !s.dischargeDate));

      let stayDurationText = '1 Day';
      let calculatedTotalDays = 1;

      if (openStayIndex >= 0) {
        const openStay = currentWardHistory[openStayIndex];
        const admitTimestamp = openStay.admitTimestamp || (openStay.admitDateTime ? new Date(openStay.admitDateTime).getTime() : (now.getTime() - 86400000));
        const diffMs = Math.max(0, now.getTime() - admitTimestamp);
        const totalMinutes = Math.floor(diffMs / 60000);
        const totalHours = Math.floor(diffMs / 3600000);
        const days = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;
        const remainingMinutes = totalMinutes % 60;

        if (days >= 1) {
          stayDurationText = remainingHours > 0 ? `${days} Day${days > 1 ? 's' : ''}, ${remainingHours} Hr${remainingHours > 1 ? 's' : ''}` : `${days} Day${days > 1 ? 's' : ''}`;
          calculatedTotalDays = days;
        } else if (totalHours >= 1) {
          stayDurationText = remainingMinutes > 0 ? `${totalHours} Hr${totalHours > 1 ? 's' : ''}, ${remainingMinutes} Min${remainingMinutes > 1 ? 's' : ''}` : `${totalHours} Hr${totalHours > 1 ? 's' : ''}`;
          calculatedTotalDays = 0;
        } else {
          const minutes = Math.max(1, totalMinutes);
          stayDurationText = `${minutes} Min${minutes > 1 ? 's' : ''}`;
          calculatedTotalDays = 0;
        }

        currentWardHistory[openStayIndex] = {
          ...openStay,
          dischargeDate: dateStr,
          dischargeTime: timeStr,
          dischargeDateTime: fullDateTime,
          dischargeTimestamp: now.getTime(),
          dischargedBy: user?.name || 'Ward Staff',
          status: 'Discharged',
          stayDuration: stayDurationText,
          totalDays: calculatedTotalDays,
          notes: `Discharged from ${openStay.bedLabel || bedLabel} after ${stayDurationText}`
        };
      } else {
        // If no prior admission entry exists, log the real discharge event
        currentWardHistory = [{
          id: `ward_${Date.now()}`,
          bedId: activeBedId || '101A',
          room: roomNum,
          bedName: `Bed ${bedLetter}`,
          bedLabel: bedLabel,
          admitDate: dateStr,
          admitTime: timeStr,
          admitDateTime: fullDateTime,
          admitTimestamp: now.getTime(),
          admittedBy: 'Ward Staff',
          dischargeDate: dateStr,
          dischargeTime: timeStr,
          dischargeDateTime: fullDateTime,
          dischargeTimestamp: now.getTime(),
          dischargedBy: user?.name || 'Ward Staff',
          status: 'Discharged',
          stayDuration: 'Discharged',
          totalDays: 0,
          notes: `Discharged from ${bedLabel}`
        }, ...currentWardHistory];
      }

      const historyLog = {
        id: `ward_discharge_${Date.now()}`,
        type: 'Ward Discharge',
        desk: 'Ward Desk',
        dateTime: fullDateTime,
        timestamp: fullDateTime,
        changedBy: user?.name || 'Ward Staff',
        notes: `Patient discharged from ${bedLabel} (#${activeBedId || '--'}). Stay duration: ${stayDurationText}`
      };

      let existingLogs = [];
      if (patient.trackingHistory) {
        if (Array.isArray(patient.trackingHistory)) {
          existingLogs = patient.trackingHistory;
        } else if (typeof patient.trackingHistory === 'string') {
          try { existingLogs = JSON.parse(patient.trackingHistory); } catch (e) {}
        }
      }
      const updatedHistory = [historyLog, ...existingLogs];

      const cleanId = String(patientId || '').replace(/#/g, '').trim();

      // Instant optimistic update
      setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? {
        ...p,
        wardBedId: null,
        bedAdmissionPending: 0,
        wardHistory: currentWardHistory,
        trackingHistory: updatedHistory
      } : p));

      const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardBedId: null,
          bedAdmissionPending: 0,
          wardHistory: currentWardHistory,
          trackingHistory: updatedHistory
        })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => isSameId(p.id, patientId) ? updatedPatient : p));
      }
    } catch (err) {
      console.error("Error discharging patient:", err);
    }
  };

  // Printing & Email simulation helper functions
  const handlePrintPrescription = () => {
    printPrescriptionDirectly('printable-rx');
  };

  const handleEmailPrescription = async (sharePatient, customEmail = null) => {
    if (!sharePatient) return { success: false, message: 'No patient selected' };

    // Check sharePatient or lookup from global patients list
    const foundPat = (patients || []).find(p => isSameId(p.id, sharePatient.id));
    let targetEmail = (customEmail || sharePatient.email || (foundPat && foundPat.email) || '').trim();

    if (!targetEmail) {
      return { success: false, needsEmail: true, message: 'Recipient email address is required.' };
    }

    targetEmail = targetEmail.toLowerCase();

    // Automatically persist email into patient record if patient had none
    if (!foundPat?.email || foundPat.email !== targetEmail) {
      try {
        const cleanId = String(sharePatient.id || '').replace(/#/g, '').trim();
        await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail })
        });
        setPatients(prev => prev.map(p => isSameId(p.id, sharePatient.id) ? { ...p, email: targetEmail } : p));
      } catch (e) {}
    }

    try {
      const fullPatient = {
        ...(foundPat || {}),
        ...sharePatient,
        email: targetEmail
      };

      // 1. Capture exact high-res on-screen DOM prescription image via html2canvas
      let prescriptionSnapshot = null;
      try {
        prescriptionSnapshot = await capturePrescriptionDOMImage();
      } catch (e) {
        console.warn('Could not capture direct DOM prescription:', e);
      }

      // 2. Fallback to composite generator if DOM element is not mounted
      if (!prescriptionSnapshot) {
        try {
          prescriptionSnapshot = await generateFullPrescriptionImage(fullPatient);
        } catch (e) {
          console.warn('Could not generate canvas snapshot:', e);
        }
      }

      const response = await fetch(`${API_BASE}/api/send-prescription-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: sharePatient.id,
          patientEmail: targetEmail,
          patientName: sharePatient.name,
          patient: fullPatient,
          prescriptionSnapshot: prescriptionSnapshot || fullPatient.prescriptionImg
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        if (resData.isSandbox) {
          // Open Web Gmail composer so the email can be dispatched for real with 1 click
          const subject = `Digital Prescription - ${sharePatient.name} (#${sharePatient.id}) | Vijaya's Health Care`;
          let medListText = '';
          if (Array.isArray(sharePatient.prescription) && sharePatient.prescription.length > 0) {
            medListText = sharePatient.prescription.map((m, i) => `${i + 1}. ${m.name || 'Medicine'} | Dose: ${m.dosage || '-'} | Duration: ${m.duration || 1} Days`).join('\n');
          } else {
            medListText = sharePatient.diagnosis || 'Prescription Details Attached';
          }
          const bodyText = `Dear ${sharePatient.name},\n\nHere is your official digital prescription from Vijaya's Health Care.\n\nPATIENT DETAILS:\n- Name: ${sharePatient.name}\n- Patient ID: #${sharePatient.id}\n- Age / Gender: ${sharePatient.age || '-'} Yrs / ${sharePatient.gender || '-'}\n- Diagnosis: ${sharePatient.diagnosis || 'General Consultation'}\n\nPRESCRIBED MEDICINES:\n${medListText}\n\nINSTRUCTIONS:\nPlease take medications strictly as advised by your doctor.\n\nVijaya's Health Care\nPhone: 04564-271393 | Mobile: 94890 48507\nEmail: vijayashealthcare@gmail.com`;

          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
          window.open(gmailUrl, '_blank');
          return { success: true, email: targetEmail, isSandbox: true, message: `Opened Gmail to send prescription to ${targetEmail}!` };
        }
        return { success: true, email: targetEmail, message: `Email sent successfully to ${targetEmail}` };
      } else {
        return { success: false, message: resData.message || `Failed to send email to ${targetEmail}.` };
      }
    } catch (err) {
      console.error("Error sending prescription email:", err);
      return { success: false, message: 'Connection error while dispatching email.' };
    }
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
            onUpdatePatientStatus={handleUpdatePatientStatus}
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
            onUpdatePatientStatus={handleUpdatePatientStatus}
            onPrintPrescription={handlePrintPrescription}
            onEmailPrescription={handleEmailPrescription}
            onAdmitToWard={handleOpenWardAdmit}
            onDischargePatient={handleDischargePatient}
            onReassignDoctor={handleReassignDoctor}
            onAcceptReassignment={handleAcceptReassignment}
            onDeclineReassignment={handleDeclineReassignment}
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
          <InjectionRoom patients={patients} currentUser={user} />
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
          <UtilityLogs userRole={user?.role} />
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
          <img 
            src="/vijayas-logo.png" 
            alt="Vijaya's Health Care Logo" 
            className="mobile-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'flex';
              }
            }}
          />
          <div className="mobile-logo-fallback" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-icon" style={{ padding: '0.35rem', boxShadow: 'none' }}>
              <Stethoscope size={18} />
            </div>
            <span className="logo-text-mobile">Vijaya's <span className="logo-sub">Health Care</span></span>
          </div>
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
          <img 
            src="/vijayas-logo.png" 
            alt="Vijaya's Health Care Logo" 
            className="sidebar-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'flex';
              }
            }}
          />
          <div className="logo-text-fallback" style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-icon">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="logo-text">Vijaya's <span className="logo-sub">Health Care</span></h1>
            </div>
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
            <>
              <div
                className={`nav-item ${activeView === 'receptionist' ? 'active' : ''}`}
                onClick={() => { setCurrentStaffView('receptionist'); setIsSidebarOpen(false); }}
              >
                <Users size={18} />
                <span>Receptionist Module</span>
              </div>
              <div
                className={`nav-item ${activeView === 'utility' ? 'active' : ''}`}
                onClick={() => { setCurrentStaffView('utility'); setIsSidebarOpen(false); }}
              >
                <ClipboardList size={18} />
                <span>Housekeeping & Plants Checklist</span>
              </div>
            </>
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
            <div className="user-badge" style={{ position: 'relative' }}>
              {(() => {
                const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

                // 1. Patients waiting in Queue today
                const queueWaitingCount = patients.filter(p =>
                  p.status !== 'Inactive' &&
                  (p.status === 'In Queue' || p.status === 'Registered' || !p.status) &&
                  isSameDayStr(p.registrationDate, todayStr)
                ).length;

                // 2. Patients in doctor Review today
                const reviewingCount = patients.filter(p =>
                  p.status !== 'Inactive' &&
                  (p.status === 'Reviewing' || (p.status || '').toLowerCase() === 'review') &&
                  isSameDayStr(p.registrationDate, todayStr)
                ).length;

                // 3. Pending pharmacy medication dispatch
                const pharmacyPendingCount = patients.filter(p =>
                  p.status !== 'Inactive' &&
                  (p.status === 'At Pharmacy' || p.status === 'Pending Pharmacy' || p.pharmacyStatus === 'Pending')
                ).length;

                // 4. Pending Bed Admission requests
                const wardPendingCount = patients.filter(p =>
                  p.status !== 'Inactive' &&
                  (p.bedAdmissionPending == 1 || p.bedAdmissionPending === '1' || p.bedAdmissionPending === true)
                ).length;

                // 5. Pending Lab Test Investigations
                const labPendingCount = (labLogsList || []).filter(l =>
                  l.status === 'Ordered' || l.status === 'Sample Collected' || l.status === 'Processing'
                ).length;

                // 6. Pending Injection Desk Administrations
                const injectionPendingCount = (injectionsList || []).filter(i =>
                  i.status === 'Pending'
                ).length;

                // 7. Pending Doctor Reassignments
                const reassignPendingCount = patients.filter(p =>
                  p.status !== 'Inactive' &&
                  Boolean(p.pendingReassignment)
                ).length;

                const totalAlerts = queueWaitingCount + reviewingCount + pharmacyPendingCount + wardPendingCount + labPendingCount + injectionPendingCount + reassignPendingCount;
                const hasActiveAlerts = totalAlerts > 0;

                const handleNotifyNav = (viewName) => {
                  if (user?.role === 'admin') {
                    setAdminActiveView(viewName);
                  } else {
                    setCurrentStaffView(viewName);
                  }
                  setShowNotifications(false);
                  setIsSidebarOpen(false);
                };

                return (
                  <>
                    <button
                      className="header-btn"
                      onClick={() => setShowNotifications(!showNotifications)}
                      title="Notifications Center"
                      style={{ position: 'relative' }}
                    >
                      <Bell size={16} />
                      {hasActiveAlerts && (
                        <span style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          background: '#ef4444',
                          color: '#ffffff',
                          borderRadius: '10px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 3px',
                          border: '2px solid var(--bg-card)',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                        }}>
                          {totalAlerts}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '125%',
                        width: 'min(340px, 90vw)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '1rem',
                        zIndex: 9999,
                        animation: 'fadeIn 0.15s ease',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Live Notifications</span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: hasActiveAlerts ? 'var(--primary)' : 'var(--success)',
                            fontWeight: 700,
                            background: hasActiveAlerts ? 'rgba(21, 115, 136, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px'
                          }}>
                            ● {hasActiveAlerts ? `${totalAlerts} Active` : 'All Clear'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                          {reassignPendingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav(user?.role === 'doctor' ? 'doctor' : 'receptionist')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view doctor reassignment requests"
                            >
                              <UserPlus size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                              <div><strong>{reassignPendingCount} Reassignment</strong> requests pending approval</div>
                            </div>
                          )}

                          {queueWaitingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav('receptionist')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Receptionist Queue"
                            >
                              <Activity size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
                              <div><strong>{queueWaitingCount} Patients</strong> waiting in Queue</div>
                            </div>
                          )}

                          {wardPendingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav('ward')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Ward Bed Admission requests"
                            >
                              <Bed size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
                              <div><strong>{wardPendingCount} Bed Admission</strong> waiting requests</div>
                            </div>
                          )}

                          {labPendingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav('lab')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(6, 182, 212, 0.1)',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Laboratory Investigation Desk"
                            >
                              <FlaskConical size={15} style={{ color: '#06b6d4', flexShrink: 0 }} />
                              <div><strong>{labPendingCount} Lab Tests</strong> waiting for investigation</div>
                            </div>
                          )}

                          {injectionPendingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav('injection')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Injection Room"
                            >
                              <Syringe size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                              <div><strong>{injectionPendingCount} Injections</strong> waiting at Injection Desk</div>
                            </div>
                          )}

                          {reviewingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav(user?.role === 'doctor' ? 'doctor' : 'receptionist')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Review queue"
                            >
                              <Users size={15} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                              <div><strong>{reviewingCount} Patients</strong> waiting for Doctor Review</div>
                            </div>
                          )}

                          {pharmacyPendingCount > 0 && (
                            <div
                              onClick={() => handleNotifyNav('pharmacy')}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              title="Click to view Pharmacy Desk"
                            >
                              <Pill size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                              <div><strong>{pharmacyPendingCount} Prescriptions</strong> pending dispatch</div>
                            </div>
                          )}

                          {!hasActiveAlerts && (
                            <div style={{
                              textAlign: 'center',
                              padding: '1.25rem 0.5rem',
                              color: 'var(--text-secondary)',
                              fontSize: '0.82rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}>
                              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                              <div>No pending alerts. All queues up to date!</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </header>

        {renderDashboard()}

        <footer className="global-app-footer">
          Developed by <span className="footer-brand">RPN Tech World</span>
        </footer>
      </main>

      {/* ===== GLOBAL WARD ADMIT MODAL ===== */}
      {wardAdmitPatient && (() => {
        const occupiedBedMap = new Map();
        patients
          .filter(p => p.wardBedId && !isSameId(p.id, wardAdmitPatient.id) && p.status !== 'Inactive')
          .forEach(p => {
            occupiedBedMap.set(p.wardBedId, p);
          });

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
                background: 'var(--bg-card, #111c30)',
                color: 'var(--text-primary)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column',
                border: '1px solid var(--border)'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
                borderRadius: '18px 18px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛏️ Admit to Ward Room
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
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
              <div style={{ padding: '1.5rem', background: 'var(--bg-dark, #0b1329)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', marginTop: 0 }}>
                  Select an available bed below to admit this patient directly.
                </p>

                {/* Bed Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {BEDS_CONFIG.map(bed => {
                    const occupant = occupiedBedMap.get(bed.id);
                    const isOccupied = Boolean(occupant);
                    const isSelected = wardAdmitBedId === bed.id;
                    const occupantDocName = isOccupied
                      ? ((doctorsList || []).find(d => isSameId(d.id, occupant.assignedDoctorId))?.name || occupant.assignedDoctorName || occupant.doctorName || 'Dr. Assigned')
                      : '';

                    return (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={() => {
                          if (isOccupied) {
                            setToastConfig({
                              message: `⚠️ Bed Conflict Warning! Bed ${bed.id} (Room ${bed.room} - ${bed.name}) is already occupied by patient ${occupant.name} (#${occupant.id}) under ${occupantDocName}. Please select another available bed.`,
                              type: 'danger'
                            });
                          } else {
                            setWardAdmitBedId(bed.id);
                          }
                        }}
                        style={{
                          padding: '1rem',
                          borderRadius: '12px',
                          border: isSelected
                            ? '2.5px solid var(--primary)'
                            : isOccupied ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1.5px solid var(--border)',
                          background: isSelected
                            ? 'rgba(56, 189, 248, 0.15)'
                            : isOccupied ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card, #111c30)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: isOccupied ? '#ef4444' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: isOccupied ? 700 : 500 }}>
                          Room {bed.room}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isOccupied ? '#ef4444' : isSelected ? 'var(--primary)' : 'var(--text-primary)', marginTop: '0.15rem' }}>
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
                          {isOccupied ? `Occupied: ${occupant.name}` : 'Available'}
                        </div>
                        {isOccupied && (
                          <div style={{ fontSize: '0.68rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🩺 {occupantDocName}
                          </div>
                        )}
                        {isSelected && (
                          <div style={{
                            position: 'absolute', top: '8px', right: '10px',
                            background: 'var(--primary)', color: '#fff',
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
                      background: themeMode === 'light'
                        ? (wardAdmitBedId ? 'linear-gradient(135deg, #0f766e, #0e7490)' : 'linear-gradient(135deg, #0f766e, #0e7490)')
                        : (wardAdmitBedId ? 'linear-gradient(135deg, #0f766e, #0e7490)' : 'var(--border)'),
                      color: themeMode === 'light'
                        ? '#ffffff'
                        : (wardAdmitBedId ? '#fff' : 'var(--text-muted)'),
                      opacity: themeMode === 'light' && !wardAdmitBedId ? 0.6 : 1,
                      border: 'none', borderRadius: '10px',
                      fontWeight: 800, fontSize: '0.95rem',
                      cursor: wardAdmitBedId ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      boxShadow: wardAdmitBedId
                        ? '0 4px 15px rgba(15,118,110,0.35)'
                        : (themeMode === 'light' ? '0 2px 8px rgba(15,118,110,0.15)' : 'none')
                    }}
                  >
                    ✅ Confirm Ward Admission
                  </button>
                  <button
                    onClick={() => setWardAdmitPatient(null)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: themeMode === 'light' ? '#ffffff' : 'transparent',
                      border: '1.5px solid var(--border)',
                      borderRadius: '10px',
                      color: themeMode === 'light' ? '#334155' : 'var(--text-secondary)',
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
                  const numOnly = rawId.replace(/\D/g, '');
                  const formattedId = numOnly ? `vh${numOnly.padStart(3, '0')}` : rawId;
                  const hashId = `#${formattedId}`;

                  const idMatch =
                    rawId.includes(q) ||
                    (numOnly && (numOnly.includes(q) || numOnly.includes(qClean))) ||
                    formattedId.includes(q) ||
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

                return matched.map(p => {
                  const numOnly = String(p.id).replace(/\D/g, '');
                  const formattedDisplayId = numOnly ? `#VH${numOnly.padStart(3, '0')}` : (String(p.id).startsWith('#') ? p.id : `#${p.id}`);

                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-card)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {p.name} <span style={{ color: 'var(--primary)', fontSize: '0.82rem', marginLeft: '0.4rem', fontWeight: 800 }}>{formattedDisplayId}</span>
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
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Confirmation Dialog Modal */}
      {confirmModalConfig && (
        <ConfirmModal {...confirmModalConfig} />
      )}

      {/* Global Custom Toast Notification */}
      {toastConfig && (
        <ToastNotification toast={toastConfig} onClose={() => setToastConfig(null)} />
      )}
    </div>
  );
}

export default App;
