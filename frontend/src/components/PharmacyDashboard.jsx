import React, { useState } from 'react';
import { Pill, Activity, Clock, Award, CheckSquare, ShieldAlert } from 'lucide-react';

const PharmacyDashboard = ({ patients, doctors, onIssueMedication }) => {
  const [activePatient, setActivePatient] = useState(null);
  
  // Issues state
  const [issueType, setIssueType] = useState('full'); // 'full' or 'partial'
  const [partialDays, setPartialDays] = useState(5);

  const pendingPrescriptions = patients.filter(p => p.status === 'At Pharmacy');
  const completedIssues = patients.filter(p => ['Reviewing', 'Completed'].includes(p.status)).length;

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setIssueType('full');
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

    onIssueMedication(activePatient.id, issuedString);
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
                <label className="form-label">Digital Prescription Details</label>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {activePatient.prescriptionImg ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={activePatient.prescriptionImg} 
                        style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', background: '#ffffff' }} 
                        alt="Handwritten Prescription Canvas" 
                      />
                    </div>
                  ) : (
                    <table className="custom-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.5rem 0', background: 'transparent' }}>Medicine</th>
                          <th style={{ padding: '0.5rem 0', background: 'transparent' }}>Dosage</th>
                          <th style={{ padding: '0.5rem 0', background: 'transparent', textAlign: 'right' }}>Prescribed Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePatient.prescription?.map((med, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.5rem 0' }}>{med.name}</td>
                            <td style={{ padding: '0.5rem 0' }}>{med.dosage}</td>
                            <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{med.duration} Days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

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
    </div>
  );
};

export default PharmacyDashboard;
