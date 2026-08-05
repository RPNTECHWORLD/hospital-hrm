import React, { useState } from 'react';
import { Pill, Activity, Clock, Award, CheckSquare, ShieldAlert, Printer, Mail, History, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import PrescriptionTemplate from './PrescriptionTemplate';
import ChildPrescriptionTemplate from './ChildPrescriptionTemplate';

const calculateTabletQty = (dosageStr = '', durationDays = 1) => {
  const str = (dosageStr || '').toLowerCase();
  let frequency = 2; // Default 2/day (1-0-1)
  
  const fourPartMatch = str.match(/\b([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\b/);
  if (fourPartMatch) {
    frequency = (parseInt(fourPartMatch[1]) || 0) + (parseInt(fourPartMatch[2]) || 0) + (parseInt(fourPartMatch[3]) || 0) + (parseInt(fourPartMatch[4]) || 0);
  } else {
    const threePartMatch = str.match(/\b([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\b/);
    if (threePartMatch) {
      frequency = (parseInt(threePartMatch[1]) || 0) + (parseInt(threePartMatch[2]) || 0) + (parseInt(threePartMatch[3]) || 0);
    } else if (str.includes('once daily') || str.includes('1-0-0') || str.includes('0-0-1')) {
      frequency = 1;
    } else if (str.includes('thrice daily') || str.includes('1-1-1')) {
      frequency = 3;
    }
  }
  if (frequency <= 0) frequency = 1;
  return frequency * (parseInt(durationDays) || 1);
};

const formatMedUnitQty = (medicine = {}, calculatedQty = 1, days = 1) => {
  const name = (medicine.name || '').toLowerCase();
  const route = (medicine.route || '').toLowerCase();
  const category = (medicine.category || '').toLowerCase();

  const isSyrup = medicine.isSyrup || category === 'syrup' || name.includes('syrup') || name.includes('suspension');
  const isInj = category === 'injection' || name.startsWith('inj') || name.includes('inj.') || route.includes('iv') || route.includes('im');
  const isNeb = category === 'nebulization' || name.includes('respule') || name.includes('nebulizer');
  const isOintment = name.includes('gel') || name.includes('ointment');
  const isDrops = name.includes('drops');
  const isInhaler = name.includes('inhaler');

  if (isSyrup) {
    const bottleMatch = medicine.name.match(/\b\d+\s*ml\b/i)?.[0];
    const bottles = days > 10 ? Math.ceil(days / 10) : 1;
    return `${bottles} Bottle${bottles > 1 ? 's' : ''}${bottleMatch ? ` (${bottleMatch})` : ''}`;
  }

  if (isInj) {
    const doseMatch = medicine.name.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|ml)\b/i)?.[0];
    const routeText = route ? route.toUpperCase() : (name.includes('iv') ? 'IV' : name.includes('im') ? 'IM' : 'IV/IM');
    const count = Math.max(1, parseInt(days) || 1);
    return `${count} Vial/Amp${doseMatch ? ` (${doseMatch} ${routeText})` : ` (${routeText})`}`;
  }

  if (isNeb) {
    const respules = calculatedQty || (days * 2);
    return `${respules} Respule${respules > 1 ? 's' : ''}`;
  }

  if (isOintment) return `1 Tube`;
  if (isDrops) return `1 Bottle (Drops)`;
  if (isInhaler) return `1 Inhaler`;

  return `${calculatedQty} Tabs`;
};

const PharmacyDashboard = ({ patients = [], doctors = [], onIssueMedication, onPrintPrescription, onEmailPrescription }) => {
  const [activePatient, setActivePatient] = useState(null);

  // Issues state
  const [issueType, setIssueType] = useState('full'); // 'full' or 'partial'
  const [partialDays, setPartialDays] = useState(5);
  const [customMedDays, setCustomMedDays] = useState({}); // { [medIndex]: daysCount }

  // Previous prescriptions panel
  const [showPrevRx, setShowPrevRx] = useState(false);
  const [selectedHistIdx, setSelectedHistIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  // Injection states
  const [requiresInjection, setRequiresInjection] = useState(false);
  const [injections, setInjections] = useState([
    { name: 'Inj. Ceftriaxone', dosage: '1.5g', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }
  ]);

  React.useEffect(() => {
    setRequiresInjection(false);
    setInjections([
      { name: 'Inj. Ceftriaxone', dosage: '1.5g', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }
    ]);
  }, [activePatient]);

  const handleAddInjectionRow = () => {
    setInjections(prev => [...prev, { name: '', dosage: '', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }]);
  };

  const handleRemoveInjectionRow = (index) => {
    setInjections(prev => {
      if (prev.length === 1) {
        return [{ name: '', dosage: '', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleInjectionChange = (index, field, value) => {
    setInjections(prev => {
      const updated = [...prev];
      if (typeof field === 'object') {
        updated[index] = { ...updated[index], ...field };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const pendingPrescriptions = (patients || []).filter(p =>
    (p.status === 'At Pharmacy' || p.status === 'Pending Pharmacy') &&
    (p.registrationDate === todayStr || p.wardBedId)
  );
  const completedIssues = (patients || []).filter(p =>
    ['Reviewing', 'Completed'].includes(p.status) &&
    (p.registrationDate === todayStr || p.wardBedId)
  ).length;

  const docName = activePatient
    ? ((doctors || []).find(d => d.id === activePatient.assignedDoctorId)?.name || 'Doctor')
    : 'Doctor';

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setIssueType('full');
    setShowPrevRx(false);
    setSelectedHistIdx(0);
    const initialDaysMap = {};
    if (patient.prescription && patient.prescription.length > 0) {
      patient.prescription.forEach((m, idx) => {
        initialDaysMap[idx] = parseInt(m.duration) || 10;
      });
    }
    setCustomMedDays(initialDaysMap);
    const firstMedDuration = patient.prescription?.[0]?.duration || 10;
    setPartialDays(Math.max(1, Math.floor(firstMedDuration / 2)));
  };

  const handleMedicineDaysChange = (idx, newDays, maxDays) => {
    const parsed = Math.max(1, Math.min(parseInt(newDays) || 1, maxDays));
    setCustomMedDays(prev => ({
      ...prev,
      [idx]: parsed
    }));
  };

  const handlePharmacyDeleteMed = (indexToDelete) => {
    if (!activePatient || !activePatient.prescription) return;
    const updatedRx = activePatient.prescription.filter((_, i) => i !== indexToDelete);
    setActivePatient(prev => ({
      ...prev,
      prescription: updatedRx
    }));
  };

  const handlePharmacyAddMed = () => {
    if (!activePatient) return;
    const newMed = { name: 'New Medicine / Substitute', dosage: '1-0-1 - After Food', duration: 5 };
    const updatedRx = [...(activePatient.prescription || []), newMed];
    setActivePatient(prev => ({
      ...prev,
      prescription: updatedRx
    }));
  };

  const handlePharmacyMedChange = (index, field, value) => {
    if (!activePatient || !activePatient.prescription) return;
    const updatedRx = activePatient.prescription.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setActivePatient(prev => ({
      ...prev,
      prescription: updatedRx
    }));
  };

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    if (!activePatient) return;

    let issuedString = 'Full Prescribed Quantity Issued';
    if (issueType === 'partial' && activePatient.prescription) {
      const itemizedParts = activePatient.prescription.map((m, i) => {
        const totalDays = parseInt(m.duration) || 1;
        const issuedDays = Math.min(customMedDays[i] ?? totalDays, totalDays);
        const totalQty = calculateTabletQty(m.dosage, totalDays);
        const issuedQty = calculateTabletQty(m.dosage, issuedDays);
        const remQty = totalQty - issuedQty;

        const totalUnitStr = formatMedUnitQty(m, totalQty, totalDays);
        const issuedUnitStr = formatMedUnitQty(m, issuedQty, issuedDays);

        if (remQty <= 0) {
          return `${m.name}: ${issuedUnitStr} (${issuedDays}/${totalDays} Days - Complete)`;
        }
        return `${m.name}: ${issuedUnitStr} (${issuedDays}/${totalDays} Days) • Pending`;
      });

      issuedString = `Partial Issue Breakdown: ${itemizedParts.join(' | ')}`;
    }

    const validInjections = requiresInjection
      ? injections.filter(inj => inj.name.trim())
      : null;

    onIssueMedication(activePatient.id, issuedString, validInjections);
    setActivePatient(null);
  };

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card pharmacy-stat-pending">
          <div className="stat-icon primary">
            <Pill size={24} />
          </div>
          <div>
            <div className="stat-value">{pendingPrescriptions.length}</div>
            <div className="stat-label">Pending Prescriptions</div>
          </div>
        </div>

        <div className="stat-card pharmacy-stat-dispensed">
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
        <div className="card pharmacy-inbox-card">
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
                    className="stat-card pharmacy-inbox-item"
                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--info)', padding: '1rem 1.25rem' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Prescribed by: {docName}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-pharmacy-dispense" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
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
            <div className="card pharmacy-preview-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
              <Pill size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3>Dispense Medication</h3>
              <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Select a patient from the inbox queue to manage their prescriptions.</p>
            </div>
          ) : (
            <div className="card pharmacy-preview-card fade-in">
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
              {/* Live Prescribed vs Issued Quantity Breakdown Card */}
              {activePatient.prescription && activePatient.prescription.length > 0 && (
                <div style={{
                  background: 'rgba(21, 115, 136, 0.05)',
                  border: '1.5px solid rgba(21, 115, 136, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.65rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Prescribed Quantity vs Issued Quantity Breakdown</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: issueType === 'full' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: issueType === 'full' ? 'var(--success)' : 'var(--warning)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      border: issueType === 'full' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {issueType === 'full' ? 'Full Dispense' : 'Partial Dispense'}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '0.75rem', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.4rem 0.2rem', width: '24%' }}>Medicine Name</th>
                          <th style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '16%' }}>Doctor Prescribed</th>
                          <th style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '16%' }}>Issuing Duration</th>
                          <th style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '16%' }}>Issuing Now</th>
                          <th style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '18%' }}>Remaining Pending</th>
                          <th style={{ padding: '0.4rem 0.2rem 0.4rem 0.5rem', textAlign: 'center', width: '10%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePatient.prescription.map((m, i) => {
                          const totalDays = parseInt(m.duration) || 1;
                          const totalQty = calculateTabletQty(m.dosage, totalDays);
                          const selectedDays = customMedDays[i] !== undefined ? customMedDays[i] : (issueType === 'full' ? totalDays : Math.min(partialDays, totalDays));
                          const issuedDays = issueType === 'full' ? totalDays : Math.min(selectedDays, totalDays);
                          const issuedQty = issueType === 'full' ? totalQty : calculateTabletQty(m.dosage, issuedDays);
                          const remQty = totalQty - issuedQty;
                          const remDays = totalDays - issuedDays;

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.45rem 0.2rem', fontWeight: 600, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                <input 
                                  type="text" 
                                  value={m.name} 
                                  onChange={(e) => handlePharmacyMedChange(i, 'name', e.target.value)}
                                  style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.76rem',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatMedUnitQty(m, totalQty, totalDays)}</span>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({totalDays} Days)</div>
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                {issueType === 'full' ? (
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--success)' }}>{totalDays} Days (Full)</span>
                                ) : (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', flexWrap: 'nowrap' }}>
                                    <input 
                                      type="number"
                                      min="1"
                                      max={totalDays}
                                      value={issuedDays}
                                      onChange={(e) => handleMedicineDaysChange(i, e.target.value, totalDays)}
                                      style={{
                                        width: '42px',
                                        padding: '0.15rem 0.2rem',
                                        borderRadius: '4px',
                                        border: '1.5px solid var(--primary)',
                                        fontWeight: 800,
                                        textAlign: 'center',
                                        fontSize: '0.76rem',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)'
                                      }}
                                    />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Days</span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center', color: 'var(--primary)' }}>
                                <span style={{ fontWeight: 800 }}>{formatMedUnitQty(m, issuedQty, issuedDays)}</span>
                                <div style={{ fontSize: '0.68rem', fontWeight: 600 }}>({issuedDays} Days)</div>
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                {remQty > 0 ? (
                                  <div>
                                    <span style={{ fontWeight: 800, color: 'var(--warning)', fontSize: '0.74rem' }}>
                                      {m.isSyrup || (m.name || '').toLowerCase().includes('syrup') ? '1 Bottle Pending' : (m.name || '').toLowerCase().includes('inj') ? `${remDays} Vials Pending` : `${remQty} Tabs`}
                                    </span>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--warning)' }}>({remDays} Days)</div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.74rem' }}>0 (Completed)</span>
                                )}
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem 0.45rem 0.5rem', textAlign: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handlePharmacyDeleteMed(i)}
                                  title="Delete Medicine from Prescription"
                                  style={{
                                    background: 'rgba(225, 29, 72, 0.08)',
                                    border: '1px solid rgba(225, 29, 72, 0.2)',
                                    color: 'var(--danger)',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.4rem',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        borderColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      onClick={handlePharmacyAddMed}
                    >
                      <Plus size={14} /> Add Medicine / Substitute
                    </button>
                  </div>
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
                    <div className="fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {injections.map((inj, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end', background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                              Injection Name {injections.length > 1 ? `#${index + 1}` : ''}
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Inj. Ceftriaxone"
                              value={inj.name}
                              onChange={(e) => handleInjectionChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Dose</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. 1.5g"
                              value={inj.dosage}
                              onChange={(e) => handleInjectionChange(index, 'dosage', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Route</label>
                            <select
                              className="form-input"
                              value={inj.route || 'IM'}
                              onChange={(e) => handleInjectionChange(index, 'route', e.target.value)}
                            >
                              <option value="IM">IM</option>
                              <option value="IV">IV</option>

                            </select>
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Frequency / STAT</label>
                            <select
                              className="form-input"
                              value={inj.frequency || 'STAT (Single / Immediate)'}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleInjectionChange(index, {
                                  frequency: val,
                                  isStat: val.includes('STAT')
                                });
                              }}
                            >
                              <option value="STAT (Single / Immediate)">STAT (Single / Immediate)</option>
                              <option value="NORMAL">NORMAL</option>

                            </select>
                          </div>
                          <div>
                            {injections.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleRemoveInjectionRow(index)}
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.4rem', height: '36px' }}
                                title="Remove Injection"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleAddInjectionRow}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            padding: '0.4rem 0.85rem',
                            borderColor: 'var(--primary)',
                            color: 'var(--primary)',
                            background: 'rgba(21, 115, 136, 0.05)',
                            fontWeight: 600
                          }}
                        >
                          <Plus size={16} /> Add Another Injection
                        </button>
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
