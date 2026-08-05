import React, { useState } from 'react';

const calculateTabletQty = (dosageStr = '', durationDays = 1) => {
  const str = (dosageStr || '').toLowerCase();
  let frequency = 2;
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

// Child / Pediatric Prescription Template Component
const ChildPrescriptionTemplate = ({ patient }) => {
  if (!patient) return null;

  const [showBgImage, setShowBgImage] = useState(true);

  const formattedDate = patient.registrationDate
    ? new Date(patient.registrationDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const patientId = patient.patientId || patient.id || patient.uhid || '--';
  const name = patient.name || '--';
  const age = patient.age ? `${patient.age} Yrs` : '--';
  const gender = patient.gender || patient.sex || '--';
  const height = patient.height ? (String(patient.height).includes('cm') ? patient.height : `${patient.height} cm`) : '--';
  const weight = patient.weight ? (String(patient.weight).includes('kg') ? patient.weight : `${patient.weight} kg`) : '--';
  const phone = patient.phone || patient.mobile || patient.contact || '--';

  const bp = patient.bp || '--';
  const hr = patient.hr || patient.pulse ? (String(patient.hr || patient.pulse).includes('bpm') ? (patient.hr || patient.pulse) : `${patient.hr || patient.pulse} bpm`) : '--';
  const spo2 = patient.spo2 ? (String(patient.spo2).includes('%') ? patient.spo2 : `${patient.spo2}%`) : '--';
  const grbs = patient.grbs || patient.rbs ? (String(patient.grbs || patient.rbs).includes('mg') ? (patient.grbs || patient.rbs) : `${patient.grbs || patient.rbs} mg/dL`) : '--';
  const temp = patient.temp || patient.temperature ? (String(patient.temp || patient.temperature).includes('°') ? (patient.temp || patient.temperature) : `${patient.temp || patient.temperature} °F`) : '--';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Toggle Controls (Hidden during printing) */}
      <div className="no-print" style={{ marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem' }}>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
          <input
            type="checkbox"
            checked={showBgImage}
            onChange={(e) => setShowBgImage(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#007C91', cursor: 'pointer' }}
          />
          Show Background Prescription Template Image
        </label>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Uncheck if printing on pre-printed letterhead paper)</span>
      </div>

      {/* Main Printable Prescription Paper Container (Fixed 723:1024 Aspect Ratio matching image) */}
      <div
        className="prescription-paper child-rx-paper"
        id="printable-rx"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
          padding: '0',
          margin: '0 auto',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: '800px',
          aspectRatio: '723 / 1024',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* ===== 1. BACKGROUND TEMPLATE IMAGE LAYER ===== */}
        {showBgImage && (
          <img
            src="/child-prescription-bg.png"
            alt="Child Prescription Template"
            className="rx-bg-image"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* ===== 2. RECEPTIONIST DYNAMIC DETAILS OVERLAYER ===== */}
        <div className="child-rx-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
          {/* --- ROW 1: DATE & PATIENT ID --- */}
          {/* Date */}
          <div style={{
            position: 'absolute',
            top: '30.5%',
            left: '13.5%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#007C91',
            letterSpacing: '0.02em',
            transform: 'translateY(1px)'
          }}>
            {formattedDate}
          </div>

          {/* Patient ID */}
          <div style={{
            position: 'absolute',
            top: '30.5%',
            left: '73.5%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#007C91',
            letterSpacing: '0.02em',
            transform: 'translateY(1px)'
          }}>
            {patientId}
          </div>

          {/* --- ROW 2: PATIENT NAME, AGE, GENDER, HT, WT, PH --- */}
          {/* Patient Name */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '16.0%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 900,
            color: '#0f172a',
            textTransform: 'uppercase',
            maxWidth: '105px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transform: 'translateY(1px)'
          }}>
            {name}
          </div>

          {/* Age */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '37.5%',
            fontSize: '0.67rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            maxWidth: '45px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transform: 'translateY(1px)'
          }}>
            {age}
          </div>

          {/* Gender */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '50.5%',
            fontSize: '0.67rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'capitalize',
            maxWidth: '45px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transform: 'translateY(1px)'
          }}>
            {gender}
          </div>

          {/* Height (HT) */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '61.2%',
            fontSize: '0.67rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            maxWidth: '45px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transform: 'translateY(1px)'
          }}>
            {height}
          </div>

          {/* Weight (WT) */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '71.5%',
            fontSize: '0.67rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            maxWidth: '45px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transform: 'translateY(1px)'
          }}>
            {weight}
          </div>

          {/* Phone (Ph) */}
          <div style={{
            position: 'absolute',
            top: '35.3%',
            left: '81.8%',
            fontSize: '0.65rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            maxWidth: '82px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            letterSpacing: '-0.03em',
            transform: 'translateY(1px)'
          }}>
            {phone}
          </div>

          {/* --- ROW 3: VITALS (BP, HR, SPO2, GRBS, TEMP) --- */}
          {/* BP */}
          <div style={{
            position: 'absolute',
            top: '40.3%',
            left: '7.8%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            transform: 'translateY(1px)'
          }}>
            {bp}
          </div>

          {/* HR */}
          <div style={{
            position: 'absolute',
            top: '40.3%',
            left: '23.8%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            transform: 'translateY(1px)'
          }}>
            {hr}
          </div>

          {/* SpO2 */}
          <div style={{
            position: 'absolute',
            top: '40.3%',
            left: '40.5%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            transform: 'translateY(1px)'
          }}>
            {spo2}
          </div>

          {/* GRBS / Sugar */}
          <div style={{
            position: 'absolute',
            top: '40.3%',
            left: '64.0%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            transform: 'translateY(1px)'
          }}>
            {grbs}
          </div>

          {/* TEMP */}
          <div style={{
            position: 'absolute',
            top: '40.3%',
            left: '83.2%',
            fontSize: '0.68rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#0f172a',
            transform: 'translateY(1px)'
          }}>
            {temp}
          </div>
        </div>

        {/* ===== 3. MAIN PRESCRIPTION CONTENT AREA (Medicines Table / Canvas Drawing) ===== */}
        <div style={{
          position: 'absolute',
          top: '44.8%',
          left: '11.5%',
          right: '4.5%',
          bottom: '20.0%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {patient.prescriptionImg ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={patient.prescriptionImg}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  border: 'none',
                  background: 'transparent',
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.15)'
                }}
                alt="Prescription Sheet"
              />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {patient.prescription && patient.prescription.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #007C91', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem 0.45rem', color: '#007C91', width: '32%' }}>Medicine Name & Strength</th>
                      <th style={{ padding: '0.4rem 0.45rem', color: '#007C91', width: '15%' }}>Route</th>
                      <th style={{ padding: '0.4rem 0.45rem', color: '#007C91', width: '23%' }}>Dosage / Frequency</th>
                      <th style={{ padding: '0.4rem 0.45rem', color: '#007C91', width: '15%' }}>Instructions</th>
                      <th style={{ padding: '0.4rem 0.45rem', textAlign: 'right', width: '15%', color: '#E53935' }}>Duration & Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.prescription.map((m, i) => {
                      const strength = m.strength || (m.name.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg)\b/i)?.[0] || '');
                      const route = m.route || (m.isSyrup || m.name.toLowerCase().includes('syrup') ? 'Oral (Syrup)' : m.name.toLowerCase().includes('inj') ? 'IV / IM' : 'Oral (Tab)');
                      const instructions = m.instructions || (m.dosage.toLowerCase().includes('before food') ? 'Before Food' : m.dosage.toLowerCase().includes('after food') ? 'After Food' : m.dosage.toLowerCase().includes('sos') ? 'SOS' : 'After Food');
                      const qty = m.quantity || (m.isSyrup || m.name.toLowerCase().includes('syrup') ? '1 Bottle' : `${calculateTabletQty(m.dosage, m.duration)} Tabs`);

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem 0.45rem', fontWeight: 700, color: '#0f172a' }}>
                            {m.name}
                            {strength && !m.name.toLowerCase().includes(strength.toLowerCase()) ? (
                              <span style={{ fontSize: '0.72rem', color: '#007C91', fontWeight: 600, marginLeft: '0.25rem' }}>({strength})</span>
                            ) : null}
                          </td>
                          <td style={{ padding: '0.4rem 0.45rem', color: '#475569', fontSize: '0.74rem' }}>{route}</td>
                          <td style={{ padding: '0.4rem 0.45rem', color: '#334155', fontWeight: 600 }}>{m.dosage}</td>
                          <td style={{ padding: '0.4rem 0.45rem', color: '#059669', fontWeight: 600, fontSize: '0.74rem' }}>{instructions}</td>
                          <td style={{ padding: '0.4rem 0.45rem', textAlign: 'right', fontWeight: 800, color: '#E53935' }}>
                            {m.duration} Days
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>({qty})</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildPrescriptionTemplate;
