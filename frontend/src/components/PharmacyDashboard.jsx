import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pill, Activity, Clock, Award, CheckSquare, ShieldAlert, Printer, Mail, History, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
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
  const [issuedPatientIds, setIssuedPatientIds] = useState([]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState('');

  // Issues state
  const [issueType, setIssueType] = useState('full'); // 'full' or 'partial'
  const [partialDays, setPartialDays] = useState(5);
  const [customMedDays, setCustomMedDays] = useState({}); // { [medIndex]: daysCount }

  // Previous prescriptions panel
  const [showPrevRx, setShowPrevRx] = useState(false);
  const [selectedHistIdx, setSelectedHistIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  // Add Medicine Form state
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1-0-1 - After Food');
  const [newMedDuration, setNewMedDuration] = useState('5');

  // Email modal & toast states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailModalError, setEmailModalError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState(null); // { message, type }

  React.useEffect(() => {
    if (emailToast) {
      const timer = setTimeout(() => setEmailToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [emailToast]);

  const handleEmailPrescriptionClick = async () => {
    if (!activePatient) return;
    const fullPatient = (patients || []).find(p => String(p.id).toUpperCase() === String(activePatient.id).toUpperCase()) || activePatient;
    const existingEmail = (fullPatient.email || activePatient.email || '').trim();

    if (existingEmail) {
      setIsSendingEmail(true);
      try {
        const res = await onEmailPrescription(fullPatient, existingEmail);
        if (res && res.success) {
          setEmailToast({
            type: 'success',
            message: `✓ Digital Prescription emailed successfully to ${existingEmail}!`
          });
        } else {
          setEmailToast({
            type: 'danger',
            message: res?.message || `Failed to send email to ${existingEmail}.`
          });
        }
      } catch (err) {
        setEmailToast({
          type: 'danger',
          message: 'Error sending email. Please check network connection.'
        });
      } finally {
        setIsSendingEmail(false);
      }
    } else {
      // Open in-app modal
      setEmailInput('');
      setEmailModalError('');
      setShowEmailModal(true);
    }
  };

  const handleSendCustomEmailModal = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setEmailModalError('Please enter a valid email address.');
      return;
    }
    const fullPatient = (patients || []).find(p => String(p.id).toUpperCase() === String(activePatient.id).toUpperCase()) || activePatient;
    const targetEmail = emailInput.trim().toLowerCase();

    setIsSendingEmail(true);
    setEmailModalError('');
    try {
      const res = await onEmailPrescription(fullPatient, targetEmail);
      if (res && res.success) {
        setShowEmailModal(false);
        setEmailToast({
          type: 'success',
          message: `✓ Digital Prescription emailed successfully to ${targetEmail}!`
        });
      } else {
        setEmailModalError(res?.message || 'Failed to dispatch email.');
      }
    } catch (err) {
      setEmailModalError('Connection error sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Injection states
  const [requiresInjection, setRequiresInjection] = useState(false);
  const [injections, setInjections] = useState([
    { name: '', dosage: '', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }
  ]);

  React.useEffect(() => {
    setRequiresInjection(false);
    setInjections([
      { name: '', dosage: '', route: 'IM', frequency: 'STAT (Single / Immediate)', isStat: true }
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

  const parseDateClean = (d) => {
    if (!d) return null;
    if (typeof d === 'string' && d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (Number(parts[0]) > 12) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
      }
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const isSameDayStr = (d1, d2) => {
    if (!d1 || !d2) return false;
    if (String(d1).trim() === String(d2).trim()) return true;
    const date1 = parseDateClean(d1);
    const date2 = parseDateClean(d2);
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const pendingPrescriptions = (patients || []).filter(p =>
    p.status !== 'Inactive' &&
    (p.status === 'At Pharmacy' || p.status === 'Pending Pharmacy') &&
    !issuedPatientIds.includes(String(p.id))
  );
  const completedIssues = (patients || []).filter(p =>
    ['Reviewing', 'Completed'].includes(p.status) &&
    (isSameDayStr(p.registrationDate, todayStr) || p.wardBedId || (p.history && p.history.length > 0))
  ).length;

  const docName = activePatient
    ? ((doctors || []).find(d => d.id === activePatient.assignedDoctorId)?.name || 'Doctor')
    : 'Doctor';

  const handleSelectPatient = (patient) => {
    let parsedRx = patient?.prescription;
    if (typeof parsedRx === 'string') {
      try {
        parsedRx = JSON.parse(parsedRx);
      } catch (e) {
        parsedRx = [];
      }
    }
    const safePatient = {
      ...patient,
      prescription: Array.isArray(parsedRx) ? parsedRx : []
    };
    setActivePatient(safePatient);
    setIssueType('full');
    setShowPrevRx(false);
    setSelectedHistIdx(0);
    setShowAddMedForm(false);
    setNewMedName('');
    setNewMedDosage('1-0-1 - After Food');
    setNewMedDuration('5');
    setCustomMedDays({});
    const firstMedDuration = safePatient.prescription?.[0]?.duration || 10;
    setPartialDays(Math.max(1, Math.floor(firstMedDuration / 2)));
  };


  const handleMedicineDaysChange = (idx, newDays, maxDays) => {
    if (newDays === '' || newDays === null) {
      setCustomMedDays(prev => ({
        ...prev,
        [idx]: ''
      }));
      return;
    }
    const val = parseInt(newDays);
    if (isNaN(val)) {
      setCustomMedDays(prev => ({
        ...prev,
        [idx]: ''
      }));
      return;
    }
    const clamped = Math.max(0, Math.min(val, maxDays));
    setCustomMedDays(prev => ({
      ...prev,
      [idx]: clamped === 0 ? '' : clamped
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

  const handleConfirmAddMedicine = () => {
    if (!activePatient) return;
    if (!newMedName.trim()) {
      alert('Please enter medicine or substitute name');
      return;
    }
    const newMed = {
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1-0-1 - After Food',
      duration: parseInt(newMedDuration) || 5
    };
    const updatedRx = [...(activePatient.prescription || []), newMed];
    setActivePatient(prev => ({
      ...prev,
      prescription: updatedRx
    }));
    setNewMedName('');
    setNewMedDosage('1-0-1 - After Food');
    setNewMedDuration('5');
    setShowAddMedForm(false);
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

  const handleSubmitIssue = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activePatient) return;

    const patientIdToIssue = activePatient.id;
    const patientName = activePatient.name;

    let issuedString = 'Full Prescribed Quantity Issued';
    if (issueType === 'partial' && activePatient.prescription) {
      const itemizedParts = activePatient.prescription.map((m, i) => {
        const totalDays = parseInt(m.duration) || 1;
        const customVal = customMedDays[i];
        const rawDays = customVal !== undefined ? customVal : '';
        const issuedDays = rawDays === '' ? 0 : Math.min(parseInt(rawDays) || 0, totalDays);
        const totalQty = calculateTabletQty(m.dosage, totalDays);
        const issuedQty = calculateTabletQty(m.dosage, issuedDays);
        const remQty = totalQty - issuedQty;

        const totalUnitStr = formatMedUnitQty(m, totalQty, totalDays);
        const issuedUnitStr = formatMedUnitQty(m, issuedQty, issuedDays);

        if (issuedDays <= 0) {
          return `${m.name}: Not Dispensed (${totalDays} Days Total)`;
        }
        if (remQty <= 0) {
          return `${m.name}: ${issuedUnitStr} (${issuedDays}/${totalDays} Days - Complete)`;
        }
        return `${m.name}: ${issuedUnitStr} (${issuedDays}/${totalDays} Days Issued) • ${totalDays - issuedDays} Days Remaining`;
      });

      issuedString = `Partial Issue Breakdown: ${itemizedParts.join(' | ')}`;
    }

    const validInjections = requiresInjection
      ? injections.filter(inj => inj.name.trim())
      : null;

    setIsIssuing(true);
    try {
      await onIssueMedication(patientIdToIssue, issuedString, validInjections);
      // Mark this patient as issued so they disappear from pharmacy inbox
      setIssuedPatientIds(prev => [...prev, String(patientIdToIssue)]);
      setActivePatient(null);
      // Show success toast
      setIssueSuccessMsg(`✅ Medicines issued for ${patientName}. Patient directed to Doctor's Follow-Up Review Queue.`);
      setTimeout(() => setIssueSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Issue medication failed:', err);
      alert('Error issuing medication. Please try again.');
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Success Toast Notification */}
      {issueSuccessMsg && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #065f46, #047857)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontSize: '0.9rem',
          fontWeight: 600,
          maxWidth: '420px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease'
        }}>
          {issueSuccessMsg}
        </div>
      )}
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
                <div className="pharmacy-rx-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Digital Prescription Details</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={isSendingEmail}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: isSendingEmail ? 'not-allowed' : 'pointer' }}
                      onClick={handleEmailPrescriptionClick}
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 size={14} className="spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={14} /> Email Prescription
                        </>
                      )}
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
                          <div style={{ padding: '1rem', background: 'var(--bg-card, #111c30)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--primary)' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>PREVIOUS VISIT PRESCRIPTION</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  Date: {new Date(hist.date).toLocaleString()} &nbsp;|&nbsp; Dr: {hist.doctorName}
                                </div>
                                {hist.diagnosis && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                    <strong>Dx:</strong> {hist.diagnosis}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                <div>Status: <strong style={{ color: 'var(--text-primary)' }}>{hist.status}</strong></div>
                                <div>Payment: <strong style={{ color: 'var(--text-primary)' }}>{hist.paymentStatus}</strong></div>
                                {hist.issuedMedication && <div>Issued: <strong style={{ color: 'var(--text-primary)' }}>{hist.issuedMedication}</strong></div>}
                              </div>
                            </div>

                            {/* Rx Symbol + medicines */}
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>℞</div>
                            {hist.prescriptionImg ? (
                              <div style={{ textAlign: 'center', marginTop: '0.5rem', background: '#ffffff', padding: '0.75rem', borderRadius: '8px' }}>
                                <img
                                  src={hist.prescriptionImg}
                                  style={{ maxWidth: '100%', maxHeight: '3.5in', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'zoom-in' }}
                                  alt="Previous Prescription Drawing"
                                  onClick={() => setPreviewImage(hist.prescriptionImg)}
                                />
                              </div>
                            ) : prevRx.length === 0 ? (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                No structured prescription — handwritten sheet used.
                              </div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.4rem 0', width: '50%' }}>Medicine</th>
                                    <th style={{ padding: '0.4rem 0', width: '30%' }}>Dosage</th>
                                    <th style={{ padding: '0.4rem 0', textAlign: 'right', width: '20%' }}>Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prevRx.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                      <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{m.name}</td>
                                      <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>{m.dosage}</td>
                                      <td style={{ padding: '0.5rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{m.duration} Days</td>
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
              {!activePatient.prescriptionImg && activePatient.prescription && activePatient.prescription.length > 0 && !activePatient.prescription.some(m => m.name && (m.name.toLowerCase().includes('handwritten') || m.name.toLowerCase().includes('drawing'))) && (
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
                          const customDaysVal = customMedDays[i];
                          const rawInputValue = customDaysVal !== undefined ? customDaysVal : '';
                          const issuedDays = issueType === 'full' ? totalDays : (rawInputValue === '' ? 0 : Math.min(parseInt(rawInputValue) || 0, totalDays));
                          const issuedQty = issueType === 'full' ? totalQty : calculateTabletQty(m.dosage, issuedDays);
                          const remQty = totalQty - issuedQty;
                          const remDays = totalDays - issuedDays;

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.5rem 0.4rem', fontWeight: 600, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                  {m.name || 'Unnamed Medicine'}
                                </div>
                                {m.dosage && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                                    {m.dosage}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatMedUnitQty(m, totalQty, totalDays)}</span>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({totalDays} Days)</div>
                              </td>
                              <td style={{ padding: '0.45rem 0.2rem', textAlign: 'center' }}>
                                {issueType === 'full' ? (
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--success)' }}>{totalDays} Days (Full)</span>
                                ) : (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', flexWrap: 'nowrap' }}>
                                    <input 
                                      type="number"
                                      className="no-spin"
                                      inputMode="numeric"
                                      min="1"
                                      max={totalDays}
                                      placeholder=""
                                      value={rawInputValue}
                                      onChange={(e) => handleMedicineDaysChange(i, e.target.value, totalDays)}
                                      style={{
                                        width: '48px',
                                        padding: '0.25rem 0.3rem',
                                        borderRadius: '6px',
                                        border: '1.5px solid var(--primary)',
                                        fontWeight: 800,
                                        textAlign: 'center',
                                        fontSize: '0.8rem',
                                        background: 'var(--bg-card, #1e293b)',
                                        color: 'var(--text-primary, #ffffff)',
                                        MozAppearance: 'textfield',
                                        WebkitAppearance: 'none',
                                        appearance: 'textfield'
                                      }}
                                    />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Days</span>
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

                  <div style={{ marginTop: '0.75rem' }}>
                    {showAddMedForm ? (
                      <div style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1.5px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Plus size={14} /> Add Medicine / Substitute
                        </div>
                        <div className="pharmacy-add-med-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              Medicine / Substitute Name *
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Type medicine name (e.g. Zerodol P)"
                              value={newMedName}
                              onChange={(e) => setNewMedName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleConfirmAddMedicine();
                                }
                              }}
                              autoFocus
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              Dosage / Timing
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. 1-0-1 - After Food"
                              value={newMedDosage}
                              onChange={(e) => setNewMedDosage(e.target.value)}
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              Duration (Days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              placeholder="Days"
                              value={newMedDuration}
                              onChange={(e) => setNewMedDuration(e.target.value)}
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                              onClick={handleConfirmAddMedicine}
                            >
                              Add to List
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                              onClick={() => {
                                setShowAddMedForm(false);
                                setNewMedName('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                          onClick={() => setShowAddMedForm(true)}
                        >
                          <Plus size={14} /> Add Medicine / Substitute
                        </button>
                      </div>
                    )}
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
                      onClick={() => {
                        setIssueType('partial');
                        setCustomMedDays({});
                      }}
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
                <div className="form-group pharmacy-inj-container" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(21, 115, 136, 0.05)', borderRadius: '8px', border: '1px solid rgba(21, 115, 136, 0.15)' }}>
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
                        <div key={index} className="pharmacy-inj-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end', background: 'var(--bg-dark)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
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

                <div className="pharmacy-submit-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flexGrow: 1, opacity: isIssuing ? 0.7 : 1 }}
                    onClick={handleSubmitIssue}
                    disabled={isIssuing}
                  >
                    <CheckSquare size={16} />
                    {isIssuing ? 'Issuing Medicines...' : 'Issue Medicines & Direct to Doctor'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)} disabled={isIssuing}>
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
      {/* ===== Floating In-App Toast Notification ===== */}
      {emailToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          background: emailToast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          {emailToast.type === 'success' ? <CheckCircle2 size={18} color="#34d399" /> : <AlertCircle size={18} color="#f87171" />}
          <span>{emailToast.message}</span>
          <button
            type="button"
            onClick={() => setEmailToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              opacity: 0.8,
              padding: 0,
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===== In-App Custom Email Modal (Centered via Portal) ===== */}
      {showEmailModal && activePatient && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          boxSizing: 'border-box'
        }} onClick={() => !isSendingEmail && setShowEmailModal(false)}>
          <div style={{
            background: 'var(--bg-card, #111c30)',
            color: 'var(--text-primary)',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            margin: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card, #111c30)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--primary)',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Email Digital Prescription
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Patient: <strong>{activePatient.name}</strong> (#{activePatient.id})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSendingEmail && setShowEmailModal(false)}
                style={{
                  background: 'rgba(128, 128, 128, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: 'var(--text-primary)',
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

            {/* Modal Body */}
            <form onSubmit={handleSendCustomEmailModal}>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This patient does not have an Email ID registered in their profile. Please enter the recipient's email address below to send the official prescription:
                </p>

                {emailModalError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>{emailModalError}</span>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Recipient Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. patient@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    autoFocus
                    disabled={isSendingEmail}
                    style={{ fontSize: '0.95rem', padding: '0.65rem 0.85rem' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    💡 This email will automatically be saved to the patient's record for future visits.
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEmailModal(false)}
                  disabled={isSendingEmail}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSendingEmail}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 size={16} className="spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} /> Send Email
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PharmacyDashboard;
