import React, { useState, useEffect } from 'react';
import { User, Clipboard, Plus, Trash2, CheckCircle2, AlertCircle, FileText, Send, Printer, Mail, History, Check, Syringe } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DoctorDashboard = ({ patients, doctorEmail, onSubmitPrescription, onSubmitReview, onStartConsultation, onPrintPrescription, onEmailPrescription }) => {
  const [activePatient, setActivePatient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
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

  useEffect(() => {
    if (activePatient) {
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
      fetchPatientInjections();
    } else {
      setPatientInjections([]);
    }
  }, [activePatient]);

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
  const [sharePatient, setSharePatient] = useState(null);

  // Filter patients assigned to this doctor
  const isDoc2 = doctorEmail.includes('2');
  const doctorId = isDoc2 ? 2 : 1;
  const doctorName = isDoc2 ? 'Dr. Sarah' : 'Dr. Vijayan';

  const myPatients = patients.filter(p => p.assignedDoctorId === doctorId);
  const consultationQueue = myPatients
    .filter(p => ['Registered', 'Consulting'].includes(p.status))
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

    if (patient.status === 'Registered' && onStartConsultation) {
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
      
      // Trigger share prescription popup (preview mode)
      setSharePatient({
        ...activePatient,
        diagnosis: finalDiagnosis,
        prescription: null,
        prescriptionImg: canvasDataUrl,
        complaints,
        pastHistory,
        examination,
        investigation
      });
    } else {
      if (!diagnosis) {
        showToast('Please enter a diagnosis first!', 'danger');
        return;
      }
      if (medicines.some(m => !m.name || !m.dosage)) return;
      
      // Trigger share prescription popup (preview mode)
      setSharePatient({
        ...activePatient,
        diagnosis,
        prescription: medicines,
        prescriptionImg: null,
        complaints,
        pastHistory,
        examination,
        investigation
      });
    }

    setShowShareModal(true);
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
      <div className="grid-2">
        {/* Patient Queues */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Clipboard size={20} style={{ color: 'var(--primary)' }} />
            {doctorName}'s Consultations
          </h3>

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
                        <span style={{ fontWeight: 700 }}>{p.name}</span>
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
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Consult</button>
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
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Review</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workspace Area */}
        <div>
          {!activePatient ? (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
              <User size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3>Select a Patient</h3>
              <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Select a patient from the consultation or review queue to begin guidance.</p>
            </div>
          ) : (
            <div className="card fade-in">
              {sharePatient ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 750 }}>
                      {isHistoryPreview ? "View Previous Prescription" : "Review & Send Prescription"}
                    </h3>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setSharePatient(null);
                        setIsHistoryPreview(false);
                      }}
                    >
                      ✕ Close Preview
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {isHistoryPreview 
                      ? "Review this official patient prescription." 
                      : "Please review the digital prescription details below. Clicking 'Send to Pharmacy' will record and dispatch this prescription."}
                  </p>

                  {/* Simulated Printed RX paper */}
                  <div className="prescription-paper" id="printable-rx" style={{
                    background: '#fff',
                    color: '#000',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    padding: '0.4in',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    maxWidth: '100%',
                    margin: '0 auto',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'none'
                  }}>
                    <div>
                      {/* Letterhead Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                        {/* Left side of header */}
                        <div style={{ width: '55%', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              background: 'rgb(239, 68, 68)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '1.25rem'
                            }}>
                              V
                            </div>
                            <div>
                              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                VIJAYA'S HEALTH CARE
                              </div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
                                YOUR HEALTH OUR MISSION
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#1e293b', lineHeight: '1.3' }}>
                            <div><strong>Rtn Dr. N.ANBU</strong>, M.B.B.S., FIDM, FCCM</div>
                            <div style={{ color: '#475569', fontSize: '0.65rem' }}>பொதுநலம் மற்றும் சர்க்கரை நோய் சிறப்பு மருத்துவர்</div>
                            <div style={{ marginTop: '0.2rem' }}><strong>Dr. SINDHUJA ANBU</strong>, M.B.B.S., DNB (Pediatrics)</div>
                            <div style={{ color: '#475569', fontSize: '0.65rem' }}>குழந்தைகள் சிறப்பு மருத்துவர்</div>
                            <div style={{ marginTop: '0.2rem' }}><strong>Dr. N.ARAVINDRAJ</strong> M.B.B.S.,</div>
                            <div style={{ color: '#475569', fontSize: '0.65rem' }}>பொதுநலம் மற்றும் சர்க்கரை நோய் சிறப்பு மருத்துவர்</div>
                          </div>
                        </div>

                        {/* Right side of header */}
                        <div style={{ width: '40%', textAlign: 'right' }}>
                          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Latha, sans-serif' }}>
                            விஜயலெட்சுமி
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', marginTop: '0.15rem' }}>
                            குழந்தைகள் நல மருத்துவமனை
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.4rem', lineHeight: '1.4' }}>
                            <div>RN Complex, Railway Road,</div>
                            <div>Kollidam, Tamil Nadu, India.</div>
                            <div>Ph: 04364 - 278558, Cell: 84890 61807</div>
                            <div>E-mail: vijayahealthcare@gmail.com</div>
                            <div>Web: www.vijayahealthcare.com</div>
                          </div>
                        </div>
                      </div>

                      {/* Vitals & Patient Info Table */}
                      <div style={{ border: '1.5px solid #000', marginBottom: '1rem', fontSize: '0.8rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', borderBottom: '1.5px solid #000' }}>
                          <div style={{ width: '50%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>
                            <strong>NAME :</strong> <span style={{ marginLeft: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>{sharePatient.name}</span>
                          </div>
                          <div style={{ width: '50%', display: 'flex', flexWrap: 'wrap' }}>
                            <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                              <strong>Age:</strong> {sharePatient.age}
                            </div>
                            <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                              <strong>Sex:</strong> {sharePatient.gender}
                            </div>
                            <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                              <strong>Ht:</strong> {sharePatient.height || '--'}
                            </div>
                            <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                              <strong>Wt:</strong> {sharePatient.weight || '--'}
                            </div>
                            <div style={{ width: '20%', padding: '0.4rem 0.5rem' }}>
                              <strong>Date:</strong> {new Date(sharePatient.registrationDate || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.01)' }}>
                          <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                            <strong>BP:</strong> {sharePatient.bp || '--'}
                          </div>
                          <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                            <strong>HR:</strong> {sharePatient.hr || '--'}
                          </div>
                          <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                            <strong>SPO2:</strong> {sharePatient.spo2 || '--'}%
                          </div>
                          <div style={{ width: '20%', padding: '0.4rem 0.5rem', borderRight: '1.5px solid #000' }}>
                            <strong>GRBS:</strong> {sharePatient.grbs || '--'}
                          </div>
                          <div style={{ width: '20%', padding: '0.4rem 0.5rem' }}>
                            <strong>TEMP:</strong> {sharePatient.temp || '--'}°F
                          </div>
                        </div>
                      </div>

                      {/* Clean Rx Layout */}
                      <div style={{ minHeight: '4.5in', borderTop: '1.5px solid #000', paddingTop: '0.5rem', textAlign: 'left', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#b91c1c', fontFamily: '"Georgia", serif', lineHeight: 1 }}>
                            ℞
                          </div>
                          {sharePatient.diagnosis && (
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                              <strong>Diagnosis / Notes:</strong> <span style={{ color: '#b91c1c', fontWeight: 700, marginLeft: '0.25rem' }}>{sharePatient.diagnosis}</span>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                          {sharePatient.prescriptionImg ? (
                            <div style={{ textAlign: 'center' }}>
                              <img 
                                src={sharePatient.prescriptionImg} 
                                style={{ maxWidth: '100%', maxHeight: '4.2in', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px' }} 
                                alt="Prescription Drawing" 
                              />
                            </div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                                  <th style={{ padding: '0.5rem 0', width: '50%' }}>Medicine</th>
                                  <th style={{ padding: '0.5rem 0', width: '30%' }}>Dosage</th>
                                  <th style={{ padding: '0.5rem 0', textAlign: 'right', width: '20%' }}>Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sharePatient.prescription?.map((m, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>{m.name}</td>
                                    <td style={{ padding: '0.6rem 0' }}>{m.dosage}</td>
                                    <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>{m.duration} Days</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Section */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div style={{ textAlign: 'center', width: '2in' }}>
                        <div style={{ borderBottom: '1px dashed #000', height: '15px' }}></div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '0.25rem', color: '#1e293b' }}>
                          Doctor's Signature
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
                          onClick={() => {
                            onSubmitPrescription(activePatient.id, sharePatient);
                            setSharePatient(null);
                            setActivePatient(null);
                            showToast(`Prescription successfully sent to Pharmacy!`, 'success');
                          }}
                        >
                          <Send size={16} /> Send to Pharmacy
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary"
                          style={{ flexGrow: 1 }}
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
              ) : (
                <div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{activePatient.name}</h3>
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
                
                {(activePatient.fatherOrHusbandName || activePatient.alternatePhone || activePatient.address) && (
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
                    {activePatient.alternatePhone && <div><strong>Alternate Phone:</strong> {activePatient.alternatePhone}</div>}
                    {activePatient.address && <div><strong>Address:</strong> {activePatient.address}</div>}
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
              </div>

              {/* Collapsible Patient History */}
              {((activePatient.history && activePatient.history.length > 0) || activePatient.diagnosis) && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(21, 115, 136, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(21, 115, 136, 0.15)' }}>
                  <h5 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--primary)', cursor: 'pointer', fontSize: '0.95rem', justifyContent: 'space-between' }} 
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <History size={16} />
                      Clinical History ({(activePatient.history?.length || 0) + (activePatient.diagnosis ? 1 : 0)} Visit Records)
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>{showHistory ? '▲ Hide' : '▼ Show'}</span>
                  </h5>
                  {showHistory && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {/* Current Active or Un-archived last visit */}
                      {activePatient.diagnosis && (
                        <div style={{ background: 'rgba(255,255,255,0.4)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            <span>Active / Last Checkup</span>
                            <span>Doctor's diagnosis</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>Diagnosis: {activePatient.diagnosis}</div>
                          {activePatient.prescription && activePatient.prescription.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Prescription: {activePatient.prescription.map(m => `${m.name} (${m.dosage} - ${m.duration} Days)`).join(', ')}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Status: {activePatient.status} • Payment: {activePatient.paymentStatus}
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
                      )}
                      
                      {/* Archived History */}
                      {activePatient.history && activePatient.history.slice().reverse().map((visit, index) => (
                        <div key={index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            <span>{visit.date}</span>
                            <span>Doc: {visit.doctorName}</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>Diagnosis: {visit.diagnosis}</div>
                          {visit.prescription && visit.prescription.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Prescription: {visit.prescription.map(m => `${m.name} (${m.dosage} - ${m.duration} Days)`).join(', ')}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>Status: {visit.status}</span>
                              <span>Payment: {visit.paymentStatus}</span>
                              <span>Issued: {visit.issuedMedication || 'None'}</span>
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
                                  registrationDate: visit.date,
                                  diagnosis: visit.diagnosis,
                                  prescription: visit.prescription,
                                  prescriptionImg: visit.prescriptionImg
                                });
                                setShowShareModal(true);
                              }}
                            >
                              <FileText size={12} /> Prescription
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Consultation flow (Registered/Consulting status) */}
              {(activePatient.status === 'Registered' || activePatient.status === 'Consulting') && (
                <form onSubmit={handlePrescriptionSubmit}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Doctor Consultation</h4>
                  


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
                    <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
      </div>
      </div>

      {/* Custom Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#ef4444' : '#14b8a6',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fade-in 0.3s ease-out',
          pointerEvents: 'none'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
