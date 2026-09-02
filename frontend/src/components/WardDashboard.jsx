import React, { useState } from 'react';
import { Bed, UserCheck, ShieldAlert, LogOut, CheckCircle, Plus, Loader2, AlertTriangle, ArrowRight, X } from 'lucide-react';

const WardDashboard = ({ patients = [], doctors = [], onAssignBed, onDischargePatient }) => {
  const [processingPatientId, setProcessingPatientId] = useState(null);
  const [processedPatientIds, setProcessedPatientIds] = useState([]);
  const [bedConflictData, setBedConflictData] = useState(null);
  // Let's configure a list of mock rooms and beds
  // 10 beds: Room 101 (Beds A, B), Room 102 (Beds A, B), Room 103 (Beds A, B), Room 104 (Beds A, B), Room 105 (Beds A, B)
  const [beds, setBeds] = useState([
    { id: '101A', room: '101', name: 'Bed A', patientId: null },
    { id: '101B', room: '101', name: 'Bed B', patientId: null },
    { id: '102A', room: '102', name: 'Bed A', patientId: null },
    { id: '102B', room: '102', name: 'Bed B', patientId: null },
    { id: '103A', room: '103', name: 'Bed A', patientId: null },
    { id: '103B', room: '103', name: 'Bed B', patientId: null },
    { id: '104A', room: '104', name: 'Bed A', patientId: null },
    { id: '104B', room: '104', name: 'Bed B', patientId: null },
    { id: '105A', room: '105', name: 'Bed A', patientId: null },
    { id: '105B', room: '105', name: 'Bed B', patientId: null }
  ]);

  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const formatDoctorDisplay = (docId) => {
    if (!docId) return 'Assigned Doctor';
    const d = (doctors || []).find(doc => String(doc.id) === String(docId));
    if (!d || !d.name) return `Doctor (ID: ${docId})`;
    const name = d.name.trim();
    return name.toLowerCase().startsWith('dr.') || name.toLowerCase().startsWith('dr ') ? name : `Dr. ${name}`;
  };

  const getOccupiedBedInfo = (bedId, excludePatientId) => {
    if (!bedId) return null;
    return (patients || []).find(p => 
      p &&
      String(p.id) !== String(excludePatientId) &&
      p.status !== 'Inactive' &&
      p.wardBedId === bedId &&
      (!p.bedAdmissionPending || p.bedAdmissionPending == 0 || p.bedAdmissionPending === '0' || p.bedAdmissionPending === false)
    );
  };

  const handleConfirmAdmit = async (patientId, bedId) => {
    const cleanPid = String(patientId || '').replace(/#/g, '').trim();
    setProcessedPatientIds(prev => [...prev, String(patientId), cleanPid, `#${cleanPid}`]);
    setProcessingPatientId(patientId);
    // Instant optimistic assignment to local bed card
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patientId } : (b.patientId === patientId ? { ...b, patientId: null } : b)));
    try {
      await onAssignBed(patientId, bedId);
    } catch (err) {
      console.error("Failed to assign bed:", err);
    } finally {
      setProcessingPatientId(null);
      setBedConflictData(null);
    }
  };

  const handleAcceptPendingAdmit = async (patientId, bedId) => {
    const cleanPid = String(patientId || '').replace(/#/g, '').trim();
    const incomingPatient = (patients || []).find(p => String(p.id).replace(/#/g, '').trim() === cleanPid);

    // Check if the requested bed is ALREADY occupied by another patient
    const occupant = getOccupiedBedInfo(bedId, patientId);
    if (occupant) {
      // Compute truly available beds right now
      const occupiedIds = (patients || [])
        .filter(p => p.status !== 'Inactive' && p.wardBedId && (!p.bedAdmissionPending || p.bedAdmissionPending == 0 || p.bedAdmissionPending === '0' || p.bedAdmissionPending === false))
        .map(p => p.wardBedId);
      const freeBeds = beds.filter(b => !occupiedIds.includes(b.id));

      setBedConflictData({
        patient: incomingPatient || { id: patientId, name: 'Patient' },
        requestedBedId: bedId,
        occupant: occupant,
        selectedNewBed: freeBeds.length > 0 ? freeBeds[0].id : '',
        availableBeds: freeBeds
      });
      return;
    }

    // If bed is completely free, proceed directly
    await handleConfirmAdmit(patientId, bedId);
  };

  const handleDeclinePendingAdmit = async (patientId) => {
    const cleanPid = String(patientId || '').replace(/#/g, '').trim();
    setProcessedPatientIds(prev => [...prev, String(patientId), cleanPid, `#${cleanPid}`]);
    setProcessingPatientId(patientId);
    try {
      await onDischargePatient(patientId);
    } catch (err) {
      console.error("Failed to decline pending bed admit:", err);
    } finally {
      setProcessingPatientId(null);
    }
  };



  // Sync beds state when patients prop changes
  React.useEffect(() => {
    setBeds(prev => prev.map(bed => {
      const patient = patients.find(p => p.wardBedId === bed.id && p.status !== 'Inactive');
      return patient ? { ...bed, patientId: patient.id } : { ...bed, patientId: null };
    }));
  }, [patients]);

  // Find all patients not currently in a bed but registered/active
  // For demonstration, we can list all active patients to admit.
  const eligiblePatients = patients.filter(p => !beds.some(b => b.patientId === p.id) && p.status !== 'Completed' && p.status !== 'Inactive');

  const handleSelectBed = (bed) => {
    setSelectedBed(bed);
    setSelectedPatientId('');
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId.trim()) return;

    const val = selectedPatientId.trim();
    const matched = patients.find(p => 
      String(p.id).toLowerCase() === val.toLowerCase() ||
      String(p.id).replace(/#/g, '').toLowerCase() === val.replace(/#/g, '').toLowerCase() ||
      p.name.toLowerCase() === val.toLowerCase() ||
      p.name.toLowerCase().includes(val.toLowerCase())
    );

    const targetPid = matched ? matched.id : val;

    const updatedBeds = beds.map(b => {
      if (b.id === selectedBed.id) {
        return { ...b, patientId: targetPid };
      }
      return b;
    });

    setBeds(updatedBeds);
    onAssignBed(targetPid, selectedBed.id);
    setSelectedBed(null);
    setSelectedPatientId('');
  };

  const handleDischarge = (bedId) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patientId) return;

    onDischargePatient(bed.patientId);

    const updatedBeds = beds.map(b => {
      if (b.id === bedId) {
        return { ...b, patientId: null };
      }
      return b;
    });

    setBeds(updatedBeds);
  };

  const occupiedBedsCount = beds.filter(b => b.patientId !== null).length;
  const availableBedsCount = beds.length - occupiedBedsCount;

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Bed size={24} />
          </div>
          <div>
            <div className="stat-value">{beds.length}</div>
            <div className="stat-label">Total Ward Beds</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Bed size={24} />
          </div>
          <div>
            <div className="stat-value">{occupiedBedsCount}</div>
            <div className="stat-label">Occupied Beds</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{availableBedsCount}</div>
            <div className="stat-label">Available Beds</div>
          </div>
        </div>
      </div>

      {/* Pending Bed Request Notification Banner */}
      {(() => {
        const pendingRequests = (patients || []).filter(p => 
          p && p.status !== 'Inactive' && 
          !processedPatientIds.includes(String(p.id)) &&
          (p.bedAdmissionPending == 1 || p.bedAdmissionPending === '1' || p.bedAdmissionPending === true || p.bedadmissionpending == 1)
        );

        if (pendingRequests.length === 0) return null;
        
        return (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderLeft: '5px solid var(--warning)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.12)'
          }}>
            <h4 style={{ margin: 0, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800 }}>
              <ShieldAlert size={20} />
              Incoming Bed Admission Requests ({pendingRequests.length})
            </h4>
            <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Doctor has requested bed admissions for the following patients. Please confirm or decline.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingRequests.map(p => {
                const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PT';
                const conflictOccupant = getOccupiedBedInfo(p.wardBedId, p.id);

                return (
                  <div 
                    key={p.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'var(--bg-card, #ffffff)',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      border: conflictOccupant ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.25)',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        background: conflictOccupant ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                        color: conflictOccupant ? '#dc2626' : '#d97706', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 800,
                        fontSize: '0.95rem' 
                      }}>
                        {initials}
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>{p.name}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({p.id})</span>
                          {conflictOccupant && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#b45309',
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              borderRadius: '6px',
                              padding: '0.18rem 0.6rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              <AlertTriangle size={13} style={{ color: '#d97706' }} /> Bed {p.wardBedId} occupied by {conflictOccupant.name} ({formatDoctorDisplay(conflictOccupant.assignedDoctorId)})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <span>{p.age} Yrs • {p.gender}</span>
                          <span style={{ color: 'var(--border)' }}>•</span>
                          <span>Doctor: <strong style={{ color: 'var(--text-primary)' }}>{formatDoctorDisplay(p.assignedDoctorId)}</strong></span>
                          <span style={{ color: 'var(--border)' }}>•</span>
                          <span>Requested: <strong style={{ color: conflictOccupant ? '#d97706' : 'var(--primary)' }}>Room {p.wardBedId?.slice(0, 3)} - Bed {p.wardBedId?.slice(3)}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn"
                        disabled={processingPatientId === p.id}
                        style={{ 
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.82rem', 
                          background: conflictOccupant ? '#f59e0b' : '#10b981', 
                          border: 'none', 
                          color: '#fff',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: processingPatientId === p.id ? 'not-allowed' : 'pointer',
                          opacity: processingPatientId === p.id ? 0.75 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: conflictOccupant ? '0 2px 8px rgba(245, 158, 11, 0.3)' : '0 2px 8px rgba(16, 185, 129, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleAcceptPendingAdmit(p.id, p.wardBedId)}
                      >
                        {processingPatientId === p.id ? (
                          <>
                            <Loader2 size={14} className="spin" /> Admitting...
                          </>
                        ) : conflictOccupant ? (
                          <>⚠️ Reassign & Admit Bed</>
                        ) : (
                          <>✓ Accept & Admit Bed</>
                        )}
                      </button>
                      <button 
                        className="btn"
                        disabled={processingPatientId === p.id}
                        style={{ 
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.82rem', 
                          background: 'transparent', 
                          border: '1.5px solid rgba(239, 68, 68, 0.4)', 
                          color: '#ef4444',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: processingPatientId === p.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleDeclinePendingAdmit(p.id)}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid-2">
        {/* Beds layout grid */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Bed size={20} style={{ color: 'var(--primary)' }} />
            Ward Room Occupancy Map
          </h3>

          <div className="beds-grid">
            {beds.map(bed => {
              const patient = patients.find(p => p.id === bed.patientId);
              const isOccupied = bed.patientId !== null;
              const isPending = patient && 
                !processedPatientIds.includes(String(patient.id)) && 
                !processedPatientIds.includes(String(patient.id).replace(/#/g, '')) && 
                (patient.bedAdmissionPending == 1 || patient.bedAdmissionPending === '1' || patient.bedAdmissionPending === true);


              return (
                <div 
                  key={bed.id} 
                  className="card" 
                  style={{ 
                    padding: '1.25rem', 
                    background: isPending ? 'rgba(245, 158, 11, 0.06)' : isOccupied ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
                    borderColor: isPending ? 'rgba(245, 158, 11, 0.4)' : isOccupied ? 'rgba(99, 102, 241, 0.3)' : 'var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room {bed.room}</span>
                      <h4 style={{ fontSize: '1.1rem', margin: '0.1rem 0 0 0' }}>{bed.name}</h4>
                    </div>
                    <span className={`badge ${
                      isPending ? 'badge-pending' : isOccupied ? 'badge-danger' : 'badge-success'
                    }`}>
                      {isPending ? 'Pending OK ⏳' : isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {isOccupied && patient ? (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.82rem', color: isPending ? '#d97706' : 'var(--text-secondary)', fontWeight: 600 }}>
                        {isPending ? 'Requested by Doctor:' : 'Admitted Patient:'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.gender} • {patient.age} Yrs • Reg: {patient.registrationDate || '--'}</div>
                      
                      {(() => {
                        let wardLogs = [];
                        if (patient.wardHistory) {
                          if (Array.isArray(patient.wardHistory)) wardLogs = patient.wardHistory;
                          else if (typeof patient.wardHistory === 'string') { try { wardLogs = JSON.parse(patient.wardHistory); } catch (e) {} }
                        }
                        const activeStay = wardLogs.find(s => s && (s.status === 'Admitted' || !s.dischargeDate));
                        if (!activeStay) return null;

                        return (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.73rem', color: '#0f766e', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            📅 Admitted: {activeStay.admitDate || '--'} • {activeStay.stayDuration || 'Day 1'}
                          </div>
                        );
                      })()}
                      
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                          <button 
                            className="btn btn-primary" 
                            disabled={processingPatientId === patient.id}
                            style={{ 
                              flexGrow: 1, 
                              padding: '0.45rem', 
                              fontSize: '0.8rem', 
                              background: '#10b981', 
                              borderColor: '#10b981',
                              fontWeight: 700,
                              cursor: processingPatientId === patient.id ? 'not-allowed' : 'pointer',
                              opacity: processingPatientId === patient.id ? 0.75 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => handleAcceptPendingAdmit(patient.id, bed.id)}
                          >
                            {processingPatientId === patient.id ? (
                              <>
                                <Loader2 size={13} className="spin" /> Confirming...
                              </>
                            ) : (
                              <>✓ Confirm</>
                            )}
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            disabled={processingPatientId === patient.id}
                            style={{ 
                              flexGrow: 1, 
                              padding: '0.45rem', 
                              fontSize: '0.8rem', 
                              color: '#ef4444', 
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              fontWeight: 700,
                              cursor: processingPatientId === patient.id ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleDischarge(bed.id)}
                          >
                            ✕ Decline
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginTop: '1rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={() => handleDischarge(bed.id)}
                        >
                          <LogOut size={12} /> Discharge Patient
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                      onClick={() => handleSelectBed(bed)}
                    >
                      <Plus size={12} /> Assign Patient
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div>
          {selectedBed ? (
            <div className="card fade-in">
              <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.75rem' }}>
                <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>
                  Assign Patient to Room {selectedBed.room} - {selectedBed.name}
                </h3>
                <button className="close-btn" onClick={() => setSelectedBed(null)}>✕</button>
              </div>

              <form onSubmit={handleAssign}>
                <div className="form-group">
                  <label className="form-label">Patient Name or UHID</label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="Enter Patient Name or UHID (e.g. Anu or #VH045)"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    autoFocus
                    required
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.45rem' }}>
                    Type the patient's name or UHID number to admit directly.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flexGrow: 1 }}
                    disabled={!selectedPatientId}
                  >
                    Confirm Bed Assignment
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedBed(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
              <Bed size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3>Bed Assignment & Discharges</h3>
              <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Select an available bed to admit an active patient, or discharge occupied beds.</p>
            </div>
          )}
        </div>
      </div>

      {/* Same Bed - Different Doctors: Bed Conflict Resolution Modal */}
      {bedConflictData && (
        <div 
          className="modal-backdrop fade-in" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}
          onClick={() => setBedConflictData(null)}
        >
          <div 
            className="card fade-in" 
            style={{
              maxWidth: '580px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#92400e',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    marginBottom: '0.3rem'
                  }}>
                    Bed Allocation Conflict
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Bed Already Occupied
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Room {bedConflictData.requestedBedId?.slice(0, 3)} - Bed {bedConflictData.requestedBedId?.slice(3)} was selected by multiple doctors. Please assign an alternative bed.
                  </p>
                </div>
              </div>
              <button 
                className="close-btn" 
                onClick={() => setBedConflictData(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Conflict Patient Comparison Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* Occupied Bed Info (Clean Slate Grey Card) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #64748b',
                borderRadius: '12px',
                padding: '1rem 1.15rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                    Current Occupant (Already Admitted)
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    background: '#e2e8f0', 
                    padding: '0.15rem 0.55rem', 
                    borderRadius: '6px' 
                  }}>
                    Room {bedConflictData.requestedBedId?.slice(0, 3)} • Bed {bedConflictData.requestedBedId?.slice(3)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                      {bedConflictData.occupant?.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.45rem' }}>
                      ({bedConflictData.occupant?.id})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Admitted by: <strong style={{ color: '#0f172a' }}>{formatDoctorDisplay(bedConflictData.occupant?.assignedDoctorId)}</strong>
                  </div>
                </div>
              </div>

              {/* Incoming Patient Info (Hospital Brand Teal Card) */}
              <div style={{
                background: 'rgba(21, 115, 136, 0.05)',
                border: '1px solid rgba(21, 115, 136, 0.22)',
                borderLeft: '4px solid #157388',
                borderRadius: '12px',
                padding: '1rem 1.15rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#0f766e', letterSpacing: '0.5px' }}>
                    Incoming Patient (Needs Bed Reassignment)
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: '#0369a1', 
                    background: '#e0f2fe', 
                    border: '1px solid #bae6fd',
                    padding: '0.15rem 0.55rem', 
                    borderRadius: '6px' 
                  }}>
                    Admission Pending
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                      {bedConflictData.patient?.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.45rem' }}>
                      ({bedConflictData.patient?.id})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Requested by: <strong style={{ color: '#0f172a' }}>{formatDoctorDisplay(bedConflictData.patient?.assignedDoctorId)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Bed Selection */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Bed size={16} style={{ color: '#157388' }} />
                Select Alternative Available Bed for {bedConflictData.patient?.name}:
              </label>

              {bedConflictData.availableBeds && bedConflictData.availableBeds.length > 0 ? (
                <div>
                  <select 
                    className="form-input"
                    value={bedConflictData.selectedNewBed}
                    onChange={(e) => setBedConflictData(prev => ({ ...prev, selectedNewBed: e.target.value }))}
                    style={{ 
                      fontSize: '0.92rem', 
                      fontWeight: 600, 
                      padding: '0.75rem',
                      borderColor: '#157388',
                      background: '#ffffff',
                      color: '#0f172a',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="" disabled>-- Choose an Available Free Bed --</option>
                    {bedConflictData.availableBeds.map(bed => (
                      <option key={bed.id} value={bed.id}>
                        Room {bed.room} - {bed.name} (Bed {bed.id}) — Available
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.78rem', color: '#0f766e', marginTop: '0.45rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle size={14} /> {bedConflictData.availableBeds.length} other bed(s) are currently available in the ward.
                  </p>
                </div>
              ) : (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  padding: '0.85rem', 
                  color: '#b91c1c', 
                  fontSize: '0.85rem',
                  fontWeight: 600 
                }}>
                  ⚠️ No other ward beds are currently available. Please discharge an admitted patient before admitting this patient.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn"
                onClick={() => setBedConflictData(null)}
                style={{ 
                  padding: '0.65rem 1.35rem', 
                  fontSize: '0.88rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                disabled={!bedConflictData.selectedNewBed || processingPatientId === bedConflictData.patient?.id}
                style={{ 
                  padding: '0.65rem 1.6rem', 
                  fontSize: '0.88rem', 
                  background: 'linear-gradient(135deg, #0f766e 0%, #157388 100%)', 
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: (!bedConflictData.selectedNewBed || processingPatientId === bedConflictData.patient?.id) ? 'not-allowed' : 'pointer',
                  opacity: (!bedConflictData.selectedNewBed || processingPatientId === bedConflictData.patient?.id) ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(21, 115, 136, 0.28)'
                }}
                onClick={() => handleConfirmAdmit(bedConflictData.patient.id, bedConflictData.selectedNewBed)}
              >
                {processingPatientId === bedConflictData.patient?.id ? (
                  <>
                    <Loader2 size={16} className="spin" /> Admitting to Bed {bedConflictData.selectedNewBed}...
                  </>
                ) : (
                  <>
                    ✓ Admit to Bed {bedConflictData.selectedNewBed || '...'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardDashboard;
