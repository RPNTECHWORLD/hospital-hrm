import React, { useState } from 'react';
import { Pill, Activity, Clock, Award, CheckSquare, ShieldAlert, Printer, Mail, History, ChevronDown, ChevronUp } from 'lucide-react';
import PrescriptionTemplate from './PrescriptionTemplate';
import ChildPrescriptionTemplate from './ChildPrescriptionTemplate';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PharmacyDashboard = ({ patients, doctors, onIssueMedication, onPrintPrescription, onEmailPrescription }) => {
  const [activePatient, setActivePatient] = useState(null);

  // Issues state
  const [issueType, setIssueType] = useState('full'); // 'full' or 'partial'
  const [partialDays, setPartialDays] = useState(5);

  // Previous prescriptions panel
  const [showPrevRx, setShowPrevRx] = useState(false);
  const [selectedHistIdx, setSelectedHistIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  // Injection states
  const [requiresInjection, setRequiresInjection] = useState(false);
  const [injectionName, setInjectionName] = useState('Inj. Ceftriaxone');
  const [injectionDosage, setInjectionDosage] = useState('1.5g IV');

  React.useEffect(() => {
    setRequiresInjection(false);
    setInjectionName('Inj. Ceftriaxone');
    setInjectionDosage('1.5g IV');
  }, [activePatient]);

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const pendingPrescriptions = patients.filter(p => 
    p.status === 'At Pharmacy' && 
    (p.registrationDate === todayStr || p.wardBedId)
  );
  const completedIssues = patients.filter(p => 
    ['Reviewing', 'Completed'].includes(p.status) && 
    (p.registrationDate === todayStr || p.wardBedId)
  ).length;

  const docName = activePatient
    ? (doctors.find(d => d.id === activePatient.assignedDoctorId)?.name || 'Doctor')
    : 'Doctor';

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setIssueType('full');
    setShowPrevRx(false);
    setSelectedHistIdx(0);
    // Calculate a default partial day count (half of the first medicine's duration)
    const firstMedDuration = patient.prescription?.[0]?.duration || 10;
    setPartialDays(Math.max(1, Math.floor(firstMedDuration / 2)));
  };

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    if (!activePatient) return;

    const issuedString = issueType === 'full'
      ? 'Full Duration'
      : `Partial Duration (${partialDays} Days)`;

    const injectionData = requiresInjection ? {
      name: injectionName,
      dosage: injectionDosage
    } : null;

    onIssueMedication(activePatient.id, issuedString, injectionData);
    setActivePatient(null);
  };

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Pill size={24} />
          </div>
          <div>
            <div className="stat-value">{pendingPrescriptions.length}</div>
            <div className="stat-label">Pending Prescriptions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Award size={24} />
          </div>
          <div>
            <div className="stat-value">{completedIssues}</div>
            <div className="stat-label">Total Dispensed Today</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Prescription Inbox */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            Prescription Inbox
          </h3>

          {pendingPrescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              No pending prescriptions in queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPrescriptions.map(p => {
                const docName = doctors.find(d => d.id === p.assignedDoctorId)?.name || 'Doctor';
                return (
                  <div
                    key={p.id}
                    className="stat-card"
                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--info)', padding: '1rem 1.25rem' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Prescribed by: {docName}
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      Dispense
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispensing panel */}
        <div>
          {!activePatient ? (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
              <Pill size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3>Dispense Medication</h3>
              <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Select a patient from the inbox queue to manage their prescriptions.</p>
            </div>
          ) : (
            <div className="card fade-in">
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Dispensing: {activePatient.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Age: {activePatient.age} Yrs • Diagnosis: <strong>{activePatient.diagnosis}</strong>
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Digital Prescription Details</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                      onClick={() => {
                        onEmailPrescription(activePatient);
                        alert(`Prescription successfully emailed to patient's contact email!`);
                      }}
                    >
                      <Mail size={14} /> Email Prescription
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                      onClick={() => {
                        onPrintPrescription();
                      }}
                    >
                      <Printer size={14} /> Print Prescription
                    </button>
                  </div>
                </div>

                {/* Official Prescription Paper (Adult vs Child Template) */}
                {activePatient?.patientCategory === 'child' || (activePatient?.age && parseInt(activePatient.age) <= 12) ? (
                  <ChildPrescriptionTemplate patient={activePatient} />
                ) : (
                  <PrescriptionTemplate patient={activePatient} />
                )}
              </div>

              {/* ===== Previous Prescriptions Toggle ===== */}
              {activePatient.history && activePatient.history.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPrevRx(!showPrevRx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: showPrevRx ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                      border: '1.5px solid',
                      borderColor: showPrevRx ? 'var(--primary)' : 'var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <History size={16} style={{ color: 'var(--primary)' }} />
                      Previous Prescriptions ({activePatient.history.length} visit{activePatient.history.length > 1 ? 's' : ''})
                    </span>
                    {showPrevRx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showPrevRx && (
                    <div style={{ marginTop: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      {/* Visit tabs */}
                      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                        {activePatient.history.map((h, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedHistIdx(idx)}
                            style={{
                              padding: '0.5rem 1rem',
                              whiteSpace: 'nowrap',
                              fontSize: '0.78rem',
                              fontWeight: selectedHistIdx === idx ? 700 : 400,
                              color: selectedHistIdx === idx ? 'var(--primary)' : 'var(--text-secondary)',
                              background: selectedHistIdx === idx ? 'rgba(99,102,241,0.1)' : 'transparent',
                              border: 'none',
                              borderBottom: selectedHistIdx === idx ? '2px solid var(--primary)' : '2px solid transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {idx === 0 ? '🕐 Latest' : `Visit ${idx + 1}`}
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              {new Date(activePatient.history[idx].date).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Selected visit prescription in letterhead style */}
                      {(() => {
                        const hist = activePatient.history[selectedHistIdx];
                        if (!hist) return null;
                        const prevRx = hist.prescription || [];
                        return (
                          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.98)', color: '#1e293b', fontFamily: 'serif' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #b91c1c' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>PREVIOUS VISIT PRESCRIPTION</div>
                                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.2rem' }}>
                                  Date: {new Date(hist.date).toLocaleString()} &nbsp;|&nbsp; Dr: {hist.doctorName}
                                </div>
                                {hist.diagnosis && (
                                  <div style={{ fontSize: '0.7rem', color: '#0f172a', marginTop: '0.2rem' }}>
                                    <strong>Dx:</strong> {hist.diagnosis}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'right' }}>
                                <div>Status: <strong>{hist.status}</strong></div>
                                <div>Payment: <strong>{hist.paymentStatus}</strong></div>
                                {hist.issuedMedication && <div>Issued: <strong>{hist.issuedMedication}</strong></div>}
                              </div>
                            </div>

                            {/* Rx Symbol + medicines */}
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c', marginBottom: '0.5rem' }}>℞</div>
                            {hist.prescriptionImg ? (
                              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                <img
                                  src={hist.prescriptionImg}
                                  style={{ maxWidth: '100%', maxHeight: '3.5in', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'zoom-in' }}
                                  alt="Previous Prescription Drawing"
                                  onClick={() => setPreviewImage(hist.prescriptionImg)}
                                />
                              </div>
                            ) : prevRx.length === 0 ? (
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                No structured prescription — handwritten sheet used.
                              </div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                                    <th style={{ padding: '0.4rem 0', width: '50%' }}>Medicine</th>
                                    <th style={{ padding: '0.4rem 0', width: '30%' }}>Dosage</th>
                                    <th style={{ padding: '0.4rem 0', textAlign: 'right', width: '20%' }}>Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prevRx.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{m.name}</td>
                                      <td style={{ padding: '0.5rem 0' }}>{m.dosage}</td>
                                      <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{m.duration} Days</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmitIssue}>
                <div className="form-group">
                  <label className="form-label">Issue Medication Duration</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div
                      className={`quick-login-btn ${issueType === 'full' ? 'active' : ''}`}
                      style={{
                        borderColor: issueType === 'full' ? 'var(--primary)' : 'var(--border)',
                        background: issueType === 'full' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setIssueType('full')}
                    >
                      <strong style={{ display: 'block', fontSize: '1rem' }}>Full Duration</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispense complete prescription</span>
                    </div>

                    <div
                      className={`quick-login-btn ${issueType === 'partial' ? 'active' : ''}`}
                      style={{
                        borderColor: issueType === 'partial' ? 'var(--primary)' : 'var(--border)',
                        background: issueType === 'partial' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setIssueType('partial')}
                    >
                      <strong style={{ display: 'block', fontSize: '1rem' }}>Partial Duration</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispense partial dosage / limited days</span>
                    </div>
                  </div>
                </div>

                {issueType === 'partial' && (
                  <div className="form-group fade-in" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <label className="form-label">Enter Duration to Issue (Days)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="range"
                        min="1"
                        max={activePatient.prescription?.[0]?.duration || 30}
                        value={partialDays}
                        onChange={(e) => setPartialDays(parseInt(e.target.value))}
                        style={{ flexGrow: 1, accentColor: 'var(--primary)' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '70px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>{partialDays}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                      Note: The patient will return to the doctor for follow-up review after taking this partial dosage.
                    </span>
                  </div>
                )}

                {/* Injection Prescription Section */}
                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(21, 115, 136, 0.05)', borderRadius: '8px', border: '1px solid rgba(21, 115, 136, 0.15)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={requiresInjection}
                      onChange={(e) => setRequiresInjection(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span>Prescribe Injection for Patient</span>
                  </label>

                  {requiresInjection && (
                    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Injection Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Inj. Ceftriaxone"
                          value={injectionName}
                          onChange={(e) => setInjectionName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Dosage / Frequency</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 1.5g IV Stat"
                          value={injectionDosage}
                          onChange={(e) => setInjectionDosage(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                    <CheckSquare size={16} /> Issue Medicines & Direct to Doctor
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Prescription Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
