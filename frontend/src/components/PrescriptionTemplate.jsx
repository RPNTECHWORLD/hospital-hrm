import React from 'react';

// React Component for Vijaya's Hospital Logo
export const VijayasHospitalLogo = ({ width = 245, height = 62 }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.1rem' }}>
      <img
        src="/vijayas-logo.svg"
        alt="Vijaya's Health Care Logo"
        style={{
          width: `${width}px`,
          maxWidth: `${width}px`,
          height: 'auto',
          maxHeight: `${height}px`,
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/vijayas-logo.png';
        }}
      />
    </div>
  );
};

const PrescriptionTemplate = ({ patient }) => {
  if (!patient) return null;

  const formattedDate = new Date(patient.registrationDate || Date.now()).toLocaleDateString('en-GB');

  return (
    <div className="prescription-paper" id="printable-rx" style={{
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: '"Outfit", "Inter", sans-serif',
      padding: '0',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      maxWidth: '8.5in',
      margin: '0 auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      overflow: 'hidden',
      boxShadow: 'none'
    }}>
      {/* ===== TOP HEADER: Clean Proportions ===== */}
      <div style={{ position: 'relative', width: '100%', minHeight: '148px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        {/* Top Header Arched Swoosh SVG */}
        <svg viewBox="0 0 800 150" width="100%" height="180" preserveAspectRatio="none" style={{ position: 'absolute', top: '0', left: '0', zIndex: 1 }}>
          <path d="M 0,0 L 450,0 Q 270,140 0,140 Z" fill="#008099" />
          <path d="M 0,132 Q 282,142 468,0 L 480,0 Q 295,152 0,140 Z" fill="#e11d48" />
        </svg>

        {/* Header Overlay Content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0.75rem 1.2rem 0.4rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left Side (Over Teal Swoosh) */}
          <div style={{ width: '52%', color: '#ffffff', textAlign: 'left', paddingTop: '0.1rem' }}>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, fontFamily: 'Latha, sans-serif', textShadow: '0 2px 4px rgba(0,0,0,0.25)', lineHeight: 1.1 }}>
              விஜயலெட்சுமி
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e0f2fe', marginTop: '0.15rem' }}>
              முழுமையான நலம் மகிழ்ச்சியான வாழ்க்கை
            </div>
            <div style={{ fontSize: '0.88rem', color: '#ffffff', marginTop: '0.4rem', lineHeight: '1.38', fontWeight: 700, letterSpacing: '0.01em' }}>
              <div>Rtn Dr. N. ANBU, M.B.B.S., FIDM, FCCM</div>
              <div>Dr. SINDHUJA ANBU, M.B.B.S., DNB (Pediatrics)</div>
              <div>DR. N. ARAVINDRAJ M.B.B.S.,</div>
            </div>
          </div>

          {/* Right Side: Logo & Contact Block */}
          <div style={{ width: '50%', flexDirection: 'column', justifyContent: 'flex-start', textAlign: 'right', display: 'flex', alignItems: 'flex-end', paddingLeft: '0px', marginLeft: 'auto' }}>
            <VijayasHospitalLogo width={300} height={120} />

            <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '0.35rem', lineHeight: '1.4', textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: '#008099' }}>RM Complex, Railway Road, Kallidan, TN.</div>
              <div style={{ fontWeight: 800, color: '#008099' }}>
                <span style={{ color: '#e11d48' }}>Ph: 04564-271393</span> &nbsp;|&nbsp; Mob: 94890 48507
              </div>
              <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>E-mail: vijayashealthcare@gmail.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MIDDLE CONTENT BODY ===== */}
      <div style={{ padding: '0.5rem 1.2rem 0.6rem 1.2rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Patient Summary Card */}
        <div style={{
          border: '1.5px solid #7dd3fc',
          borderRadius: '10px',
          marginBottom: '0.6rem',
          fontSize: '0.88rem',
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0, 128, 153, 0.05)'
        }}>
          {/* Top Date Strip */}
          <div style={{
            display: 'flex',
            justify: 'flex-start',
            background: '#e0f2fe',
            borderBottom: '1px solid #bae6fd',
            padding: '0.35rem 0.85rem',
            fontWeight: 800,
            color: '#008099'
          }}>
            <div>DATE: <span style={{ color: '#0f172a', fontWeight: 900 }}>{formattedDate}</span></div>
          </div>

          {/* Patient Details Row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', alignItems: 'center' }}>
            <div style={{ width: '42%', borderRight: '1px solid #cbd5e1', paddingRight: '0.5rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PATIENT NAME</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#008099', textTransform: 'uppercase' }}>{patient.name}</div>
              {patient.contact && <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>Ph: {patient.contact}</div>}
            </div>

            <div style={{ width: '58%', paddingLeft: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700 }}>AGE: </span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{patient.age} Yrs</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700 }}>GENDER: </span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{patient.gender}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700 }}>HT: </span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{patient.height || '--'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700 }}>WT: </span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{patient.weight || '--'}</strong>
              </div>
            </div>
          </div>

          {(patient.fatherOrHusbandName || patient.motherOrGuardianName || patient.address) && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.68rem', flexWrap: 'wrap', padding: '0.25rem 0.85rem', gap: '1rem' }}>
              {patient.fatherOrHusbandName && <div><span style={{ color: '#64748b', fontWeight: 700 }}>Father/Husband:</span> <strong style={{ color: '#1e293b' }}>{patient.fatherOrHusbandName}</strong></div>}
              {patient.motherOrGuardianName && <div><span style={{ color: '#64748b', fontWeight: 700 }}>Mother/Guardian:</span> <strong style={{ color: '#1e293b' }}>{patient.motherOrGuardianName}</strong></div>}
              {patient.address && <div><span style={{ color: '#64748b', fontWeight: 700 }}>Address:</span> <strong style={{ color: '#1e293b' }}>{patient.address}</strong></div>}
            </div>
          )}

          {/* Vitals Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.8rem',
            padding: '0.45rem 0.85rem',
            background: '#e0f2fe',
            justify: 'flex-start',
            alignItems: 'center',
            fontWeight: 800,
            fontSize: '0.78rem',
            color: '#008099'
          }}>
            <div>BP: &nbsp;<span style={{ color: '#0f172a', fontWeight: 900 }}>{patient.bp || '--'}</span></div>
            <div>HR: &nbsp;<span style={{ color: '#0f172a', fontWeight: 900 }}>{patient.hr || '--'}</span></div>
            <div>SpO₂: &nbsp;<span style={{ color: '#0f172a', fontWeight: 900 }}>{patient.spo2 ? `${patient.spo2}%` : '--'}</span></div>
            <div>GRBS / Sugar: &nbsp;<span style={{ color: '#e11d48', fontWeight: 900 }}>{patient.grbs || '--'}</span></div>
            <div>TEMP: &nbsp;<span style={{ color: '#0f172a', fontWeight: 900 }}>{patient.temp ? `${patient.temp}°F` : '--'}</span></div>
          </div>
        </div>

        {/* Rx Symbol Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '0.4rem',
          borderBottom: '2.5px solid #008099',
          paddingBottom: '0.15rem'
        }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#e11d48', fontFamily: '"Georgia", serif', lineHeight: 1 }}>
            ℞
          </div>
        </div>

        {/* Main Rx Drawing Canvas or Medication Table */}
        <div className="rx-drawing-area" style={{
          minHeight: '3.0in',
          maxHeight: '6.0in',
          padding: '0.25rem',
          textAlign: 'left',
          position: 'relative',
          background: '#ffffff',
          marginBottom: '0.3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexGrow: 1
        }}>
          {patient.prescriptionImg ? (
            <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <img
                src={patient.prescriptionImg}
                style={{ maxWidth: '100%', height: '100%', maxHeight: '5.9in', objectFit: 'contain', border: 'none', background: 'transparent' }}
                alt="Prescription Sheet"
              />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #008099', background: '#e0f2fe', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.6rem', color: '#008099', width: '45%' }}>Medicine Name</th>
                  <th style={{ padding: '0.5rem 0.6rem', color: '#008099', width: '35%' }}>Dosage / Frequency</th>
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right', width: '20%', color: '#008099' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {patient.prescription?.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#0f172a' }}>{m.name}</td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#334155' }}>{m.dosage}</td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 800, color: '#e11d48' }}>{m.duration} Days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== BOTTOM FOOTER ===== */}
      <div style={{ position: 'relative', width: '100%', marginBottom: '0', height: '85px', background: '#ffffff', overflow: 'hidden', marginTop: 'auto' }}>
        {/* Bottom-Right Curved Swoosh SVG */}
        <svg viewBox="0 0 800 95" width="100%" height="95" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 1 }}>
          <path d="M 340,95 Q 560,20 800,20 L 800,95 Z" fill="#e11d48" />
          <path d="M 360,95 Q 580,30 800,30 L 800,95 Z" fill="#008099" />
        </svg>

        {/* Footer Overlay Content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0.35rem 1.2rem 0.5rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '0.64rem', color: '#475569', textAlign: 'left', lineHeight: '1.38' }}>
            <div style={{ fontWeight: 900, color: '#008099' }}>Vijaya's Health Care - 24/7 Emergency & Multispecialty</div>
            <div>Please bring this prescription sheet for your follow-up visit.</div>
          </div>

          <div style={{ textAlign: 'center', width: '2.1in', background: '#ffffff', padding: '0.25rem 0.4rem', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', marginRight: '0.4rem', zIndex: 15 }}>
            <div style={{ borderBottom: '1.5px dotted #008099', height: '14px', marginBottom: '0.25rem' }}></div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#008099' }}>
              Doctor's Signature & Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionTemplate;