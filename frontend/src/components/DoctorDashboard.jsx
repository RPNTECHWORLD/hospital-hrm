import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Clipboard, Plus, Trash2, CheckCircle2, AlertCircle, FileText, Send, Printer, Mail, History, Check, Syringe, Bed, ExternalLink, FlaskConical, Microscope } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import PrescriptionTemplate from './PrescriptionTemplate';
import ChildPrescriptionTemplate from './ChildPrescriptionTemplate';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DoctorDashboard = ({ patients, doctors = [], doctorEmail, userRole, onSubmitPrescription, onSubmitReview, onStartConsultation, onPrintPrescription, onEmailPrescription, onAdmitToWard }) => {
  const [activePatient, setActivePatient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandHistory, setExpandHistory] = useState(false);
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [isHistoryPreview, setIsHistoryPreview] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  
  // Diagnosis and Clinical states
  const [diagnosis, setDiagnosis] = useState('');
  const [complaints, setComplaints] = useState('');
  const [pastHistory, setPastHistory] = useState('');
  const [examination, setExamination] = useState('');
  const [investigation, setInvestigation] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: 10 }]);
  
  // Drawing Prescription state
  const [prescriptionMode, setPrescriptionMode] = useState('form'); // 'form' or 'drawing'
  const [canvasDataUrl, setCanvasDataUrl] = useState(null);

  // Follow-up state
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  const [patientInjections, setPatientInjections] = useState([]);
  const [patientLabLogs, setPatientLabLogs] = useState([]);
  const [previewLabImage, setPreviewLabImage] = useState(null);
  const [showAllLabLogsModal, setShowAllLabLogsModal] = useState(false);
  const [orderTestName, setOrderTestName] = useState('');
  const [recommendAdmission, setRecommendAdmission] = useState(false);
  const [targetBedId, setTargetBedId] = useState('');
  const [sharePatient, setSharePatient] = useState(null);

  useEffect(() => {
    if (activePatient) {
      setRecommendAdmission(false);
      setTargetBedId('');
      const fetchPatientInjections = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/injections`);
          if (res.ok) {
            const data = await res.json();
            const patInjs = data.filter(inj => String(inj.patientId).toUpperCase() === String(activePatient.id).toUpperCase());
            setPatientInjections(patInjs);
          }
        } catch (err) {
          console.error("Error fetching patient injections:", err);
        }
      };
      const fetchPatientLabLogs = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/lab`);
          if (res.ok) {
            const data = await res.json();
            const patLabs = data.filter(log => String(log.patientId).toUpperCase() === String(activePatient.id).toUpperCase());
            setPatientLabLogs(patLabs);
          }
        } catch (err) {
          console.error("Error fetching patient lab logs:", err);
        }
      };
      fetchPatientInjections();
      fetchPatientLabLogs();
    } else {
      setPatientInjections([]);
      setPatientLabLogs([]);
    }
  }, [activePatient]);
  // Keyboard Shortcuts (Ctrl+S = Send Prescription, Ctrl+P = Print)
  useEffect(() => {
    const handleDoctorKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (activePatient) {
          e.preventDefault();
          handlePrescriptionSubmit(e);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (sharePatient) {
          e.preventDefault();
          onPrintPrescription();
        }
      }
    };
    window.addEventListener('keydown', handleDoctorKeys);
    return () => window.removeEventListener('keydown', handleDoctorKeys);
  }, [activePatient, sharePatient, diagnosis, medicines, canvasDataUrl]);

  const handleOrderLabTest = async () => {
    if (!orderTestName.trim()) {
      showToast('Please type a test name first!', 'danger');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activePatient.id,
          testName: orderTestName.trim(),
          dateOrdered: new Date().toLocaleString(),
          status: 'Ordered',
          reportNotes: ''
        })
      });

      if (response.ok) {
        showToast(`Lab Test "${orderTestName}" ordered successfully!`, 'success');
        setOrderTestName('');
        const res = await fetch(`${API_BASE}/api/lab`);
        if (res.ok) {
          const data = await res.json();
          const patLabs = data.filter(log => String(log.patientId).toUpperCase() === String(activePatient.id).toUpperCase());
          setPatientLabLogs(patLabs);
        }
      } else {
        showToast('Failed to order lab test.', 'danger');
      }
    } catch (err) {
      console.error("Failed to order lab test:", err);
      showToast('Network error ordering lab test.', 'danger');
    }
  };

  const handleApproveInjection = async (injectionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/injections/${injectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Pending',
          dateGiven: ''
        })
      });
      if (res.ok) {
        setPatientInjections(patientInjections.map(inj => inj.id === injectionId ? { ...inj, status: 'Pending' } : inj));
        showToast('Injection approved successfully! Dispatched to the Injection Desk.', 'success');
      }
    } catch (err) {
      console.error("Error approving injection:", err);
    }
  };

  // Prescription share overlay/modal state
  const [showShareModal, setShowShareModal] = useState(false);


  // Filter patients assigned to this doctor for Today
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      const matched = doctors.find(d => d.email && d.email.toLowerCase() === (doctorEmail || '').toLowerCase());
      if (matched) {
        setSelectedDoctorId(matched.id);
      } else if (selectedDoctorId === null) {
        setSelectedDoctorId(doctors[0].id);
      }
    }
  }, [doctors, doctorEmail]);

  const activeDoctor = (doctors && doctors.find(d => d.id === selectedDoctorId)) ||
                       (doctors && doctors.find(d => d.email && d.email.toLowerCase() === (doctorEmail || '').toLowerCase())) ||
                       doctors[0] ||
                       { id: 1, name: 'Dr. Vijayan', specialty: 'General Medicine' };

  const doctorId = activeDoctor.id;
  const doctorName = activeDoctor.name;

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const myPatients = patients.filter(p => 
    p.assignedDoctorId === doctorId && 
    p.status !== 'Inactive' && 
    (p.registrationDate === todayStr || p.wardBedId)
  );
  const consultationQueue = myPatients
    .filter(p => ['In Queue', 'Registered', 'Consulting'].includes(p.status))
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
  const reviewQueue = myPatients.filter(p => p.status === 'Reviewing');

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setDiagnosis(patient.diagnosis || '');
    setComplaints(patient.complaints || '');
    setPastHistory(patient.pastHistory || '');
    setExamination(patient.examination || '');
    setInvestigation(patient.investigation || '');
    setMedicines(patient.prescription || [{ name: '', dosage: '', duration: 10 }]);
    setFollowUpNotes(patient.followUpNotes || '');
    setNextVisitDate(patient.nextVisitDate || '');
    setPrescriptionMode(patient.prescriptionImg ? 'drawing' : 'form');
    setCanvasDataUrl(patient.prescriptionImg || null);
    setShowHistory(false);
    setExpandHistory(false);
    setShowAllHistoryModal(false);
    setHistoryStartDate('');
    setHistoryEndDate('');

    if (['In Queue', 'Registered'].includes(patient.status) && onStartConsultation) {
      onStartConsultation(patient.id);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: 10 }]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, value) => {
    const updated = medicines.map((med, i) => {
      if (i === idx) {
        return { ...med, [field]: value };
      }
      return med;
    });
    setMedicines(updated);
  };

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    if (!activePatient) return;

    if (prescriptionMode === 'drawing') {
      if (!canvasDataUrl) {
        showToast('Please write something on the digital drawing board first!', 'danger');
        return;
      }
      
      const finalDiagnosis = diagnosis || 'Handwritten Prescription Sheet';
      
      setSharePatient({
        ...activePatient,
        diagnosis: finalDiagnosis,
        prescription: null,
        prescriptionImg: canvasDataUrl,
        complaints,
        pastHistory,
        examination,
        investigation,
        wardBedId: recommendAdmission ? targetBedId : null,
        bedAdmissionPending: recommendAdmission ? 1 : 0
      });
    } else {
      if (!diagnosis) {
        showToast('Please enter a diagnosis first!', 'danger');
        return;
      }
      if (medicines.some(m => !m.name || !m.dosage)) {
        showToast('Please complete medicine details!', 'danger');
        return;
      }
      
      setSharePatient({
        ...activePatient,
        diagnosis,
        prescription: medicines,
        prescriptionImg: null,
        complaints,
        pastHistory,
        examination,
        investigation,
        wardBedId: recommendAdmission ? targetBedId : null,
        bedAdmissionPending: recommendAdmission ? 1 : 0
      });
    }

    setIsHistoryPreview(false);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!activePatient) return;

    onSubmitReview(activePatient.id, {
      followUpNotes: '',
      nextVisitDate: ''
    });

    setActivePatient(null);
  };

  return (
    <div className="fade-in">
      {!activePatient ? (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
              <Clipboard size={20} style={{ color: 'var(--primary)' }} />
              {doctorName}'s Consultations
              {activeDoctor?.specialty && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  ({activeDoctor.specialty})
                </span>
              )}
            </h3>

            {userRole === 'admin' && doctors && doctors.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Doctor Desk:
                </label>
                <select
                  className="form-input"
                  value={doctorId}
                  onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', minWidth: '180px', background: 'var(--bg-dark)', color: 'var(--primary)', fontWeight: 'bold' }}
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Consultation Queue ({consultationQueue.length})
            </h4>
            {consultationQueue.length === 0 ? (
              <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending consults.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {consultationQueue.map(p => (
                  <div 
                    key={p.id} 
                    className="stat-card" 
                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary)', padding: '1rem 1.25rem' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {p.name}
                          {Number(p.specialInvestigation) === 1 && (
                            <span title="Special Investigation Required" style={{
                              background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.2), rgba(234, 88, 12, 0.1))',
                              color: '#ea580c',
                              border: '1px solid rgba(234, 88, 12, 0.4)',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              letterSpacing: '0.05em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              textTransform: 'uppercase'
                            }}>
                              <Microscope size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                              INVEST.
                            </span>
                          )}
                        </span>
                        <span style={{ 
                          background: 'rgba(59, 130, 246, 0.15)', 
                          color: 'var(--primary)', 
                          fontWeight: 800, 
                          fontSize: '0.75rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px' 
                        }}>
                          Token #{p.tokenNumber || '--'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {p.age} Yrs • {p.gender} • ID: #{p.id}
                        {p.status === 'Consulting' && <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontWeight: 600 }}>• Consulting</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {onAdmitToWard && !p.wardBedId && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#0f766e', borderColor: 'rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                          title="Admit to Ward Room"
                        >
                          <Bed size={12} /> Ward
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Consult</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Follow-Up Review Queue ({reviewQueue.length})
            </h4>
            {reviewQueue.length === 0 ? (
              <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No patients awaiting review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviewQueue.map(p => (
                  <div 
                    key={p.id} 
                    className="stat-card" 
                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--warning)', padding: '1rem 1.25rem' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Status: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Returned ({p.issuedMedication})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {onAdmitToWard && !p.wardBedId && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#0f766e', borderColor: 'rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                          title="Admit to Ward Room"
                        >
                          <Bed size={12} /> Ward
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Review</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card fade-in">
          <div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {Number(activePatient.specialInvestigation) === 1 && (
                    <div 
                      title="Click to mark special investigation as reviewed / clear flag"
                      onClick={async () => {
                        if (window.confirm("Mark special investigation as reviewed and clear flag?")) {
                          try {
                            await fetch(`${API_BASE}/api/patients/${activePatient.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ specialInvestigation: 0, specialInvestigationNotes: '' })
                            });
                            setActivePatient(prev => ({ ...prev, specialInvestigation: 0, specialInvestigationNotes: '' }));
                          } catch(err) {}
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '-38px', // hangs over the top edge of the card (card padding is 32px)
                        left: '0px',
                        width: '38px',
                        height: '80px',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: 0.85,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(2px)';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.opacity = '0.85';
                      }}
                    >
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, #991b1b 0%, #ef4444 8%, #dc2626 82%, #991b1b 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '10px',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        <Microscope size={16} strokeWidth={2.5} style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
                        <span style={{ 
                          fontSize: '0.45rem', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em', 
                          marginTop: '4px',
                          color: '#ffffff',
                          fontWeight: 800,
                          lineHeight: 1,
                          textAlign: 'center',
                          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))'
                        }}>
                          SPEC
                        </span>
                      </div>
                    </div>
                  )}
                  <div style={{ 
                    marginLeft: Number(activePatient.specialInvestigation) === 1 ? '50px' : '0px', 
                    transition: 'margin-left 0.2s ease',
                    flexGrow: 1 
                  }}>
                    <h3 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {activePatient.name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      ID: #{activePatient.id} • {activePatient.gender} • {activePatient.age} Yrs • Contact: {activePatient.contact}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--success)',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Token #{activePatient.tokenNumber || '--'}
                  </div>
                </div>

                {/* Quick Prescription Action Bar & Keyboard Info */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px', padding: '0.6rem 1rem', marginTop: '0.75rem', fontSize: '0.8rem',
                  flexWrap: 'wrap', gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                    ⚡ <span>Doctor Quick Actions:</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                      onClick={() => {
                        setDiagnosis('Acute Viral Fever & Upper Respiratory Tract Infection');
                        setMedicines([
                          { name: 'Paracetamol 650mg', dosage: '1-1-1 after food', duration: 5 },
                          { name: 'Amoxicillin 500mg', dosage: '1-0-1 after food', duration: 5 },
                          { name: 'Cetirizine 10mg', dosage: '0-0-1 at bedtime', duration: 5 }
                        ]);
                      }}
                    >
                      + Fever Template
                    </button>
                    <button
                      type="button"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                      onClick={() => {
                        setDiagnosis('Acute Gastritis & Acid Reflux');
                        setMedicines([
                          { name: 'Pantoprazole 40mg', dosage: '1-0-0 before food', duration: 10 },
                          { name: 'Antacid Gel 10ml', dosage: '1-1-1 after food', duration: 5 }
                        ]);
                      }}
                    >
                      + Gastritis Template
                    </button>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '0.5rem' }}>
                      Shortcuts: <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Ctrl+S</code> Send | <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Ctrl+K</code> Search
                    </span>
                  </div>
                </div>
                
                {(activePatient.fatherOrHusbandName || activePatient.motherOrGuardianName || activePatient.alternatePhone || activePatient.address) && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                  }}>
                    {activePatient.fatherOrHusbandName && <div><strong>Father / Husband:</strong> {activePatient.fatherOrHusbandName}</div>}
                    {activePatient.motherOrGuardianName && <div><strong>Mother / Guardian:</strong> {activePatient.motherOrGuardianName}</div>}
                    {activePatient.alternatePhone && <div><strong>Alternate Phone:</strong> {activePatient.alternatePhone}</div>}
                    {activePatient.address && <div><strong>Address:</strong> {activePatient.address}</div>}
                  </div>
                )}

                {/* Child Birth Details Card */}
                {Number(activePatient.isChild) === 1 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: 'rgba(236, 72, 153, 0.05)', 
                    border: '1px solid rgba(236, 72, 153, 0.15)', 
                    borderRadius: '8px',
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontWeight: 600, color: '#ec4899', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      🍼 Child Registry Birth Details
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem' }}>
                      {activePatient.childGa && <div><strong>GA (Gestational Age):</strong> {activePatient.childGa}</div>}
                      {activePatient.childBirthDate && <div><strong>Birth Date:</strong> {activePatient.childBirthDate}</div>}
                      {activePatient.childBirthWeight && <div><strong>Birth Weight:</strong> {activePatient.childBirthWeight}</div>}
                      {activePatient.childPlaceOfBirth && <div><strong>Place of Birth:</strong> {activePatient.childPlaceOfBirth}</div>}
                      {activePatient.childDeliveryType && <div><strong>Delivery Type:</strong> {activePatient.childDeliveryType === 'NVD' ? 'Normal Vaginal Delivery (NVD)' : activePatient.childDeliveryType === 'LSCS' ? 'Lower Segment Cesarean Section (LSCS)' : activePatient.childDeliveryType}</div>}
                      {activePatient.childNicuHistory && <div><strong>History of NICU:</strong> {activePatient.childNicuHistory}</div>}
                    </div>
                  </div>
                )}



                {(activePatient.height || activePatient.weight || activePatient.bp || activePatient.hr || activePatient.spo2 || activePatient.grbs || activePatient.temp) && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: 'rgba(99, 102, 241, 0.04)', 
                    border: '1px solid rgba(99, 102, 241, 0.15)', 
                    borderRadius: '8px',
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Receptionist Triage Vitals
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem' }}>
                      {activePatient.height && <div><strong>Height (Ht):</strong> {activePatient.height} cm</div>}
                      {activePatient.weight && <div><strong>Weight (Wt):</strong> {activePatient.weight} kg</div>}
                      {activePatient.bp && <div><strong>BP:</strong> {activePatient.bp}</div>}
                      {activePatient.hr && <div><strong>Pulse (HR):</strong> {activePatient.hr} bpm</div>}
                      {activePatient.spo2 && <div><strong>SPO2:</strong> {activePatient.spo2}%</div>}
                      {activePatient.grbs && <div><strong>GRBS:</strong> {activePatient.grbs}</div>}
                      {activePatient.temp && <div><strong>Temp (TEMP):</strong> {activePatient.temp} °F</div>}
                      {activePatient.bmi && <div><strong>BMI:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{activePatient.bmi}</span></div>}
                    </div>
                  </div>
                )}

                {patientLabLogs && patientLabLogs.length > 0 && (() => {
                  const sortedLabs = [...patientLabLogs].sort((a, b) => b.id - a.id);
                  const latestLog = sortedLabs[0];
                  return (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.75rem', 
                      background: 'rgba(15, 118, 110, 0.04)', 
                      border: '1px solid rgba(15, 118, 110, 0.15)', 
                      borderRadius: '8px',
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Lab Reports / Investigation Results
                        </div>
                        {patientLabLogs.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.2rem 0.5rem', 
                              fontSize: '0.75rem', 
                              height: 'auto', 
                              borderColor: 'rgba(15, 118, 110, 0.3)',
                              color: 'var(--primary)',
                              background: 'transparent'
                            }}
                            onClick={() => setShowAllLabLogsModal(true)}
                          >
                            See All ({patientLabLogs.length})
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div key={latestLog.id} style={{ paddingBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: 'var(--primary)' }}>{latestLog.testName}</span>
                            <span className={`badge ${latestLog.status === 'Report Delivered' ? 'badge-success' : 'badge-pending'}`}>
                              {latestLog.status === 'Report Delivered' ? 'Delivered' : latestLog.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordered: {latestLog.dateOrdered}</div>
                          {latestLog.reportNotes && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <strong>Notes:</strong> {latestLog.reportNotes}
                            </div>
                          )}
                          {latestLog.reportImg && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <img 
                                src={latestLog.reportImg} 
                                alt="Lab Report" 
                                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border)' }} 
                                onClick={() => setPreviewLabImage(latestLog.reportImg)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Collapsible Patient History */}
              {(() => {
                const totalRecordsCount = (activePatient.history?.length || 0) + (activePatient.diagnosis ? 1 : 0);
                if (totalRecordsCount === 0) return null;

                const allHistoryItems = [];
                if (activePatient.diagnosis) {
                  allHistoryItems.push({
                    type: 'current',
                    date: 'Active / Last Checkup',
                    diagnosis: activePatient.diagnosis,
                    prescription: activePatient.prescription,
                    status: activePatient.status,
                    paymentStatus: activePatient.paymentStatus,
                    rawRecord: activePatient
                  });
                }
                if (activePatient.history) {
                  activePatient.history.slice().reverse().forEach((visit) => {
                    allHistoryItems.push({
                      type: 'archived',
                      date: visit.date,
                      doctorName: visit.doctorName,
                      diagnosis: visit.diagnosis,
                      prescription: visit.prescription,
                      status: visit.status,
                      paymentStatus: visit.paymentStatus,
                      issuedMedication: visit.issuedMedication,
                      rawRecord: visit
                    });
                  });
                }

                const visibleHistoryItems = allHistoryItems.slice(0, 2);

                return (
                  <div style={{ marginBottom: '1.5rem', background: 'rgba(21, 115, 136, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(21, 115, 136, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <History size={16} />
                        Clinical History ({totalRecordsCount} Visit Records)
                      </span>
                      {totalRecordsCount > 2 && (
                        <button
                          type="button"
                          className="btn"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.35rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            height: 'auto'
                          }}
                          onClick={() => setShowAllHistoryModal(true)}
                        >
                          <ExternalLink size={12} /> Show All ({totalRecordsCount - 2} More)
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {visibleHistoryItems.map((item, index) => {
                        if (item.type === 'current') {
                          return (
                            <div key={index} style={{ background: 'rgba(255,255,255,0.4)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                <span>Active / Last Checkup</span>
                                <span>Doctor's diagnosis</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>Diagnosis: {item.diagnosis}</div>
                              {item.prescription && item.prescription.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                  Prescription: {item.prescription.map(m => `${m.name} (${m.dosage} - ${m.duration} Days)`).join(', ')}
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Status: {item.status} • Payment: {item.paymentStatus}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto', border: '1px solid var(--border)' }}
                                  onClick={() => {
                                    setIsHistoryPreview(true);
                                    setSharePatient({
                                      ...activePatient,
                                      registrationDate: activePatient.registrationDate || new Date().toLocaleDateString(),
                                      history: activePatient.history || []
                                    });
                                    setShowShareModal(true);
                                  }}
                                >
                                  <FileText size={12} /> Prescription
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                <span>{item.date}</span>
                                <span>Doc: {item.doctorName}</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>Diagnosis: {item.diagnosis}</div>
                              {item.prescription && item.prescription.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                  Prescription: {item.prescription.map(m => `${m.name} (${m.dosage} - ${m.duration} Days)`).join(', ')}
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  <span>Status: {item.status}</span>
                                  <span>Payment: {item.paymentStatus}</span>
                                  <span>Issued: {item.issuedMedication || 'None'}</span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto', border: '1px solid var(--border)' }}
                                  onClick={() => {
                                    setIsHistoryPreview(true);
                                    setSharePatient({
                                      name: activePatient.name,
                                      age: activePatient.age,
                                      gender: activePatient.gender,
                                      contact: activePatient.contact,
                                      height: activePatient.height,
                                      weight: activePatient.weight,
                                      bp: activePatient.bp,
                                      hr: activePatient.hr,
                                      spo2: activePatient.spo2,
                                      grbs: activePatient.grbs,
                                      temp: activePatient.temp,
                                      registrationDate: item.date,
                                      diagnosis: item.diagnosis,
                                      prescription: item.prescription,
                                      prescriptionImg: item.rawRecord.prescriptionImg || null
                                    });
                                    setShowShareModal(true);
                                  }}
                                >
                                  <FileText size={12} /> Prescription
                                </button>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Consultation flow (Registered/Consulting status) */}
              {(activePatient.status === 'Registered' || activePatient.status === 'Consulting') && (
                <form onSubmit={handlePrescriptionSubmit}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Doctor Consultation</h4>

                  {/* Order Lab Investigation */}
                  <div style={{
                    background: 'rgba(15, 118, 110, 0.05)',
                    border: '1px solid rgba(15, 118, 110, 0.2)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                      <FlaskConical size={18} />
                      Order Lab Investigation / Test
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0.75rem 0' }}>
                      Test ordered will go directly as a notification to the Laboratory queue.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. CBC Blood Test, X-Ray, ECG"
                        value={orderTestName}
                        onChange={(e) => setOrderTestName(e.target.value)}
                        style={{ flexGrow: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleOrderLabTest}
                        style={{ background: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={16} /> Order
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Diagnosis & Clinical Notes</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      placeholder={prescriptionMode === 'drawing' ? "Enter optional notes (or write everything directly on the board below)..." : "Enter patient diagnosis, findings, and symptoms..."}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required={prescriptionMode === 'form'}
                    />
                  </div>

                  {/* Ward Admission Selector */}
                  {(() => {
                    const allBeds = ['101A', '101B', '102A', '102B', '103A', '103B', '104A', '104B', '105A', '105B'];
                    const occupiedBedIds = patients
                      .filter(p => p.wardBedId && p.status !== 'Inactive')
                      .map(p => p.wardBedId);
                    const availableBeds = allBeds.filter(bedId => !occupiedBedIds.includes(bedId));

                    return (
                      <div className="form-group" style={{ 
                        background: recommendAdmission ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.01)', 
                        border: recommendAdmission ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid var(--border)', 
                        borderRadius: '10px', 
                        padding: '1.25rem',
                        marginBottom: '1.75rem',
                        transition: 'all 0.25s ease'
                      }}>
                        <div 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => {
                            setRecommendAdmission(!recommendAdmission);
                            if (recommendAdmission) setTargetBedId('');
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              background: recommendAdmission ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                              color: recommendAdmission ? 'var(--primary)' : 'var(--text-secondary)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.25s'
                            }}>
                              <Bed size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recommend Ward Admission</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                Request bed assignment for inpatient care
                              </div>
                            </div>
                          </div>
                          
                          {/* Toggle switch visual */}
                          <div style={{
                            width: '40px',
                            height: '22px',
                            background: recommendAdmission ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            borderRadius: '15px',
                            position: 'relative',
                            transition: 'background 0.25s'
                          }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              background: '#fff',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '3px',
                              left: recommendAdmission ? '21px' : '3px',
                              transition: 'left 0.25s'
                            }} />
                          </div>
                        </div>

                        {recommendAdmission && (
                          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }} className="fade-in">
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                              Available Ward Beds ({availableBeds.length})
                            </label>
                            <select 
                              className="form-input" 
                              value={targetBedId}
                              onChange={(e) => setTargetBedId(e.target.value)}
                              required={recommendAdmission}
                              style={{ fontSize: '0.9rem' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="" disabled>-- Select Bed --</option>
                              {availableBeds.map(bedId => (
                                <option key={bedId} value={bedId}>
                                  Room {bedId.slice(0, 3)} - Bed {bedId.slice(3)}
                                </option>
                              ))}
                            </select>
                            {availableBeds.length === 0 && (
                              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0, fontWeight: 500 }}>
                                ⚠️ No ward beds are currently available.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Prescription entry mode selector */}
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Prescription Entry Mode</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className={`btn ${prescriptionMode === 'form' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flexGrow: 1 }}
                        onClick={() => setPrescriptionMode('form')}
                      >
                        Type Prescription List
                      </button>
                      <button
                        type="button"
                        className={`btn ${prescriptionMode === 'drawing' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flexGrow: 1 }}
                        onClick={() => setPrescriptionMode('drawing')}
                      >
                        Draw on Screen Pad (Stylus/Pen)
                      </button>
                    </div>
                  </div>

                  {prescriptionMode === 'drawing' ? (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Digital Drawing Board (Write/Draw Prescription)</label>
                      <DrawingCanvas onSave={setCanvasDataUrl} />
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Digital Prescription</label>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={handleAddMedicine}
                        >
                          <Plus size={14} /> Add Medicine
                        </button>
                      </div>

                      {medicines.map((med, idx) => (
                        <div key={idx} className="medicine-row-grid">
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Medicine Name (e.g. Paracetamol)"
                            value={med.name}
                            onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                            required
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Dosage (e.g. 500mg - 1-0-1)"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            required
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ paddingRight: '0.5rem' }}
                              value={med.duration}
                              onChange={(e) => handleMedicineChange(idx, 'duration', parseInt(e.target.value))}
                              required
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days</span>
                          </div>
                          <button 
                            type="button" 
                            className="btn-logout" 
                            onClick={() => handleRemoveMedicine(idx)}
                            disabled={medicines.length === 1}
                            style={{ margin: '0 auto' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                      <Send size={16} /> Send to Pharmacy
                    </button>
                    {onAdmitToWard && !activePatient.wardBedId && (
                      <button
                        type="button"
                        onClick={() => onAdmitToWard(activePatient)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.6rem 1.25rem',
                          background: 'rgba(15,118,110,0.1)',
                          border: '1.5px solid rgba(15,118,110,0.35)',
                          borderRadius: '8px',
                          color: '#0f766e',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Bed size={15} /> Admit to Ward
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Review flow (Reviewing status) */}
              {activePatient.status === 'Reviewing' && (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '1.5rem' }}>
                    <AlertCircle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>Medication Status:</strong> Pharmacy issued <strong>{activePatient.issuedMedication}</strong> of the prescribed duration.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Previous Diagnosis</label>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem' }}>
                      {activePatient.diagnosis}
                    </div>
                  </div>

                  {/* Order Lab Investigation */}
                  <div style={{
                    background: 'rgba(15, 118, 110, 0.05)',
                    border: '1px solid rgba(15, 118, 110, 0.2)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                      <FlaskConical size={18} />
                      Order Lab Investigation / Test
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0.75rem 0' }}>
                      Test ordered will go directly as a notification to the Laboratory queue.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. CBC Blood Test, X-Ray, ECG"
                        value={orderTestName}
                        onChange={(e) => setOrderTestName(e.target.value)}
                        style={{ flexGrow: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleOrderLabTest}
                        style={{ background: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={16} /> Order
                      </button>
                    </div>
                  </div>

                  {/* Injection Approval Section */}
                  {patientInjections && patientInjections.length > 0 && (
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                        <Syringe size={16} style={{ color: 'var(--primary)' }} />
                        <span>Prescribed Injection Details</span>
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {patientInjections.map(inj => (
                          <div 
                            key={inj.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 1rem', 
                              background: 'rgba(21, 115, 136, 0.05)', 
                              border: '1px solid rgba(21, 115, 136, 0.15)', 
                              borderRadius: '8px' 
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)' }}>{inj.injectionName}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dosage: {inj.dosage}</span>
                            </div>
                            <div>
                              {inj.status === 'Pending Approval' ? (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => handleApproveInjection(inj.id)}
                                >
                                  <Check size={14} /> Allow Injection Desk
                                </button>
                              ) : inj.status === 'Pending' ? (
                                <span className="badge badge-pending" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                  Approved & Pending Desk
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                  Administered ✅ ({inj.dateGiven})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                      <CheckCircle2 size={16} /> Complete Consultation Review
                    </button>
                    {onAdmitToWard && !activePatient.wardBedId && (
                      <button
                        type="button"
                        onClick={() => onAdmitToWard(activePatient)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.6rem 1.25rem',
                          background: 'rgba(15,118,110,0.1)',
                          border: '1.5px solid rgba(15,118,110,0.35)',
                          borderRadius: '8px',
                          color: '#0f766e',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s'
                        }}
                        title="Admit this patient to a ward bed"
                      >
                        <Bed size={15} /> Admit to Ward
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
        </div>
      )}



      {/* All Clinical History Timeline Modal */}
      {showAllHistoryModal && (() => {
        const totalRecordsCount = (activePatient.history?.length || 0) + (activePatient.diagnosis ? 1 : 0);
        
        const allHistoryItems = [];
        if (activePatient.diagnosis) {
          allHistoryItems.push({
            type: 'current',
            date: 'Active / Last Checkup',
            diagnosis: activePatient.diagnosis,
            prescription: activePatient.prescription,
            status: activePatient.status,
            paymentStatus: activePatient.paymentStatus,
            rawRecord: activePatient
          });
        }
        if (activePatient.history) {
          activePatient.history.slice().reverse().forEach((visit) => {
            allHistoryItems.push({
              type: 'archived',
              date: visit.date,
              doctorName: visit.doctorName,
              diagnosis: visit.diagnosis,
              prescription: visit.prescription,
              status: visit.status,
              paymentStatus: visit.paymentStatus,
              issuedMedication: visit.issuedMedication,
              rawRecord: visit
            });
          });
        }
        const isWithinDateRange = (itemDateStr) => {
          if (!historyStartDate && !historyEndDate) return true;
          
          let itemDate;
          if (itemDateStr === 'Active / Last Checkup') {
            itemDate = new Date();
          } else {
            itemDate = new Date(itemDateStr);
          }
          
          if (isNaN(itemDate.getTime())) return true;
          
          if (historyStartDate) {
            const start = new Date(historyStartDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          
          if (historyEndDate) {
            const end = new Date(historyEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
          
          return true;
        };

        const filteredHistoryItems = allHistoryItems.filter(item => isWithinDateRange(item.date));

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fade-in 0.2s ease-out'
          }} onClick={() => setShowAllHistoryModal(false)}>
            <div style={{
              background: '#ffffff',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Clinical History Timeline
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Patient: {activePatient.name} • Total {totalRecordsCount} Visit Records
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllHistoryModal(false)}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Date Range Filter Bar */}
              <div style={{
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Filter by Date Range:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input 
                      type="date" 
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      style={{
                        padding: '0.3rem 0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        background: '#ffffff'
                      }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                    <input 
                      type="date" 
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      style={{
                        padding: '0.3rem 0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>
                {(historyStartDate || historyEndDate) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setHistoryStartDate('');
                      setHistoryEndDate('');
                    }}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)' }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Scrollable Content */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#fcfcfd', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistoryItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: '#ffffff', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                    No records found for the selected date range.
                  </div>
                ) : filteredHistoryItems.map((item, index) => {
                  if (item.type === 'current') {
                    return (
                      <div key={index} style={{ background: 'rgba(255,255,255,0.9)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', borderLeft: '4px solid var(--warning)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>Active / Last Checkup</span>
                          <span>Doctor's diagnosis</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>Diagnosis: {item.diagnosis}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Status: {item.status} • Payment: {item.paymentStatus}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 700 }}
                            onClick={() => {
                              setIsHistoryPreview(true);
                              setSharePatient({
                                ...activePatient,
                                registrationDate: activePatient.registrationDate || new Date().toLocaleDateString(),
                                history: activePatient.history || []
                              });
                              setShowShareModal(true);
                            }}
                          >
                            <FileText size={12} /> Prescription
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} style={{ background: '#ffffff', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>{item.date}</span>
                          <span>Doc: {item.doctorName}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>Diagnosis: {item.diagnosis}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Status: {item.status}</span>
                            <span>Payment: {item.paymentStatus}</span>
                            <span>Issued: {item.issuedMedication || 'None'}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 700 }}
                            onClick={() => {
                              setIsHistoryPreview(true);
                              setSharePatient({
                                name: activePatient.name,
                                age: activePatient.age,
                                gender: activePatient.gender,
                                contact: activePatient.contact,
                                height: activePatient.height,
                                weight: activePatient.weight,
                                bp: activePatient.bp,
                                hr: activePatient.hr,
                                spo2: activePatient.spo2,
                                grbs: activePatient.grbs,
                                temp: activePatient.temp,
                                registrationDate: item.date,
                                diagnosis: item.diagnosis,
                                prescription: item.prescription,
                                prescriptionImg: item.rawRecord.prescriptionImg || null
                              });
                              setShowShareModal(true);
                            }}
                          >
                            <FileText size={12} /> Prescription
                          </button>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid var(--border)',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAllHistoryModal(false)}
                  style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Close Timeline
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Share / Print Prescription Preview Modal Overlay */}
      {sharePatient && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => {
          setSharePatient(null);
          setIsHistoryPreview(false);
        }}>
          <div style={{
            background: '#ffffff',
            color: 'var(--text-primary)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            animation: 'fade-in 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              background: '#f8fafc'
            }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>
                {isHistoryPreview ? "View Previous Prescription" : "Review & Send Prescription"}
              </h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
                onClick={() => {
                  setSharePatient(null);
                  setIsHistoryPreview(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content wrapper */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', background: '#f8fafc' }}>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem', marginTop: 0 }}>
                {isHistoryPreview 
                  ? "Review this official patient prescription." 
                  : "Please review the digital prescription details below. Clicking 'Send to Pharmacy' will record and dispatch this prescription."}
              </p>

              {/* Official Prescription Paper (Adult vs Child Template) */}
              {sharePatient?.patientCategory === 'child' || (sharePatient?.age && parseInt(sharePatient.age) <= 12) ? (
                <ChildPrescriptionTemplate patient={sharePatient} />
              ) : (
                <PrescriptionTemplate patient={sharePatient} />
              )}

            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: '#f8fafc',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              {isHistoryPreview ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      onPrintPrescription();
                    }}
                  >
                    <Printer size={16} /> Print Prescription
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setSharePatient(null);
                      setIsHistoryPreview(false);
                    }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ flexGrow: 1 }}
                    onClick={async () => {
                      const success = await onSubmitPrescription(activePatient.id, sharePatient);
                      if (success) {
                        setSharePatient(null);
                        setActivePatient(null);
                        showToast(`Prescription successfully sent to Pharmacy!`, 'success');
                      } else {
                        showToast(`Failed to send prescription. Please try again!`, 'danger');
                      }
                    }}
                  >
                    <Send size={16} /> Send to Pharmacy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setSharePatient(null);
                    }}
                  >
                    Edit / Cancel
                  </button>
                </>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
      {showAllLabLogsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} onClick={() => setShowAllLabLogsModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.25rem' }}>All Lab Investigation Reports</h3>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setShowAllLabLogsModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[...patientLabLogs].sort((a, b) => b.id - a.id).map((log) => (
                <div key={log.id} style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{log.testName}</span>
                    <span className={`badge ${log.status === 'Report Delivered' ? 'badge-success' : 'badge-pending'}`}>
                      {log.status === 'Report Delivered' ? 'Delivered' : log.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordered: {log.dateOrdered}</div>
                  {log.reportNotes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <strong>Notes:</strong> {log.reportNotes}
                    </div>
                  )}
                  {log.reportImg && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img 
                        src={log.reportImg} 
                        alt="Lab Report" 
                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)', objectFit: 'contain' }} 
                        onClick={() => {
                          setPreviewLabImage(log.reportImg);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAllLabLogsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {previewLabImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} onClick={() => setPreviewLabImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button 
              style={{
                position: 'absolute',
                top: '-30px',
                right: '0px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setPreviewLabImage(null)}
            >
              ✕
            </button>
            <img 
              src={previewLabImage} 
              alt="Lab Report Full" 
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} 
            />
          </div>
        </div>
      )}

      {/* Custom Toast Notification - Root Level (Shows at bottom) */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100020,
          background: toast.type === 'success' ? '#059669' : toast.type === 'danger' ? '#dc2626' : '#0284c7',
          color: '#ffffff',
          padding: '0.85rem 1.75rem',
          borderRadius: '50px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700,
          fontSize: '0.95rem',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fade-in 0.3s ease-out',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
