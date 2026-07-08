import React, { useState } from 'react';
import { User, Clipboard, Plus, Trash2, CheckCircle2, AlertCircle, FileText, Send, Printer, Mail } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';

const DoctorDashboard = ({ patients, doctorEmail, onSubmitPrescription, onSubmitReview, onPrintPrescription, onEmailPrescription }) => {
  const [activePatient, setActivePatient] = useState(null);
  
  // Diagnosis state
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: 10 }]);
  
  // Drawing Prescription state
  const [prescriptionMode, setPrescriptionMode] = useState('form'); // 'form' or 'drawing'
  const [canvasDataUrl, setCanvasDataUrl] = useState(null);

  // Follow-up state
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  // Prescription share overlay/modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePatient, setSharePatient] = useState(null);

  // Filter patients assigned to this doctor
  const isDoc2 = doctorEmail.includes('2');
  const doctorId = isDoc2 ? 2 : 1;
  const doctorName = isDoc2 ? 'Dr. Sarah' : 'Dr. Vijayan';

  const myPatients = patients.filter(p => p.assignedDoctorId === doctorId);
  const consultationQueue = myPatients.filter(p => p.status === 'Registered');
  const reviewQueue = myPatients.filter(p => p.status === 'Reviewing');

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setDiagnosis('');
    setMedicines([{ name: '', dosage: '', duration: 10 }]);
    setFollowUpNotes('');
    setNextVisitDate('');
    setPrescriptionMode('form');
    setCanvasDataUrl(null);
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
        alert('Please write something on the digital drawing board first!');
        return;
      }
      
      const finalDiagnosis = diagnosis || 'Handwritten Prescription Sheet';
      
      onSubmitPrescription(activePatient.id, {
        diagnosis: finalDiagnosis,
        prescription: null,
        prescriptionImg: canvasDataUrl
      });

      // Trigger share prescription popup
      setSharePatient({
        ...activePatient,
        diagnosis: finalDiagnosis,
        prescription: null,
        prescriptionImg: canvasDataUrl
      });
    } else {
      if (!diagnosis) {
        alert('Please enter a diagnosis first!');
        return;
      }
      if (medicines.some(m => !m.name || !m.dosage)) return;
      
      onSubmitPrescription(activePatient.id, {
        diagnosis,
        prescription: medicines,
        prescriptionImg: null
      });

      // Trigger share prescription popup
      setSharePatient({
        ...activePatient,
        diagnosis,
        prescription: medicines,
        prescriptionImg: null
      });
    }

    setShowShareModal(true);
    setActivePatient(null);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!activePatient || !followUpNotes || !nextVisitDate) return;

    onSubmitReview(activePatient.id, {
      followUpNotes,
      nextVisitDate
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
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.age} Yrs • {p.gender}</div>
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
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{activePatient.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {activePatient.gender} • {activePatient.age} Yrs • Contact: {activePatient.contact}
                </p>
                {activePatient.address && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Address: {activePatient.address}</p>
                )}
              </div>

              {/* Consultation flow (Registered status) */}
              {activePatient.status === 'Registered' && (
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
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
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

                  <div className="form-group">
                    <label className="form-label">Follow-up Guidance & Notes</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      placeholder="Add guidance, advice, or secondary diagnosis notes..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Next Visit / Consult Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={nextVisitDate}
                      onChange={(e) => setNextVisitDate(e.target.value)}
                      required
                    />
                  </div>

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
      </div>

      {/* Share / Delivery Modal */}
      {showShareModal && sharePatient && (
        <div className="modal-overlay">
          <div className="card modal-content fade-in" style={{ padding: '2rem' }}>
            <div className="modal-header">
              <h3 className="modal-title">Prescription Created</h3>
              <button className="close-btn" onClick={() => setShowShareModal(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              The prescription has been recorded digitally and sent to the Pharmacy. How would you like to share/deliver it to the patient?
            </p>

            {/* Simulated Printed RX paper */}
            <div className="prescription-paper" id="printable-rx">
              <div className="rx-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="rx-logo">VIJAYAS HOSPITAL</div>
                    <div className="rx-sub">DIGITAL PRESCRIPTION</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                    <div>Date: {new Date().toLocaleDateString()}</div>
                    <div>Doc: {doctorName}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                <strong>Patient:</strong> {sharePatient.name} ({sharePatient.age} Yrs • {sharePatient.gender})
              </div>

              <div className="rx-symbol">℞</div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#475569' }}>Diagnosis:</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>{sharePatient.diagnosis}</p>
              </div>

              <div>
                <strong style={{ fontSize: '0.9rem', color: '#475569' }}>Medicines:</strong>
                {sharePatient.prescriptionImg ? (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <img 
                      src={sharePatient.prescriptionImg} 
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                      alt="Handwritten Prescription" 
                    />
                  </div>
                ) : (
                  <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0' }}>Medicine</th>
                        <th style={{ padding: '0.5rem 0' }}>Dosage</th>
                        <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharePatient.prescription?.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0' }}>{m.name}</td>
                          <td style={{ padding: '0.5rem 0' }}>{m.dosage}</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{m.duration} Days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flexGrow: 1 }}
                onClick={() => {
                  onEmailPrescription(sharePatient);
                  alert(`Prescription successfully emailed to patient's contact email!`);
                }}
              >
                <Mail size={16} /> Email Prescription
              </button>
              <button 
                className="btn btn-secondary"
                style={{ flexGrow: 1 }}
                onClick={() => {
                  onPrintPrescription();
                  alert(`Opening browser print dialogue...`);
                }}
              >
                <Printer size={16} /> Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
