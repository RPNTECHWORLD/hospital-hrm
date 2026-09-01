import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserPlus, UserCheck, Clipboard, Plus, Trash2, CheckCircle2, AlertCircle, FileText, Send, Printer, Mail, History, Check, Syringe, Bed, ExternalLink, FlaskConical, Microscope, LogOut, Pill } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import PrescriptionTemplate from './PrescriptionTemplate';
import ChildPrescriptionTemplate from './ChildPrescriptionTemplate';
import ConfirmModal from './ConfirmModal';
import { printPrescriptionDirectly } from '../utils/printHelper';

const API_BASE = import.meta.env.VITE_API_URL || '';

const parseDosageToSchedule = (dosageStr = '') => {
  const str = (dosageStr || '').toLowerCase();
  
  let timing = '';
  if (str.includes('before food') || str.includes('empty stomach')) timing = 'Before Food';
  else if (str.includes('after food') || str.includes('after lunch') || str.includes('after meals')) timing = 'After Food';
  else if (str.includes('with food')) timing = 'With Food';
  else if (str.includes('sos') || str.includes('as needed')) timing = 'SOS';

  let morning = false;
  let afternoon = false;
  let evening = false;
  let night = false;

  const fourPartMatch = str.match(/\b([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\b/);
  if (fourPartMatch) {
    morning = fourPartMatch[1] !== '0';
    afternoon = fourPartMatch[2] !== '0';
    evening = fourPartMatch[3] !== '0';
    night = fourPartMatch[4] !== '0';
  } else {
    const threePartMatch = str.match(/\b([0-9])\s*[-:]\s*([0-9])\s*[-:]\s*([0-9])\b/);
    if (threePartMatch) {
      morning = threePartMatch[1] !== '0';
      afternoon = threePartMatch[2] !== '0';
      night = threePartMatch[3] !== '0';
    } else {
      if (str.includes('morning')) morning = true;
      if (str.includes('afternoon') || str.includes('lunch')) afternoon = true;
      if (str.includes('evening')) evening = true;
      if (str.includes('night') || str.includes('bedtime')) night = true;
      if (str.includes('thrice daily') || str.includes('tds') || str.includes('tid')) {
        morning = true; afternoon = true; night = true;
      } else if (str.includes('twice daily') || str.includes('bd') || str.includes('bid')) {
        morning = true; night = true;
      } else if (str.includes('once daily') || str.includes('od')) {
        if (!morning && !afternoon && !evening && !night) morning = true;
      }
    }
  }

  return { morning, afternoon, evening, night, timing };
};

const formatScheduleToDosage = (m, a, e, n, timing) => {
  const mVal = m ? '1' : '0';
  const aVal = a ? '1' : '0';
  const eVal = e ? '1' : '0';
  const nVal = n ? '1' : '0';

  let code = '';
  if (e) {
    code = `${mVal}-${aVal}-${eVal}-${nVal}`;
  } else {
    code = `${mVal}-${aVal}-${nVal}`;
  }

  const activeTimes = [];
  if (m) activeTimes.push('Morning');
  if (a) activeTimes.push('Afternoon');
  if (e) activeTimes.push('Evening');
  if (n) activeTimes.push('Night');

  let timeStr = activeTimes.length > 0 ? activeTimes.join(', ') : 'No Schedule';

  let result = `${code} (${timeStr})`;
  if (timing) {
    result += ` - ${timing}`;
  }
  return result;
};

const MedicineInputRow = ({ med, idx, onChange, onRemove, canRemove }) => {
  const currentSchedule = React.useMemo(() => {
    if (med.schedule) return med.schedule;
    return parseDosageToSchedule(med.dosage || '');
  }, [med.dosage, med.schedule]);

  const handleInputChange = (e) => {
    onChange(idx, 'name', e.target.value);
  };

  const handleToggleSchedule = (slot) => {
    const updated = {
      ...currentSchedule,
      [slot]: !currentSchedule[slot]
    };
    const newDosageStr = formatScheduleToDosage(
      updated.morning,
      updated.afternoon,
      updated.evening,
      updated.night,
      updated.timing
    );
    onChange(idx, {
      dosage: newDosageStr,
      schedule: updated
    });
  };

  const handleSelectTiming = (tVal) => {
    const newTiming = currentSchedule.timing === tVal ? '' : tVal;
    const updated = { ...currentSchedule, timing: newTiming };
    const newDosageStr = formatScheduleToDosage(
      updated.morning,
      updated.afternoon,
      updated.evening,
      updated.night,
      updated.timing
    );
    onChange(idx, {
      dosage: newDosageStr,
      schedule: updated
    });
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.85rem 1rem',
      marginBottom: '1rem',
      position: 'relative'
    }}>
      {/* Primary Row: Name, Dosage / Injection inputs, Duration, Trash */}
      {med.category === 'injection' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(90px, 1fr) minmax(80px, 1fr) minmax(130px, 1.2fr) minmax(70px, 0.8fr) auto',
          gap: '0.5rem',
          alignItems: 'center',
          position: 'relative',
          overflow: 'visible'
        }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              top: '-18px',
              left: '2px',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#e11d48',
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid currentColor',
              padding: '0.05rem 0.4rem',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              INJECTION
            </span>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Injection Name (e.g. Inj. Ceftriaxone)"
              value={med.name}
              onChange={handleInputChange}
              required
              autoComplete="off"
            />
          </div>

          <input 
            type="text" 
            className="form-input" 
            placeholder="Dose (e.g. 1.5g / 40mg)"
            value={med.injDose !== undefined ? med.injDose : (med.dosage ? (med.dosage.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|i\.?u\.?)\b/i)?.[0] || med.dosage.split(' ')[0]) : '')}
            onChange={(e) => {
              const newDose = e.target.value;
              const route = med.route || 'IV';
              const freq = med.frequency || 'STAT (Single / Immediate)';
              onChange(idx, {
                injDose: newDose,
                dosage: `${newDose} ${route} ${freq.includes('STAT') ? 'Stat' : freq}`.trim()
              });
            }}
            required
          />

          <select
            className="form-input"
            value={med.route || 'IV'}
            onChange={(e) => {
              const newRoute = e.target.value;
              const dose = med.injDose !== undefined ? med.injDose : (med.dosage ? (med.dosage.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|i\.?u\.?)\b/i)?.[0] || med.dosage.split(' ')[0]) : '');
              const freq = med.frequency || 'STAT (Single / Immediate)';
              onChange(idx, {
                route: newRoute,
                dosage: `${dose} ${newRoute} ${freq.includes('STAT') ? 'Stat' : freq}`.trim()
              });
            }}
          >
            <option value="IV">IV</option>
            <option value="IM">IM</option>
          </select>

          <select
            className="form-input"
            value={med.frequency || 'STAT (Single / Immediate)'}
            onChange={(e) => {
              const newFreq = e.target.value;
              const dose = med.injDose !== undefined ? med.injDose : (med.dosage ? (med.dosage.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|i\.?u\.?)\b/i)?.[0] || med.dosage.split(' ')[0]) : '');
              const route = med.route || 'IV';
              onChange(idx, {
                frequency: newFreq,
                dosage: `${dose} ${route} ${newFreq.includes('STAT') ? 'Stat' : newFreq}`.trim()
              });
            }}
          >
            <option value="STAT (Single / Immediate)">STAT (Single / Immediate)</option>
            <option value="NORMAL">NORMAL</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input 
              type="number" 
              className="form-input" 
              style={{ paddingRight: '0.3rem' }}
              value={med.duration || 1}
              onChange={(e) => onChange(idx, 'duration', parseInt(e.target.value) || 1)}
              required
              min="1"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days</span>
          </div>

          <button 
            type="button" 
            className="btn-logout" 
            onClick={() => onRemove(idx)}
            style={{ margin: '0 auto', color: '#ef4444', cursor: 'pointer' }}
            title="Remove Medicine"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ) : (
        <div className="medicine-row-grid" style={{ overflow: 'visible', position: 'relative', marginBottom: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            {med.category && (
              <span style={{
                position: 'absolute',
                top: '-18px',
                left: '2px',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: med.category === 'nebulization' ? '#9333ea' : med.category === 'others' ? '#d97706' : med.category === 'syrup' ? '#0f766e' : 'var(--primary)',
                background: med.category === 'nebulization' ? 'rgba(147, 51, 234, 0.12)' : med.category === 'others' ? 'rgba(245, 158, 11, 0.12)' : med.category === 'syrup' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                border: '1px solid currentColor',
                padding: '0.05rem 0.4rem',
                borderRadius: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {med.category}
              </span>
            )}
            <input 
              type="text" 
              className="form-input" 
              placeholder={med.isSyrup ? "Syrup Name (e.g. Benadryl 100ml)" : "Medicine Name (e.g. Paracetamol)"}
              value={med.name}
              onChange={handleInputChange}
              required
              autoComplete="off"
            />
          </div>

          <input 
            type="text" 
            className="form-input" 
            placeholder={med.isSyrup ? "Dosage (e.g. 5ml - 1-0-1 - After Food)" : "Dosage (e.g. 1-0-1 - After Food)"}
            value={med.dosage}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = parseDosageToSchedule(val);
              onChange(idx, { dosage: val, schedule: parsed });
            }}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="number" 
              className="form-input" 
              style={{ paddingRight: '0.5rem' }}
              value={med.duration}
              onChange={(e) => onChange(idx, 'duration', parseInt(e.target.value) || 1)}
              required
              min="1"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days</span>
          </div>

          <button 
            type="button" 
            className="btn-logout" 
            onClick={() => onRemove(idx)}
            style={{ margin: '0 auto', color: '#ef4444', cursor: 'pointer' }}
            title="Remove Medicine"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* Schedule & Timing Selector Bar (Only for non-injection medicines) */}
      {med.category !== 'injection' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px dashed rgba(0, 0, 0, 0.08)',
          fontSize: '0.78rem'
        }}>
          {/* Morning, Afternoon, Evening, Night Schedule Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.2rem' }}>Schedule:</span>
            
            <button
              type="button"
              onClick={() => handleToggleSchedule('morning')}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: currentSchedule.morning ? '1px solid var(--primary, #157388)' : '1px solid var(--border)',
                background: currentSchedule.morning ? 'rgba(21, 115, 136, 0.18)' : 'rgba(0, 0, 0, 0.02)',
                color: currentSchedule.morning ? 'var(--primary, #157388)' : 'var(--text-secondary)',
                fontWeight: currentSchedule.morning ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              Morning
            </button>

            <button
              type="button"
              onClick={() => handleToggleSchedule('afternoon')}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: currentSchedule.afternoon ? '1px solid #f59e0b' : '1px solid var(--border)',
                background: currentSchedule.afternoon ? 'rgba(245, 158, 11, 0.18)' : 'rgba(0, 0, 0, 0.02)',
                color: currentSchedule.afternoon ? '#f59e0b' : 'var(--text-secondary)',
                fontWeight: currentSchedule.afternoon ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              Afternoon
            </button>

            <button
              type="button"
              onClick={() => handleToggleSchedule('evening')}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: currentSchedule.evening ? '1px solid #8b5cf6' : '1px solid var(--border)',
                background: currentSchedule.evening ? 'rgba(139, 92, 246, 0.18)' : 'rgba(0, 0, 0, 0.02)',
                color: currentSchedule.evening ? '#a855f7' : 'var(--text-secondary)',
                fontWeight: currentSchedule.evening ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              Evening
            </button>

            <button
              type="button"
              onClick={() => handleToggleSchedule('night')}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: currentSchedule.night ? '1px solid #3b82f6' : '1px solid var(--border)',
                background: currentSchedule.night ? 'rgba(59, 130, 246, 0.18)' : 'rgba(0, 0, 0, 0.02)',
                color: currentSchedule.night ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: currentSchedule.night ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              Night
            </button>
          </div>

          {/* Meal Timing Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.2rem' }}>Meal:</span>
            {[
              { label: 'After Food' },
              { label: 'Before Food' },
              { label: 'With Food' },
              { label: 'SOS' }
            ].map(t => {
              const isSelected = currentSchedule.timing === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleSelectTiming(t.label)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--success, #10b981)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--success, #10b981)' : 'var(--text-muted)',
                    fontWeight: isSelected ? 700 : 400,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Syrup Volume Quick-Select Chips (if Syrup mode) */}
          {med.isSyrup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', width: '100%', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <span style={{ color: '#0f766e', fontWeight: 700, marginRight: '0.2rem' }}>Vol (ml):</span>
              {['2.5ml', '5ml', '7.5ml', '10ml', '15ml'].map(vol => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => {
                    let current = med.dosage || '';
                    if (/\b\d+(?:\.\d+)?\s*ml\b/i.test(current)) {
                      current = current.replace(/\b\d+(?:\.\d+)?\s*ml\b/i, vol);
                    } else {
                      current = `${vol} ${current}`.trim();
                    }
                    const parsed = parseDosageToSchedule(current);
                    onChange(idx, { dosage: current, schedule: parsed });
                  }}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    border: (med.dosage || '').includes(vol) ? '1px solid #0f766e' : '1px solid var(--border)',
                    background: (med.dosage || '').includes(vol) ? 'rgba(15, 118, 110, 0.15)' : 'transparent',
                    color: (med.dosage || '').includes(vol) ? '#0f766e' : 'var(--text-secondary)',
                    fontWeight: (med.dosage || '').includes(vol) ? 700 : 500,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  {vol}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DoctorDashboard = ({ patients, doctors = [], doctorEmail, userRole, onSubmitPrescription, onSubmitReview, onStartConsultation, onUpdatePatientStatus, onPrintPrescription, onEmailPrescription, onAdmitToWard, onDischargePatient, onReassignDoctor, onAcceptReassignment, onDeclineReassignment }) => {
  const [activePatient, setActivePatient] = useState(null);
  const [reassignModalPatient, setReassignModalPatient] = useState(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [expandHistory, setExpandHistory] = useState(false);
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [isHistoryPreview, setIsHistoryPreview] = useState(false);
  const [padDesignMode, setPadDesignMode] = useState('auto');
  const [toast, setToast] = useState(null);
  const [isSendingPrescription, setIsSendingPrescription] = useState(false);
  const [reviewMode, setReviewMode] = useState(null); // 'lab' | 'pharmacy' | null
  const [showClearInvestigationConfirm, setShowClearInvestigationConfirm] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

  const handleReassignPatient = async (patient, targetDocId, reasonInput = '') => {
    if (!targetDocId || isSameId(targetDocId, patient.assignedDoctorId)) return;
    const targetDoc = doctors.find(d => isSameId(d.id, targetDocId));
    const targetDocName = targetDoc ? targetDoc.name : 'Selected Doctor';

    const prevDoc = doctors.find(d => isSameId(d.id, patient.assignedDoctorId));
    const prevDocName = prevDoc ? prevDoc.name : 'Dr. Sarah';

    const currentUser = (doctors && doctors.find(d => d.email && d.email.toLowerCase() === (doctorEmail || '').toLowerCase())) || {};
    const changedByName = currentUser.name || (userRole === 'admin' ? 'System Admin' : prevDocName);

    let success = false;
    if (onReassignDoctor) {
      success = await onReassignDoctor(patient.id, targetDocId, {
        reason: reasonInput || reassignReason || '',
        changedBy: changedByName
      });
    }

    if (!success) {
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
        const fullDateTime = `${dateStr}, ${timeStr}`;

        const pendingRequestData = {
          fromDoctorId: patient.assignedDoctorId,
          fromDoctorName: prevDocName,
          targetDoctorId: parseInt(targetDocId),
          targetDoctorName: targetDocName,
          reason: reasonInput || reassignReason || 'Reassigned from consultation desk',
          requestedAt: fullDateTime
        };

        const targetApiId = String(patient.id).replace(/#/g, '').trim();
        const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pendingReassignment: pendingRequestData
          })
        });
        if (response.ok) success = true;
      } catch (err) {
        console.error("Fallback error reassigning patient:", err);
      }
    }

    if (success) {
      showToast(`Reassignment request sent to ${targetDocName} for approval!`, 'info');
      if (activePatient && isSameId(activePatient.id, patient.id)) {
        setActivePatient(null);
      }
    } else {
      alert("Failed to send reassignment request. Please try again.");
    }
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
  const [allLabLogs, setAllLabLogs] = useState([]);
  const [previewLabImage, setPreviewLabImage] = useState(null);
  const [showAllLabLogsModal, setShowAllLabLogsModal] = useState(false);
  const [orderTestName, setOrderTestName] = useState('');
  const [labOrderError, setLabOrderError] = useState('');
  const [labOrderSuccess, setLabOrderSuccess] = useState('');
  const [recommendAdmission, setRecommendAdmission] = useState(false);
  const [targetBedId, setTargetBedId] = useState('');
  const [sharePatient, setSharePatient] = useState(null);
  const [previousStateBeforeEdit, setPreviousStateBeforeEdit] = useState(null);

  const handleCancelConsultation = () => {
    if (previousStateBeforeEdit) {
      setActivePatient(previousStateBeforeEdit.activePatient);
      if (previousStateBeforeEdit.activePatient) {
        setDiagnosis(previousStateBeforeEdit.diagnosis || '');
        setMedicines(previousStateBeforeEdit.medicines || [{ name: '', dosage: '', duration: 10 }]);
        setComplaints(previousStateBeforeEdit.complaints || '');
        setPastHistory(previousStateBeforeEdit.pastHistory || '');
        setExamination(previousStateBeforeEdit.examination || '');
        setInvestigation(previousStateBeforeEdit.investigation || '');
        setFollowUpNotes(previousStateBeforeEdit.followUpNotes || '');
        setNextVisitDate(previousStateBeforeEdit.nextVisitDate || '');
        setPrescriptionMode(previousStateBeforeEdit.prescriptionMode || 'form');
        setCanvasDataUrl(previousStateBeforeEdit.canvasDataUrl || null);
      }
      if (previousStateBeforeEdit.showAllHistoryModal) {
        setShowAllHistoryModal(true);
      }
      setPreviousStateBeforeEdit(null);
    } else {
      setActivePatient(null);
    }
    setReviewMode(null);
  };

  const handleBottomAdmitClick = () => {
    const livePat = (patients && activePatient) ? (patients.find(p => isSameId(p.id, activePatient.id)) || activePatient) : activePatient;
    const currentBed = livePat?.wardBedId || activePatient?.wardBedId;

    if (currentBed) {
      showToast(`Patient ${livePat?.name || activePatient?.name} is already admitted to Room ${currentBed.slice(0, 3)} - Bed ${currentBed.slice(3)}!`, 'warning');
      return;
    }
    if (recommendAdmission && targetBedId) {
      showToast(`Patient ${livePat?.name || activePatient?.name} is already scheduled for admission to Room ${targetBedId.slice(0, 3)} - Bed ${targetBedId.slice(3)} in this form!`, 'warning');
      return;
    }
    if (onAdmitToWard) {
      onAdmitToWard(livePat || activePatient);
    }
  };

  const handleDoctorDischargeFromWard = async () => {
    const livePat = (patients && activePatient) ? (patients.find(p => isSameId(p.id, activePatient.id)) || activePatient) : activePatient;
    if (!livePat) return;

    const patientName = livePat.name || 'Patient';
    const bedId = livePat.wardBedId || activePatient?.wardBedId;

    try {
      if (onDischargePatient) {
        await onDischargePatient(livePat.id);
      } else {
        const cleanId = String(livePat.id).replace(/#/g, '').trim();
        await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wardBedId: null, bedAdmissionPending: 0 })
        });
      }
      setActivePatient(prev => prev ? { ...prev, wardBedId: null, bedAdmissionPending: 0 } : null);
      showToast(`Patient ${patientName} successfully discharged from Ward (Bed ${bedId})! 🚪`, 'success');
    } catch (err) {
      console.error("Failed to discharge patient from ward:", err);
      showToast('Error discharging patient from ward.', 'danger');
    }
  };

  // Synchronize activePatient with live patients prop whenever a bed is assigned
  useEffect(() => {
    if (activePatient && patients && patients.length > 0) {
      const freshPat = patients.find(p => isSameId(p.id, activePatient.id));
      if (freshPat && (freshPat.wardBedId !== activePatient.wardBedId || freshPat.bedAdmissionPending !== activePatient.bedAdmissionPending || freshPat.status !== activePatient.status)) {
        setActivePatient(prev => ({ ...prev, ...freshPat }));
      }
    }
  }, [patients]);

  // Continuous live polling for all lab logs so delivered lab reports appear instantly
  useEffect(() => {
    const fetchAllLabLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lab`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllLabLogs(data);
            if (activePatient) {
              const patLabs = data.filter(log => String(log.patientId).toUpperCase() === String(activePatient.id).toUpperCase());
              setPatientLabLogs(patLabs);
            }
          }
        }
      } catch (err) {
        console.error("Error polling lab logs in doctor console:", err);
      }
    };

    fetchAllLabLogs();
  }, [activePatient]);

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
      fetchPatientInjections();
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
    setLabOrderError('');
    setLabOrderSuccess('');

    if (!orderTestName.trim()) {
      setLabOrderError('Please enter a test name first (e.g. CBC Blood Test, X-Ray, ECG).');
      return;
    }

    const cleanTest = orderTestName.trim().toUpperCase();
    const isDuplicate = patientLabLogs.some(
      log => String(log.testName).trim().toUpperCase() === cleanTest &&
             (log.status === 'Ordered' || log.status === 'Sample Collected')
    );

    if (isDuplicate) {
      setLabOrderError(`Lab Test "${orderTestName.trim()}" is already ordered/pending for this patient! Duplicate requests are not allowed.`);
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
        setLabOrderSuccess(`✓ Lab Test "${orderTestName.trim()}" ordered successfully and sent to Laboratory queue!`);
        setOrderTestName('');
        const res = await fetch(`${API_BASE}/api/lab`);
        if (res.ok) {
          const data = await res.json();
          const patLabs = data.filter(log => String(log.patientId).toUpperCase() === String(activePatient.id).toUpperCase());
          setPatientLabLogs(patLabs);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setLabOrderError(errData.message || 'Failed to order lab test.');
      }
    } catch (err) {
      console.error("Failed to order lab test:", err);
      setLabOrderError('Network error ordering lab test. Please try again.');
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

  const activeDoctor = (doctors && doctors.find(d => Number(d.id) === Number(selectedDoctorId) || String(d.id) === String(selectedDoctorId))) ||
                       (doctors && doctors.find(d => d.email && d.email.toLowerCase() === (doctorEmail || '').toLowerCase())) ||
                       doctors[0] ||
                       { id: 1, name: 'Dr. Vijayan', specialty: 'General Medicine' };

  const doctorId = activeDoctor.id;
  const doctorName = activeDoctor.name;

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

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

  // Filter active doctors who have logged in today with user ID & password (same concept as Receptionist)
  const availableDoctors = (doctors || []).filter(doc => isSameDayStr(doc.lastLoginDate, todayStr));

  const hasDeliveredLab = (patientId) => {
    if (!patientId) return false;
    const pIdStr = String(patientId).replace(/#/g, '').trim().toUpperCase();
    return allLabLogs.some(l => {
      const matchId = String(l.patientId).replace(/#/g, '').trim().toUpperCase() === pIdStr;
      const isDelivered = l.status === 'Report Delivered';
      const isTodayOrder = isSameDayStr(l.dateOrdered, todayStr) || isSameDayStr(l.date, todayStr);
      return matchId && isDelivered && isTodayOrder;
    });
  };

  const getDeliveredLabNames = (patientId) => {
    if (!patientId) return '';
    const pIdStr = String(patientId).replace(/#/g, '').trim().toUpperCase();
    return allLabLogs
      .filter(l => {
        const matchId = String(l.patientId).replace(/#/g, '').trim().toUpperCase() === pIdStr;
        const isDelivered = l.status === 'Report Delivered';
        const isTodayOrder = isSameDayStr(l.dateOrdered, todayStr) || isSameDayStr(l.date, todayStr);
        return matchId && isDelivered && isTodayOrder;
      })
      .map(l => l.testName)
      .join(', ');
  };


  const myPatients = patients.filter(p => {
    const matchesDoc = Number(p.assignedDoctorId) === Number(doctorId) || String(p.assignedDoctorId) === String(doctorId);
    if (!matchesDoc || p.status === 'Inactive') return false;

    const isToday = isSameDayStr(p.registrationDate, todayStr);
    const isConsulting = p.status === 'Consulting';
    const isReviewing = p.status === 'Reviewing';
    const isLabDelivered = hasDeliveredLab(p.id);
    const isActiveQueue = ['In Queue', 'Registered', 'Waiting'].includes(p.status);

    return isConsulting || isReviewing || isLabDelivered || (isActiveQueue && isToday) || isToday || Boolean(p.wardBedId);
  });
  const pendingReassignmentRequests = (patients || []).filter(p =>
    p && p.pendingReassignment && p.status !== 'Inactive' &&
    isSameId(p.pendingReassignment.targetDoctorId, doctorId)
  );

  const consultationQueue = myPatients
    .filter(p => p.status !== 'Reviewing' && p.status !== 'Lab Review Pending' && p.status !== 'Completed' && (p.status === 'Consulting' || (['In Queue', 'Registered', 'Waiting'].includes(p.status) && isSameDayStr(p.registrationDate, todayStr))))
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Dedicated Lab Reports Ready Queue (Patients awaiting lab report review who are not in the active initial consultation queue)
  const labReviewQueue = myPatients.filter(p =>
    hasDeliveredLab(p.id) &&
    !['In Queue', 'Registered', 'Waiting', 'Completed', 'Inactive'].includes(p.status)
  );

  // Dedicated Pharmacy Dispensed Review Queue (All patients sent by Pharmacy to Doctor Review)
  const pharmacyReviewQueue = myPatients.filter(p =>
    p.status === 'Reviewing' &&
    p.status !== 'Completed' &&
    p.status !== 'Inactive'
  );
  const skippedQueue = myPatients
    .filter(p => p.status === 'Skipped' && isSameDayStr(p.registrationDate, todayStr))
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  const liveActivePatient = (patients && activePatient)
    ? (patients.find(p => isSameId(p.id, activePatient.id)) || activePatient)
    : activePatient;

  const handleSelectPatient = (patient, mode = null) => {
    setActivePatient(patient);
    setReviewMode(mode);
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

    if (['In Queue', 'Registered'].includes(patient.status) && onStartConsultation && !mode) {
      onStartConsultation(patient.id);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: 10, category: 'tablets', route: 'Oral (Tab)' }]);
  };

  const handleAddSyrup = () => {
    setMedicines([...medicines, { name: '', dosage: '5ml (1-0-1) - After Food', duration: 5, category: 'syrup', isSyrup: true, route: 'Oral (Syrup)' }]);
  };

  const handleAddInjection = () => {
    setMedicines([...medicines, {
      name: '',
      injDose: '1g',
      route: 'IV',
      frequency: 'STAT (Single / Immediate)',
      dosage: '1g IV Stat',
      duration: 1,
      category: 'injection'
    }]);
  };

  const handleAddNebulization = () => {
    setMedicines([...medicines, { name: '', dosage: '1 Respule (1-0-1)', duration: 3, category: 'nebulization', route: 'Inhalation' }]);
  };

  const handleAddOthers = () => {
    setMedicines([...medicines, { name: '', dosage: 'Apply twice daily', duration: 5, category: 'others', route: 'Topical' }]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, fieldOrObj, value) => {
    setMedicines(prevMedicines => prevMedicines.map((med, i) => {
      if (i === idx) {
        if (typeof fieldOrObj === 'object') {
          return { ...med, ...fieldOrObj };
        }
        return { ...med, [fieldOrObj]: value };
      }
      return med;
    }));
  };

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    if (!activePatient) return;

    if (prescriptionMode === 'drawing') {
      if (!canvasDataUrl) {
        showToast('Please write something on the digital drawing board first!', 'danger');
        return;
      }
    } else {
      if (!diagnosis) {
        showToast('Please enter a diagnosis first!', 'danger');
        return;
      }
      if (medicines.some(m => !m.name || !m.dosage)) {
        showToast('Please complete medicine details!', 'danger');
        return;
      }
    }

    const finalDiagnosis = diagnosis || (prescriptionMode === 'drawing' ? 'Handwritten Prescription Sheet' : 'Clinical Consultation Completed');
    const prescData = {
      ...activePatient,
      diagnosis: finalDiagnosis,
      prescription: prescriptionMode === 'drawing' ? null : medicines,
      prescriptionImg: prescriptionMode === 'drawing' ? canvasDataUrl : null,
      complaints,
      pastHistory,
      examination,
      investigation,
      wardBedId: recommendAdmission ? targetBedId : (activePatient.wardBedId || null),
      bedAdmissionPending: recommendAdmission ? 1 : (activePatient.bedAdmissionPending ?? 0)
    };

    setSharePatient(prescData);
    setIsHistoryPreview(false);
  };

  const handleCompleteLabReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activePatient) return;

    const patientName = activePatient.name;
    const patId = activePatient.id;
    const cleanPid = String(patId).replace(/#/g, '').trim().toUpperCase();

    // 1. Instant optimistic update for allLabLogs so Lab Queue clears with 0ms lag
    setAllLabLogs(prev => prev.map(l =>
      String(l.patientId).replace(/#/g, '').trim().toUpperCase() === cleanPid && l.status === 'Report Delivered'
        ? { ...l, status: 'Report Reviewed' }
        : l
    ));

    // Update backend lab logs status asynchronously
    try {
      const deliveredLogs = allLabLogs.filter(l =>
        String(l.patientId).replace(/#/g, '').trim().toUpperCase() === cleanPid && l.status === 'Report Delivered'
      );
      for (const log of deliveredLogs) {
        fetch(`${API_BASE}/api/lab/${log.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Report Reviewed' })
        }).catch(err => console.error("Error updating lab report status:", err));
      }
    } catch (err) {
      console.error("Error updating lab status:", err);
    }

    // 2. Check if the patient is STILL in Pharmacy Review queue (status === 'Reviewing')
    const isPharmacyPending = activePatient.status === 'Reviewing';

    if (!isPharmacyPending) {
      // No pharmacy review pending -> consultation is 100% completed!
      if (onSubmitReview) {
        onSubmitReview(patId, {
          followUpNotes: followUpNotes || '',
          nextVisitDate: nextVisitDate || ''
        });
      }
      showToast(`Lab Report Review Completed for ${patientName}! (All Consultations Done ✅)`, 'success');
    } else {
      // Pharmacy review still pending in Pharmacy Queue!
      showToast(`Lab Report Review Completed for ${patientName}! (Pharmacy Review still in queue) ✅`, 'info');
    }

    setActivePatient(null);
    setReviewMode(null);
  };

  const handleCompletePharmacyReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activePatient) return;

    const patientName = activePatient.name;
    const patId = activePatient.id;

    // Check if patient STILL has unreviewed delivered lab reports
    const hasPendingLab = hasDeliveredLab(patId);

    if (hasPendingLab) {
      // Patient still has unreviewed lab reports!
      // Update patient status to 'Lab Review Pending' so they leave Pharmacy Queue, but stay in Lab Queue
      try {
        const cleanId = String(patId).replace(/#/g, '').trim();
        await fetch(`${API_BASE}/api/patients/${encodeURIComponent(cleanId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Lab Review Pending' })
        });
        if (onUpdatePatientStatus) {
          onUpdatePatientStatus(patId, 'Lab Review Pending');
        }
      } catch (err) {
        console.error("Failed to update patient status after pharmacy review:", err);
      }
      showToast(`Pharmacy Review Completed for ${patientName}! (Lab Report Review still in queue) ✅`, 'info');
    } else {
      // No lab reports pending -> Patient consultation is 100% completed!
      onSubmitReview(patId, {
        followUpNotes: followUpNotes || '',
        nextVisitDate: nextVisitDate || ''
      });
      showToast(`Pharmacy Review Completed for ${patientName}! (All Consultations Done ✅)`, 'success');
    }

    setActivePatient(null);
    setReviewMode(null);
  };

  const handleReviewSubmit = (e) => {
    if (reviewMode === 'lab') {
      return handleCompleteLabReview(e);
    }
    return handleCompletePharmacyReview(e);
  };

  return (
    <div className="fade-in">
      {/* Incoming Reassignment Requests Alert Banner (Positioned outside white box card, right below header) */}
      {pendingReassignmentRequests.length > 0 && (
        <div className="incoming-reassign-banner" style={{ maxWidth: '850px', margin: '0 auto 1.25rem auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <UserPlus size={16} /> Incoming Reassignment Requests ({pendingReassignmentRequests.length})
          </h4>
          {pendingReassignmentRequests.map(p => (
            <div
              key={`reassign_req_${p.id}`}
              className="incoming-reassign-card"
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(56, 189, 248, 0.06) 100%)',
                border: '1.5px solid rgba(14, 165, 233, 0.45)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserPlus size={16} />
                    {p.pendingReassignment.fromDoctorName} has requested to re-assign a patient to you
                  </div>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    Patient: <span style={{ color: '#0284c7' }}>{p.name}</span> ({p.age} Yrs • {p.gender}) • ID: #{p.id}
                    {p.status === 'Reviewing' && (
                      <span style={{
                        background: 'rgba(14, 165, 233, 0.18)',
                        color: '#0284c7',
                        border: '1px solid rgba(14, 165, 233, 0.4)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.45rem',
                        marginLeft: '0.5rem'
                      }}>
                        📋 Follow-Up Review
                      </span>
                    )}
                  </div>
                  {p.pendingReassignment.reason && (
                    <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', color: '#0c4a6e', fontStyle: 'italic' }}>
                      Reason: "{p.pendingReassignment.reason}"
                    </div>
                  )}
                </div>

                <div className="incoming-reassign-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      let success = false;
                      if (onAcceptReassignment) {
                        success = await onAcceptReassignment(p.id);
                      }
                      if (!success) {
                        try {
                          const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
                          const isReviewing = p.status === 'Reviewing';
                          const targetStatus = isReviewing ? 'Reviewing' : 'In Queue';
                          const targetApiId = String(p.id).replace(/#/g, '').trim();

                          const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              assignedDoctorId: parseInt(doctorId),
                              previousDoctor: p.pendingReassignment?.fromDoctorName || '',
                              pendingReassignment: null,
                              reassignmentDeclined: null,
                              status: targetStatus,
                              registrationDate: todayStr
                            })
                          });
                          if (response.ok) success = true;
                        } catch (err) {
                          console.error("Fallback error accepting reassignment:", err);
                        }
                      }
                      if (success) {
                        showToast(`Accepted patient ${p.name} into your consultation queue!`, 'success');
                      } else {
                        showToast('Failed to accept patient transfer.', 'danger');
                      }
                    }}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Check size={16} /> Accept Patient
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      let success = false;
                      if (onDeclineReassignment) {
                        success = await onDeclineReassignment(p.id);
                      }
                      if (!success) {
                        try {
                          const now = new Date();
                          const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
                          const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                          const fullDateTime = `${dateStr}, ${timeStr}`;

                          const declData = {
                            targetDoctorId: doctorId,
                            targetDoctorName: doctorName,
                            fromDoctorName: p.pendingReassignment?.fromDoctorName || '',
                            declinedAt: fullDateTime
                          };

                          const targetApiId = String(p.id).replace(/#/g, '').trim();
                          const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(targetApiId)}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              pendingReassignment: null,
                              reassignmentDeclined: declData
                            })
                          });
                          if (response.ok) success = true;
                        } catch (err) {
                          console.error("Fallback error declining reassignment:", err);
                        }
                      }
                      if (success) {
                        showToast(`Declined reassignment request for ${p.name}.`, 'info');
                      } else {
                        showToast(`Failed to decline reassignment request.`, 'danger');
                      }
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!activePatient ? (
        <div className="card doctor-terminal-card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="doctor-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 className="doctor-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '1.25rem', flexWrap: 'wrap' }}>
              <Clipboard size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{doctorName}'s Consultations</span>
              {activeDoctor?.specialty && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  ({activeDoctor.specialty})
                </span>
              )}
            </h3>

            {userRole === 'admin' && doctors && doctors.length > 0 && (
              <div className="doctor-desk-container" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Doctor Desk:
                </label>
                <select
                  className="form-input doctor-desk-select"
                  value={doctorId}
                  onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.85rem',
                    minWidth: '220px',
                    width: 'auto',
                    background: 'var(--bg-dark)',
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
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
              <div className="empty-queue-box" style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending consults.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {consultationQueue.map(p => (
                  <div 
                    key={p.id} 
                    className="stat-card pending-queue-card" 
                    style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary)', padding: '1rem 1.25rem' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {p.name}
                          {Number(p.specialInvestigation) === 1 && (

                            <span title="Special Investigation Required" style={{
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(139, 92, 246, 0.12))',
                              color: '#a855f7',
                              border: '1px solid rgba(168, 85, 247, 0.45)',
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
                        <span className="token-badge" style={{ 
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
                        {p.pendingReassignment && (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            marginLeft: '0.5rem'
                          }}>
                            ⏳ Pending Approval by {p.pendingReassignment.targetDoctorName}
                          </span>
                        )}
                        {p.reassignmentDeclined && !p.pendingReassignment && (
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.16)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.45rem',
                            marginLeft: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            ❌ Declined by {p.reassignmentDeclined.targetDoctorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {onAdmitToWard && !p.wardBedId && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-ward-action"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#0f766e', borderColor: 'rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                          title="Admit to Ward Room"
                        >
                          <Bed size={12} /> Ward
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-reassign-action"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--primary)',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReassignModalPatient(p);
                          setTargetDoctorId('');
                        }}
                        title="Reassign patient to another doctor"
                      >
                        <UserPlus size={12} /> Reassign
                      </button>
                      <button 
                        className="btn btn-primary btn-consult-action" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(p, null);
                        }}
                      >
                        Consult
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1. Dedicated Lab Reports Ready Review Queue */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              🧪 Lab Reports Ready Queue ({labReviewQueue.length})
            </h4>
            {labReviewQueue.length === 0 ? (
              <div className="empty-queue-box" style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending lab reports to review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {labReviewQueue.map(p => (
                  <div 
                    key={p.id} 
                    className="stat-card review-queue-card" 
                    style={{ cursor: 'pointer', borderLeft: '4px solid #10b981', padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.03)' }}
                    onClick={() => handleSelectPatient(p, 'lab')}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                        <span style={{
                          fontSize: '0.72rem',
                          color: '#065f46',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1.5px solid rgba(16, 185, 129, 0.4)',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          🧪 Lab Report Issued
                        </span>
                        {getDeliveredLabNames(p.id) && (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                            ({getDeliveredLabNames(p.id)})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {p.age} Yrs • {p.gender} • ID: #{p.id}
                        {p.pendingReassignment && (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            marginLeft: '0.5rem'
                          }}>
                            ⏳ Pending Approval by {p.pendingReassignment.targetDoctorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {onAdmitToWard && !p.wardBedId && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-ward-action"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#0f766e', borderColor: 'rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                          title="Admit to Ward Room"
                        >
                          <Bed size={12} /> Ward
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-reassign-action"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--primary)',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReassignModalPatient(p);
                          setTargetDoctorId('');
                        }}
                        title="Reassign patient to another doctor"
                      >
                        <UserPlus size={12} /> Reassign
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981', color: '#fff', fontWeight: 700 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(p, 'lab');
                        }}
                      >
                        Review Lab
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Dedicated Pharmacy Dispensed Review Queue */}
          <div>
            <h4 style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              💊 Pharmacy Dispensed Review Queue ({pharmacyReviewQueue.length})
            </h4>
            {pharmacyReviewQueue.length === 0 ? (
              <div className="empty-queue-box" style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pharmacy review patients.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pharmacyReviewQueue.map(p => (
                  <div 
                    key={p.id} 
                    className="stat-card review-queue-card" 
                    style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b', padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.03)' }}
                    onClick={() => handleSelectPatient(p, 'pharmacy')}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#b45309',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1.5px solid rgba(245, 158, 11, 0.35)',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          💊 Pharmacy Issued
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {p.age} Yrs • {p.gender} • ID: #{p.id}
                        {p.pendingReassignment && (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            marginLeft: '0.5rem'
                          }}>
                            ⏳ Pending Approval by {p.pendingReassignment.targetDoctorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {onAdmitToWard && !p.wardBedId && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-ward-action"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#0f766e', borderColor: 'rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                          title="Admit to Ward Room"
                        >
                          <Bed size={12} /> Ward
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-reassign-action"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--primary)',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReassignModalPatient(p);
                          setTargetDoctorId('');
                        }}
                        title="Reassign patient to another doctor"
                      >
                        <UserPlus size={12} /> Reassign
                      </button>
                      <button 
                        className="btn btn-warning btn-review-action" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(p, 'pharmacy');
                        }}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skippedQueue.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⏸ Skipped / On Hold Patients ({skippedQueue.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {skippedQueue.map(p => (
                  <div
                    key={p.id}
                    className="stat-card skipped-queue-card"
                    style={{ cursor: 'pointer', borderLeft: '4px solid #d97706', padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.05)' }}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#d97706',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          Skipped
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {p.age} Yrs • {p.gender} • Token #{String(p.tokenNumber || '--').padStart(2, '0')} • ID: #{p.id}
                      </div>
                    </div>
                    <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {onUpdatePatientStatus && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePatientStatus(p.id, 'In Queue');
                          }}
                        >
                          Unskip
                        </button>
                      )}
                      <button className="btn btn-primary btn-consult-action" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Consult</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card fade-in">
          <div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                <div className="doc-active-patient-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {Number(activePatient.specialInvestigation) === 1 && (
                    <div 
                      title="Click to mark special investigation as reviewed / clear flag"
                      onClick={() => setShowClearInvestigationConfirm(true)}
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
                  <div className="doc-active-patient-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        background: 'rgba(99, 102, 241, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 700,
                        borderRadius: '8px'
                      }}
                      onClick={() => {
                        setReassignModalPatient(activePatient);
                        setTargetDoctorId('');
                      }}
                      title="Reassign active patient to another doctor"
                    >
                      <UserPlus size={14} /> Reassign Doctor
                    </button>
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
                      className="quick-template-btn"
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
                      className="quick-template-btn"
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



                {(activePatient.height || activePatient.weight || activePatient.bp || activePatient.hr || activePatient.spo2 || activePatient.grbs || activePatient.temp || activePatient.respiratoryRate || activePatient.painScale || activePatient.headCircumference || activePatient.avpu) && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.85rem', 
                    background: 'rgba(99, 102, 241, 0.04)', 
                    border: '1px solid rgba(99, 102, 241, 0.15)', 
                    borderRadius: '8px',
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Latest Recorded Vitals / Triage</span>
                      {activePatient.dob && <span style={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>DOB: {activePatient.dob}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem' }}>
                      {activePatient.height && <div><strong>Height (Ht):</strong> {activePatient.height} cm</div>}
                      {activePatient.weight && <div><strong>Weight (Wt):</strong> {activePatient.weight} kg</div>}
                      {activePatient.bp && <div><strong>BP:</strong> {activePatient.bp}</div>}
                      {activePatient.hr && <div><strong>Pulse (HR):</strong> {activePatient.hr} bpm</div>}
                      {activePatient.spo2 && <div><strong>SPO2:</strong> {activePatient.spo2}%</div>}
                      {activePatient.grbs && <div><strong>GRBS:</strong> {activePatient.grbs}</div>}
                      {activePatient.temp && <div><strong>Temp (TEMP):</strong> {activePatient.temp} °F</div>}
                      {activePatient.respiratoryRate && <div><strong>Resp Rate (RR):</strong> {activePatient.respiratoryRate}</div>}
                      {activePatient.painScale !== undefined && activePatient.painScale !== '' && <div><strong>Pain Scale:</strong> {activePatient.painScale}/10</div>}
                      {activePatient.headCircumference && <div><strong>Head Cir.:</strong> {activePatient.headCircumference} cm</div>}
                      {activePatient.avpu && <div><strong>Consciousness:</strong> {activePatient.avpu}</div>}
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

              {/* Doctor Consultation & Prescribing Form (Unified for Consultation, Lab Review, and Pharmacy Review) */}
              <form onSubmit={handlePrescriptionSubmit}>
                {/* Review Informational Banner (if in Review mode) */}
                {(reviewMode === 'lab' || hasDeliveredLab(activePatient.id)) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '1.5rem' }}>
                    <FlaskConical size={22} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong style={{ color: '#10b981' }}>🧪 Lab Report Ready Review:</strong> Reviewing completed laboratory findings for <strong>{activePatient.name}</strong> {getDeliveredLabNames(activePatient.id) && <span>({getDeliveredLabNames(activePatient.id)})</span>}.
                    </div>
                  </div>
                ) : (reviewMode === 'pharmacy' || activePatient.status === 'Reviewing' || activePatient.issuedMedication) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '1.5rem' }}>
                    <AlertCircle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong style={{ color: '#d97706' }}>💊 Pharmacy Medication Dispensation Review:</strong> Pharmacy issued <strong>{activePatient.issuedMedication || 'prescribed medicines'}</strong> for <strong>{activePatient.name}</strong>.
                    </div>
                  </div>
                ) : (
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Doctor Consultation</h4>
                )}

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
                      onChange={(e) => {
                        setOrderTestName(e.target.value);
                        if (labOrderError) setLabOrderError('');
                        if (labOrderSuccess) setLabOrderSuccess('');
                      }}
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

                  {/* Inline Error & Success message right below the input box */}
                  {labOrderError && (
                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{labOrderError}</span>
                    </div>
                  )}

                  {labOrderSuccess && (
                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '8px',
                      color: '#10b981',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <span>{labOrderSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Injection Approval Section */}
                {patientInjections && patientInjections.length > 0 && (
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                  const livePat = (patients && activePatient) ? (patients.find(p => isSameId(p.id, activePatient.id)) || activePatient) : activePatient;
                  const assignedWardBedId = livePat?.wardBedId || activePatient?.wardBedId;

                  if (assignedWardBedId) {
                    return (
                      <div className="form-group" style={{ 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        border: '1.5px solid rgba(16, 185, 129, 0.35)', 
                        borderRadius: '10px', 
                        padding: '1.25rem',
                        marginBottom: '1.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              background: 'rgba(16, 185, 129, 0.2)', 
                              color: '#10b981', 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <Bed size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                                ✓ Patient Already Admitted to Ward
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                Assigned to: <strong style={{ color: 'var(--text-primary)' }}>Room {assignedWardBedId.slice(0, 3)} - Bed {assignedWardBedId.slice(3)}</strong>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleDoctorDischargeFromWard}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.95rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1.5px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '8px',
                              color: '#ef4444',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <LogOut size={15} /> Discharge Patient
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const allBeds = ['101A', '101B', '102A', '102B', '103A', '103B', '104A', '104B', '105A', '105B'];
                  const occupiedBedIds = patients
                    .filter(p => p.wardBedId && p.status !== 'Inactive')
                    .map(p => p.wardBedId);
                  const availableBeds = allBeds.filter(bedId => !occupiedBedIds.includes(bedId));

                  return (
                    <div className="form-group" style={{ 
                      background: recommendAdmission ? 'rgba(21, 115, 136, 0.08)' : 'rgba(128, 128, 128, 0.04)', 
                      border: recommendAdmission ? '1px solid rgba(21, 115, 136, 0.35)' : '1px solid var(--border)', 
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
                            background: recommendAdmission ? 'rgba(21, 115, 136, 0.15)' : 'rgba(128, 128, 128, 0.12)',
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
                          width: '44px',
                          height: '24px',
                          background: recommendAdmission ? 'var(--primary)' : 'rgba(100, 116, 139, 0.3)',
                          border: recommendAdmission ? '1px solid var(--primary)' : '1.5px solid rgba(100, 116, 139, 0.45)',
                          borderRadius: '16px',
                          position: 'relative',
                          transition: 'all 0.25s ease',
                          flexShrink: 0
                        }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '1.5px',
                            left: recommendAdmission ? '21px' : '2px',
                            transition: 'left 0.25s ease',
                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)'
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
                  <div className="doc-mode-switcher-grid" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
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
                  <div style={{ marginBottom: '1.5rem' }} className="doc-prescription-edit-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: 'var(--primary)' }}>Digital Prescription</label>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={handleAddMedicine}
                        >
                          <Plus size={13} /> Tablets
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(15, 118, 110, 0.1)',
                            color: '#0f766e',
                            border: '1.5px solid rgba(15, 118, 110, 0.3)',
                            fontWeight: 700
                          }}
                          onClick={handleAddSyrup}
                        >
                          <Plus size={13} /> Syrup
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(225, 29, 72, 0.1)',
                            color: '#e11d48',
                            border: '1.5px solid rgba(225, 29, 72, 0.3)',
                            fontWeight: 700
                          }}
                          onClick={handleAddInjection}
                        >
                          <Plus size={13} /> Injection
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(147, 51, 234, 0.1)',
                            color: '#9333ea',
                            border: '1.5px solid rgba(147, 51, 234, 0.3)',
                            fontWeight: 700
                          }}
                          onClick={handleAddNebulization}
                        >
                          <Plus size={13} /> Nebulization
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#d97706',
                            border: '1.5px solid rgba(245, 158, 11, 0.3)',
                            fontWeight: 700
                          }}
                          onClick={handleAddOthers}
                        >
                          <Plus size={13} /> Others
                        </button>
                      </div>
                    </div>

                    {medicines.length === 0 ? (
                      <div style={{
                        padding: '1.25rem',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-muted)',
                        fontSize: '0.88rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: '0 0 0.65rem 0' }}>No medicines added to this prescription list.</p>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                            onClick={handleAddMedicine}
                          >
                            <Plus size={13} /> Add Tablet
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                            onClick={handleAddSyrup}
                          >
                            <Plus size={13} /> Add Syrup
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                            onClick={handleAddInjection}
                          >
                            <Plus size={13} /> Add Injection
                          </button>
                        </div>
                      </div>
                    ) : (
                      medicines.map((med, idx) => (
                        <MedicineInputRow
                          key={idx}
                          med={med}
                          idx={idx}
                          onChange={handleMedicineChange}
                          onRemove={handleRemoveMedicine}
                          canRemove={true}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Follow up notes if in review mode */}
                {(reviewMode || activePatient.status === 'Reviewing' || activePatient.status === 'Lab Review Pending') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Doctor's Review / Clinical Note</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Vitals normal, continue current prescription"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Next Visit Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={nextVisitDate}
                        onChange={(e) => setNextVisitDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="doc-consult-submit-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, fontWeight: 700 }}>
                    <Send size={16} /> Send to Pharmacy
                  </button>
                  
                  {/* Complete Review Button for Review patients */}
                  {(reviewMode === 'lab' || hasDeliveredLab(activePatient.id)) ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ flexGrow: 1, fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
                      onClick={handleCompleteLabReview}
                    >
                      <CheckCircle2 size={16} /> Complete Lab Report Review
                    </button>
                  ) : (reviewMode === 'pharmacy' || activePatient.status === 'Reviewing' || activePatient.status === 'Lab Review Pending') ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ flexGrow: 1, fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
                      onClick={handleCompletePharmacyReview}
                    >
                      <CheckCircle2 size={16} /> Complete Pharmacy Review
                    </button>
                  ) : null}

                  {onAdmitToWard && (
                    <button
                      type="button"
                      onClick={handleBottomAdmitClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1.25rem',
                        background: (liveActivePatient?.wardBedId || activePatient?.wardBedId || (recommendAdmission && targetBedId)) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15,118,110,0.1)',
                        border: (liveActivePatient?.wardBedId || activePatient?.wardBedId || (recommendAdmission && targetBedId)) ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(15,118,110,0.35)',
                        borderRadius: '8px',
                        color: (liveActivePatient?.wardBedId || activePatient?.wardBedId || (recommendAdmission && targetBedId)) ? '#10b981' : '#0f766e',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Bed size={15} />
                      {(liveActivePatient?.wardBedId || activePatient?.wardBedId)
                        ? `Admitted (Room ${(liveActivePatient?.wardBedId || activePatient?.wardBedId).slice(0, 3)} • ${(liveActivePatient?.wardBedId || activePatient?.wardBedId).slice(3)})`
                        : (recommendAdmission && targetBedId
                          ? `Bed Selected (Room ${targetBedId.slice(0, 3)} • ${targetBedId.slice(3)})`
                          : 'Admit to Ward')}
                    </button>
                  )}
                  
                  <button type="button" className="btn btn-secondary" onClick={handleCancelConsultation}>
                    Cancel
                  </button>
                </div>
              </form>
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
              background: 'var(--bg-card, #111c30)',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                background: 'var(--bg-card, #111c30)'
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
                    background: 'rgba(128, 128, 128, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
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

              {/* Date Range Filter Bar */}
              <div style={{
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)',
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
                        background: 'var(--bg-dark, #0b1329)'
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
                        background: 'var(--bg-dark, #0b1329)'
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
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: 'var(--bg-dark, #0b1329)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistoryItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'var(--bg-card, #111c30)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                    No records found for the selected date range.
                  </div>
                ) : filteredHistoryItems.map((item, index) => {
                  if (item.type === 'current') {
                    return (
                      <div key={index} style={{ background: 'var(--bg-card, #111c30)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', borderLeft: '4px solid var(--warning)', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>Active / Last Checkup</span>
                          <span>Doctor's diagnosis</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>Diagnosis: {item.diagnosis}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
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
                      <div key={index} style={{ background: 'var(--bg-card, #111c30)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>{item.date}</span>
                          <span>Doc: {item.doctorName}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>Diagnosis: {item.diagnosis}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
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
                background: 'var(--bg-card, #111c30)',
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
            background: 'var(--bg-card, #ffffff)',
            color: 'var(--text-primary)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
              background: 'var(--bg-card, #f8fafc)'
            }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>
                {isHistoryPreview ? "View Previous Prescription" : "Review & Send Prescription"}
              </h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{
                  background: 'rgba(128, 128, 128, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-primary)',
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
            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', background: 'var(--bg-dark, #f8fafc)' }}>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem', marginTop: 0 }}>
                {isHistoryPreview 
                  ? "Review this official patient prescription." 
                  : "Please review the digital prescription details below. Clicking 'Send to Pharmacy' will record and dispatch this prescription."}
              </p>

              {/* Official Prescription Paper (Adult vs Child Template Switcher) */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select Pad Design:</span>
                <button
                  type="button"
                  className={`btn ${ (padDesignMode === 'adult' || (padDesignMode === 'auto' && !(sharePatient?.patientCategory === 'child' || (sharePatient?.age && parseInt(sharePatient.age) <= 12)))) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setPadDesignMode('adult')}
                >
                  Standard Adult Pad
                </button>
                <button
                  type="button"
                  className={`btn ${ (padDesignMode === 'child' || (padDesignMode === 'auto' && (sharePatient?.patientCategory === 'child' || (sharePatient?.age && parseInt(sharePatient.age) <= 12)))) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setPadDesignMode('child')}
                >
                  Pediatric / Child Pad (Vijaya's)
                </button>
              </div>

              {(padDesignMode === 'child' || (padDesignMode === 'auto' && (sharePatient?.patientCategory === 'child' || (sharePatient?.age && parseInt(sharePatient.age) <= 12)))) ? (
                <ChildPrescriptionTemplate patient={sharePatient} />
              ) : (
                <PrescriptionTemplate patient={sharePatient} />
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="doc-rx-modal-footer" style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-card, #f8fafc)',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              {isHistoryPreview ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      printPrescriptionDirectly('printable-rx');
                    }}
                  >
                    <Printer size={16} /> Print Prescription
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    style={{
                      flexGrow: 1,
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      gap: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => {
                      if (sharePatient) {
                        setPreviousStateBeforeEdit({
                          activePatient,
                          showAllHistoryModal,
                          diagnosis,
                          medicines,
                          complaints,
                          pastHistory,
                          examination,
                          investigation,
                          followUpNotes,
                          nextVisitDate,
                          prescriptionMode,
                          canvasDataUrl
                        });

                        const cleanTargetId = String(sharePatient.id || sharePatient.patientId || '').replace(/#/g, '').trim().toUpperCase();
                        const existingPatient = (patients || []).find(p => String(p.id).replace(/#/g, '').trim().toUpperCase() === cleanTargetId);

                        // Robust parsing of medicines whether string, JSON, array or nested
                        let rawPrescription = sharePatient.prescription || existingPatient?.prescription;
                        let parsedMeds = [];
                        if (typeof rawPrescription === 'string') {
                          try {
                            parsedMeds = JSON.parse(rawPrescription);
                          } catch (e) {
                            parsedMeds = [];
                          }
                        } else if (Array.isArray(rawPrescription)) {
                          try {
                            parsedMeds = JSON.parse(JSON.stringify(rawPrescription));
                          } catch (e) {
                            parsedMeds = rawPrescription;
                          }
                        }

                        if (!Array.isArray(parsedMeds) || parsedMeds.length === 0 || typeof parsedMeds === 'string') {
                          parsedMeds = [{ name: '', dosage: '', duration: 3, category: 'tablets', frequency: '1-0-1 (Twice daily - Morning & Night)', mealTiming: 'After Food' }];
                        } else {
                          parsedMeds = parsedMeds.map(m => typeof m === 'string' ? { name: m, dosage: '', duration: 3, category: 'tablets' } : { ...m, duration: m.duration || 3 });
                        }

                        const isReviewPatient = activePatient?.status === 'Reviewing' || activePatient?.status === 'Lab Review Pending' || !!reviewMode || sharePatient?.status === 'Reviewing' || existingPatient?.status === 'Reviewing';

                        const targetStatus = isReviewPatient ? (activePatient?.status || existingPatient?.status || 'Reviewing') : 'Consulting';

                        const targetPatient = {
                          ...(existingPatient || sharePatient),
                          status: targetStatus,
                          diagnosis: sharePatient.diagnosis || existingPatient?.diagnosis || '',
                          prescription: parsedMeds
                        };

                        // NEVER switch review patient to 'Consulting' or put into Pending Consultation Queue!
                        if (!isReviewPatient) {
                          if (onStartConsultation) {
                            onStartConsultation(targetPatient.id || cleanTargetId);
                          } else if (onUpdatePatientStatus) {
                            onUpdatePatientStatus(targetPatient.id || cleanTargetId, 'Consulting');
                          }
                        }

                        setActivePatient(targetPatient);
                        setMedicines(parsedMeds);
                        setDiagnosis(targetPatient.diagnosis || '');
                        setComplaints(sharePatient.complaints || targetPatient.complaints || '');
                        setPastHistory(sharePatient.pastHistory || targetPatient.pastHistory || '');
                        setExamination(sharePatient.examination || targetPatient.examination || '');
                        setInvestigation(sharePatient.investigation || targetPatient.investigation || '');
                        setFollowUpNotes(sharePatient.followUpNotes || targetPatient.followUpNotes || '');
                        setNextVisitDate(sharePatient.nextVisitDate || targetPatient.nextVisitDate || '');
                        setPrescriptionMode(sharePatient.prescriptionImg ? 'drawing' : 'form');
                        setCanvasDataUrl(sharePatient.prescriptionImg || null);

                        setReviewMode(null); // Complete consultation review mode is hidden and Send to Pharmacy consultation form opens directly!
                        setSharePatient(null);
                        setIsHistoryPreview(false);
                        setShowAllHistoryModal(false);

                        setTimeout(() => {
                          const medSection = document.querySelector('.doc-prescription-edit-section') || document.querySelector('.doc-mode-switcher-grid') || document.querySelector('form button[type="submit"]');
                          if (medSection) {
                            medSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 120);

                        showToast('Opened Medicine Prescribing Terminal. You can now add/edit medicines and Send to Pharmacy.', 'info');
                      }
                    }}
                  >
                    <Plus size={16} /> Edit / Add Medicines
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
                    disabled={isSendingPrescription}
                    style={{ flexGrow: 1, opacity: isSendingPrescription ? 0.7 : 1, cursor: isSendingPrescription ? 'not-allowed' : 'pointer' }}
                    onClick={async () => {
                      if (isSendingPrescription) return;
                      const targetPatientId = activePatient?.id || sharePatient?.id;
                      if (!targetPatientId) {
                        showToast('Patient record not found. Please re-select the patient.', 'danger');
                        return;
                      }

                      // ⚡ Instant Optimistic Close & Toast Feedback (0ms delay)
                      const savedSharePatient = { ...sharePatient };
                      setSharePatient(null);
                      showToast(`Prescription successfully sent to Pharmacy!`, 'success');

                      if (previousStateBeforeEdit) {
                        setActivePatient(previousStateBeforeEdit.activePatient);
                        if (previousStateBeforeEdit.activePatient) {
                          setDiagnosis(previousStateBeforeEdit.diagnosis || '');
                          setMedicines(previousStateBeforeEdit.medicines || [{ name: '', dosage: '', duration: 10 }]);
                          setComplaints(previousStateBeforeEdit.complaints || '');
                          setPastHistory(previousStateBeforeEdit.pastHistory || '');
                          setExamination(previousStateBeforeEdit.examination || '');
                          setInvestigation(previousStateBeforeEdit.investigation || '');
                          setFollowUpNotes(previousStateBeforeEdit.followUpNotes || '');
                          setNextVisitDate(previousStateBeforeEdit.nextVisitDate || '');
                          setPrescriptionMode(previousStateBeforeEdit.prescriptionMode || 'form');
                          setCanvasDataUrl(previousStateBeforeEdit.canvasDataUrl || null);
                        }
                        if (previousStateBeforeEdit.showAllHistoryModal) {
                          setShowAllHistoryModal(true);
                        }
                        setPreviousStateBeforeEdit(null);
                      } else {
                        setActivePatient(null);
                      }

                      setIsSendingPrescription(true);
                      try {
                        await onSubmitPrescription(targetPatientId, savedSharePatient);
                      } catch (err) {
                        console.error("Error sending prescription:", err);
                      } finally {
                        setIsSendingPrescription(false);
                      }
                    }}

                  >
                    <Send size={16} /> {isSendingPrescription ? 'Sending to Pharmacy...' : 'Send to Pharmacy'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    disabled={isSendingPrescription}
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

      {/* Reassign Doctor Modal */}
      {reassignModalPatient && createPortal(
        <div className="modal-overlay fade-in" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }} onClick={() => setReassignModalPatient(null)}>
          <div className="reassign-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  <UserPlus size={22} style={{ color: 'var(--primary)' }} />
                  Reassign Doctor
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select a doctor to transfer patient consultation
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setReassignModalPatient(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  transition: 'all 0.15s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Patient Info Summary Badge */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {reassignModalPatient.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {reassignModalPatient.age} Yrs • {reassignModalPatient.gender} • ID: #{reassignModalPatient.id}
                </div>
              </div>
              <span style={{
                background: 'rgba(56, 189, 248, 0.18)',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}>
                Token #{reassignModalPatient.tokenNumber || '--'}
              </span>
            </div>

            {/* Doctor Selection Options List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Select Doctor:</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'none', fontWeight: 600 }}>
                  Active Logged-In Doctors ({availableDoctors.length})
                </span>
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {availableDoctors.length === 0 ? (
                  <div style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    No other active doctors logged in today for reassignment.
                  </div>
                ) : (
                  availableDoctors.map(doc => {
                    const isCurrent = Number(doc.id) === Number(reassignModalPatient.assignedDoctorId);
                    const isSelected = Number(doc.id) === Number(targetDoctorId);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (!isCurrent) setTargetDoctorId(doc.id);
                        }}
                        className={`reassign-doctor-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'disabled' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isSelected ? 'var(--primary)' : 'rgba(56, 189, 248, 0.15)',
                            color: isSelected ? '#ffffff' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {doc.name.replace('Dr.', '').trim().charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {doc.specialty || 'General Practice'}
                            </div>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '0.25rem 0.55rem', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--border)' }}>
                            Current Doctor
                          </span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserCheck size={15} /> Selected
                          </span>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reason for Reassignment (Optional) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                Reason for Reassignment (Optional):
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Specialist consultation needed, Doctor unavailable, Patient request..."
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setReassignModalPatient(null); setReassignReason(''); }}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!targetDoctorId || Number(targetDoctorId) === Number(reassignModalPatient.assignedDoctorId)}
                onClick={async () => {
                  await handleReassignPatient(reassignModalPatient, targetDoctorId, reassignReason);
                  setReassignModalPatient(null);
                  setReassignReason('');
                }}
                style={{
                  padding: '0.5rem 1.4rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: (!targetDoctorId || Number(targetDoctorId) === Number(reassignModalPatient.assignedDoctorId)) ? 0.5 : 1,
                  cursor: (!targetDoctorId || Number(targetDoctorId) === Number(reassignModalPatient.assignedDoctorId)) ? 'not-allowed' : 'pointer'
                }}
              >
                <UserCheck size={16} /> Save & Reassign
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Lab Report Image Preview Modal */}
      {previewLabImage && createPortal(
        <div
          onClick={() => setPreviewLabImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fade-in 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #111c30)',
              borderRadius: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card, #111c30)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FlaskConical size={18} /> Laboratory Investigation Report
              </h3>
              <button
                type="button"
                onClick={() => setPreviewLabImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1rem', overflow: 'auto', textAlign: 'center', background: '#000' }}>
              <img
                src={previewLabImage}
                alt="Lab Report"
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Toast Notification - Root Level (Shows at bottom) */}
      {toast && (
        <div className="custom-toast-bar" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100020,
          background: toast.type === 'success' ? '#059669' : toast.type === 'danger' ? '#dc2626' : '#0284c7',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '50px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          fontSize: '0.88rem',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fade-in 0.3s ease-out',
          pointerEvents: 'none',
          maxWidth: '90vw',
          boxSizing: 'border-box'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{toast.message}</span>
        </div>
      )}

      {showClearInvestigationConfirm && activePatient && (
        <ConfirmModal
          isOpen={true}
          title="Clear Investigation Flag"
          message="Mark special investigation as reviewed and clear the flag for this patient?"
          confirmText="Clear Flag"
          type="warning"
          onCancel={() => setShowClearInvestigationConfirm(false)}
          onConfirm={async () => {
            setShowClearInvestigationConfirm(false);
            try {
              await fetch(`${API_BASE}/api/patients/${activePatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ specialInvestigation: 0, specialInvestigationNotes: '' })
              });
              setActivePatient(prev => ({ ...prev, specialInvestigation: 0, specialInvestigationNotes: '' }));
              showToast("Special investigation flag cleared successfully!", "success");
            } catch(err) {
              showToast("Failed to clear investigation flag.", "error");
            }
          }}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
