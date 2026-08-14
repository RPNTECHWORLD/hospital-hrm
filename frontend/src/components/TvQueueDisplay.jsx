import React, { useState, useEffect } from 'react';
import { Monitor, LogOut } from 'lucide-react';

const isSameDayStr = (d1, d2) => {
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  const dateA = new Date(d1);
  const dateB = new Date(d2);
  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
  }
  return false;
};

const TvQueueDisplay = ({ patients, doctors, onExit }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);

  const DOCTORS_PER_PAGE = 2;
  const totalPages = Math.ceil(doctors.length / DOCTORS_PER_PAGE) || 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic Page Rotation for Doctors (2 per page)
  useEffect(() => {
    if (totalPages <= 1) return;
    const pageTimer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 3000);
    return () => clearInterval(pageTimer);
  }, [totalPages]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [doctors.length, totalPages, currentPage]);

  const displayedDoctors = doctors.slice(
    currentPage * DOCTORS_PER_PAGE,
    (currentPage + 1) * DOCTORS_PER_PAGE
  );

  return (
    <div className="tv-container" style={{
      background: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* Top Banner */}
      <header className="tv-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid #3b82f6',
        paddingBottom: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            padding: '0.75rem',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Monitor size={32} color="#ffffff" />
          </div>
          <div>
            <h1 className="tv-title" style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#ffffff' }}>
              VIJAYAS HOSPITAL <span style={{ color: '#60a5fa', fontWeight: 400 }}>LIVE QUEUE MONITOR</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{
                width: '10px',
                height: '10px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'inline-block'
              }}></span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>LIVE UPDATES ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Time, Page Indicator and Exit */}
        <div className="tv-header-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              color: '#60a5fa',
              fontSize: '0.9rem',
              fontWeight: 700
            }}>
              <span>PAGE {currentPage + 1} OF {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    style={{
                      width: idx === currentPage ? '18px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: idx === currentPage ? '#3b82f6' : 'rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={onExit}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontSize: '0.85rem'
            }}
          >
            Exit Display
          </button>
        </div>
      </header>

      {/* Main Boards Grid */}
      <div 
        key={currentPage}
        className="tv-boards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          flexGrow: 1
        }}
      >
        {displayedDoctors.map(doctor => {
          // Filter patients assigned to this doctor for today's active queue (updates automatically day by day)
          const todayStr = currentTime.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
          const docPatients = patients.filter(p => {
            const matchesDoc = Number(p.assignedDoctorId) === Number(doctor.id) || String(p.assignedDoctorId) === String(doctor.id);
            if (!matchesDoc || p.status === 'Inactive') return false;

            return isSameDayStr(p.registrationDate, todayStr);
          });

          // Now Consulting patient
          const nowConsulting = docPatients.find(p => p.status === 'Consulting');

          // Up Next patients (status is In Queue, Registered, or Waiting, sorted by Token Number)
          const upNext = docPatients
            .filter(p => ['In Queue', 'Registered', 'Waiting'].includes(p.status))
            .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

          // Skipped patients on hold
          const skippedList = docPatients
            .filter(p => p.status === 'Skipped')
            .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

          return (
            <div key={doctor.id} className="tv-doctor-card" style={{
              background: '#1e293b',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              {/* Doctor Details */}
              <div style={{
                borderBottom: '2px solid rgba(255,255,255,0.05)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem'
              }}>
                <h2 className="tv-doctor-name" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#3b82f6' }}>{doctor.name}</h2>
                <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  {doctor.specialty} • ROOM 0{doctor.id}
                </div>
              </div>

              {/* Currently Consulting Board */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.1em',
                  marginBottom: '0.75rem'
                }}>
                  NOW CONSULTING
                </div>

                {nowConsulting ? (
                  <div className="tv-now-consulting-box" style={{
                    background: 'rgba(14, 165, 233, 0.15)',
                    border: '2px solid #0284c7',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem'
                  }}>
                    <div className="tv-token-badge" style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '2.2rem',
                      fontWeight: 950,
                      padding: '0.5rem 1.25rem',
                      borderRadius: '12px',
                      minWidth: '70px',
                      textAlign: 'center',
                      boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
                    }}>
                      {String(nowConsulting.tokenNumber).padStart(2, '0')}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 className="tv-patient-name" style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                        {nowConsulting.name}
                      </h3>
                      <div style={{ fontSize: '0.95rem', color: '#38bdf8', fontWeight: 500, marginTop: '0.25rem' }}>
                        In Consultation Room
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="tv-awaiting-box" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '2px dashed rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '1.75rem 1rem',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '1.2rem',
                    fontWeight: 600
                  }}>
                    Awaiting Next Patient
                  </div>
                )}
              </div>

              {/* Waiting Queue List */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>UP NEXT IN QUEUE</span>
                  <span style={{ color: '#3b82f6' }}>{upNext.length} WAITING</span>
                </div>

                {upNext.length === 0 ? (
                  <div style={{
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: '#475569',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Queue is empty.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    overflowY: 'auto',
                    maxHeight: '380px',
                    paddingRight: '0.5rem'
                  }}>
                    {upNext.map((patient, index) => (
                      <div
                        key={patient.id}
                        style={{
                          background: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          border: index === 0 ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '16px',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{
                            background: index === 0 ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                            color: index === 0 ? '#ffffff' : '#94a3b8',
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '8px',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}>
                            {String(patient.tokenNumber).padStart(2, '0')}
                          </span>
                          <span style={{
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: index === 0 ? '#ffffff' : '#cbd5e1'
                          }}>
                            {patient.name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: index === 0 ? '#60a5fa' : '#64748b',
                          fontWeight: 600
                        }}>
                          {index === 0 ? 'NEXT' : 'WAITING'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skipped List */}
              {skippedList.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    SKIPPED / ON HOLD ({skippedList.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {skippedList.map(sp => (
                      <span key={sp.id} style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                        #{String(sp.tokenNumber || '--').padStart(2, '0')} {sp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer ticker info */}
      <footer style={{
        marginTop: '2rem',
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#ef4444',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.8rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          ANNOUNCEMENT
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#cbd5e1',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexGrow: 1
        }}>
          Please cooperate with clinic staff. Wait for your Token Number to be called before entering the consultation room. Thank you.
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Developed by <span style={{ color: '#38bdf8', fontWeight: 800 }}>RPN Tech World</span>
        </div>
      </footer>
    </div>
  );
};

export default TvQueueDisplay;
