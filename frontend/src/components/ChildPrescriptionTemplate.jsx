import React from 'react';

// Child / Pediatric Prescription Template Component
const ChildPrescriptionTemplate = ({ patient }) => {
  if (!patient) return null;

  const formattedDate = new Date(patient.registrationDate || Date.now()).toLocaleDateString('en-GB');

  return (
    <div className="prescription-paper child-rx-paper" id="printable-rx" style={{
      background: '#ffffff',
      color: '#1e293b',
      fontFamily: '"Outfit", "Inter", sans-serif',
      padding: '0',
      border: '1.5px solid #0284c7',
      borderRadius: '16px',
      maxWidth: '8.5in',
      margin: '0 auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      overflow: 'hidden',
      boxShadow: 'none'
    }}>
      {/* ===== 1. TOP HEADER BANNER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        padding: '0.8rem 1.2rem 0.4rem 1.2rem',
        borderBottom: '2px solid #e0f2fe',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Left Side: Brand Logo, Title & Tagline */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
              <path d="M50 88 C20 60 5 40 5 25 A 20 20 0 0 1 45 15 L50 20 L55 15 A 20 20 0 0 1 95 25 C95 40 80 60 50 88 Z" fill="#e11d48" opacity="0.9" />
              <path d="M50 78 C28 54 15 38 15 26 A 14 14 0 0 1 45 18 L50 23 L55 18 A 14 14 0 0 1 85 26 C85 38 72 54 50 78 Z" fill="#0284c7" />
              <rect x="44" y="32" width="12" height="26" rx="2" fill="#ffffff" />
              <rect x="37" y="39" width="26" height="12" rx="2" fill="#ffffff" />
            </svg>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#e11d48', fontFamily: 'Latha, sans-serif', lineHeight: 1 }}>
                விஜயலெட்சுமி
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369a1', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                HEALTH CARE
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginTop: '0.2rem', letterSpacing: '0.02em' }}>
            Compassionate Care • Trusted Hands • Healthy Future
            <span style={{ color: '#e11d48', marginLeft: '0.3rem' }}>♥</span>
          </div>
        </div>

        {/* Center: Playful Motto Text */}
        <div style={{ textAlign: 'center', padding: '0 0.8rem' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'cursive, sans-serif' }}>
            <span style={{ color: '#0284c7' }}>Healthy </span>
            <span style={{ color: '#e11d48' }}>Kids </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'cursive, sans-serif', marginTop: '-0.2rem' }}>
            <span style={{ color: '#16a34a' }}>Happy </span>
            <span style={{ color: '#0284c7' }}>Future</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#f59e0b', marginTop: '0.1rem' }}>☀️ 🎈 🎨</div>
        </div>

        {/* Right Side: Pediatric Photo Container */}
        <div style={{ width: '130px', height: '85px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #38bdf8', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)', background: '#e0f2fe' }}>
          <img
            src="https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80"
            alt="Happy Child Patient"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* ===== 2. DOCTOR & CONTACT INFO BAR ===== */}
      <div style={{
        padding: '0.45rem 1.2rem',
        background: '#ffffff',
        borderBottom: '1px solid #cbd5e1',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        fontSize: '0.72rem'
      }}>
        {/* Doctor Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
            👨‍⚕️
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#e11d48' }}>Dr. S. Vijayalakshmi</div>
            <div style={{ fontSize: '0.66rem', color: '#334155', fontWeight: 700 }}>MBBS, DCH (Paediatrics) &nbsp;|&nbsp; <span style={{ color: '#0284c7' }}>Consultant Paediatrician</span></div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Reg No: 12345</div>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ fontSize: '0.64rem', color: '#334155', lineHeight: '1.35', textAlign: 'left', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 0.8rem' }}>
          <div>📞 <strong>+91 94890 48507</strong> / 04564-271393</div>
          <div>✉️ vijayalakshmihealthcare@gmail.com</div>
          <div>📍 RM Complex, Railway Road, Kallidan, TN.</div>
        </div>

        {/* Date & OP No */}
        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>
          <div>Date : <span style={{ color: '#0f172a', fontWeight: 900 }}>{formattedDate}</span></div>
          <div style={{ marginTop: '0.2rem' }}>OP No : <span style={{ color: '#e11d48', fontWeight: 900 }}>{patient.tokenNo || patient.id || '--'}</span></div>
        </div>
      </div>

      {/* ===== 3. CHILD PATIENT DETAILS GRID ===== */}
      <div style={{ padding: '0.5rem 1.2rem 0.3rem 1.2rem' }}>
        <div style={{
          border: '1.5px solid #cbd5e1',
          borderRadius: '10px',
          padding: '0.5rem 0.85rem',
          fontSize: '0.74rem',
          background: '#fafafa'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1.5rem', marginBottom: '0.3rem' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Patient Name : </span>
              <strong style={{ fontSize: '0.95rem', color: '#0284c7', textTransform: 'uppercase' }}>{patient.name}</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Contact No : </span>
              <strong style={{ color: '#0f172a' }}>{patient.contact || '--'}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '0.35rem 1rem', marginBottom: '0.3rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Age : </span>
              <strong style={{ color: '#0f172a' }}>{patient.age} Yrs</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Gender : </span>
              <strong style={{ color: '#0f172a' }}>{patient.gender}</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Weight : </span>
              <strong style={{ color: '#0f172a' }}>{patient.weight ? `${patient.weight} kg` : '--'}</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Temp : </span>
              <strong style={{ color: '#0f172a' }}>{patient.temp ? `${patient.temp}°F` : '--'}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#475569' }}>Parent / Guardian : </span>
              <strong style={{ color: '#1e293b' }}>{patient.fatherOrHusbandName || patient.motherOrGuardianName || '--'}</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#e11d48' }}>Allergies (If any) : </span>
              <strong style={{ color: '#e11d48' }}>{patient.allergies || 'None'}</strong>
            </div>
          </div>

          {patient.address && (
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem', marginTop: '0.3rem' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Address : </span>
              <strong style={{ color: '#1e293b' }}>{patient.address}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ===== 4. RX DRAWING CANVAS / MEDICATION TABLE ===== */}
      <div style={{ padding: '0.2rem 1.2rem 0.4rem 1.2rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="rx-drawing-area" style={{
          border: '2px solid #0284c7',
          borderRadius: '14px',
          minHeight: '3.6in',
          maxHeight: '6.0in',
          padding: '0.4rem',
          position: 'relative',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1
        }}>
          {/* Rx Badge Icon Top Left */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: '#0284c7',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1.2rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '6px',
            fontFamily: 'serif',
            zIndex: 5
          }}>
            ℞
          </div>

          <div style={{ marginTop: '2rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {patient.prescriptionImg ? (
              <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <img
                  src={patient.prescriptionImg}
                  style={{ maxWidth: '100%', height: '100%', maxHeight: '5.9in', objectFit: 'contain', border: 'none', background: 'transparent' }}
                  alt="Child Prescription Sheet"
                />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #0284c7', background: '#e0f2fe', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.6rem', color: '#0284c7', width: '45%' }}>Medicine Name</th>
                    <th style={{ padding: '0.5rem 0.6rem', color: '#0284c7', width: '35%' }}>Dosage / Frequency</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right', width: '20%', color: '#e11d48' }}>Duration</th>
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
      </div>

      {/* ===== 5. BOTTOM CURVED BLUE FOOTER (Reaches up to the Red Line height: 125px) ===== */}
      <div style={{ position: 'relative', width: '100%', height: '125px', background: '#ffffff', overflow: 'hidden', marginTop: 'auto' }}>
        {/* Top Dip-Curved Cyan/Blue Swoosh SVG (Extended Upward Curve) */}
        <svg viewBox="0 0 800 125" width="100%" height="125" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1 }}>
          {/* Lighter Cyan Accent Wave */}
          <path d="M 0,15 Q 400,85 800,15 L 800,125 L 0,125 Z" fill="#38bdf8" />
          {/* Main Cyan/Teal Dip Curve reaching up to red line */}
          <path d="M 0,28 Q 400,98 800,28 L 800,125 L 0,125 Z" fill="#0284c7" />
        </svg>

        {/* Footer Overlay Content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0.6rem 1.2rem 0.5rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', boxSizing: 'border-box' }}>
          {/* Left Side: Hospital Emergency & Info */}
          <div style={{ fontSize: '0.66rem', color: '#ffffff', textAlign: 'left', lineHeight: '1.4', paddingBottom: '0.2rem' }}>
            <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '0.78rem' }}>Vijaya's Health Care - 24/7 Emergency & Multispecialty</div>
            <div style={{ color: '#e0f2fe', fontWeight: 600 }}>Please bring this prescription sheet for your follow-up visit.</div>
          </div>

          {/* Right Side: Doctor Signature Line */}
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', padding: '0.3rem 0.6rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', marginBottom: '0.2rem' }}>
            <div style={{ borderBottom: '1.5px dotted #0284c7', width: '1.8in', height: '14px', marginBottom: '0.25rem' }}></div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7' }}>
              Doctor's Signature & Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildPrescriptionTemplate;
