import React, { useState } from 'react';
import { Bed, UserCheck, ShieldAlert, LogOut, CheckCircle, Plus } from 'lucide-react';

const WardDashboard = ({ patients, onAssignBed, onDischargePatient }) => {
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
    if (!selectedBed || !selectedPatientId) return;

    const patientIdVal = selectedPatientId;
    const updatedBeds = beds.map(b => {
      if (b.id === selectedBed.id) {
        return { ...b, patientId: patientIdVal };
      }
      return b;
    });

    setBeds(updatedBeds);
    onAssignBed(patientIdVal, selectedBed.id);
    setSelectedBed(null);
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
        const pendingRequests = patients.filter(p => p.bedAdmissionPending === 1 && p.status !== 'Inactive');
        if (pendingRequests.length === 0) return null;
        
        return (
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.03)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            borderLeft: '4px solid var(--warning)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.08)'
          }}>
            <h4 style={{ margin: 0, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              <ShieldAlert size={20} />
              Admission Requests Needing Confirmation ({pendingRequests.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {pendingRequests.map(p => {
                const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PT';
                return (
                  <div 
                    key={p.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Avatar */}
                      <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        background: 'rgba(245, 158, 11, 0.15)', 
                        color: 'var(--warning)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 700,
                        fontSize: '0.9rem' 
                      }}>
                        {initials}
                      </div>
                      
                      {/* Patient details */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <span>{p.age} Yrs • {p.gender}</span>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <span>Requested: <strong style={{ color: 'var(--primary)' }}>Room {p.wardBedId?.slice(0, 3)} • Bed {p.wardBedId?.slice(3)}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn"
                        style={{ 
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.8rem', 
                          background: 'var(--success)', 
                          border: 'none',
                          color: '#fff',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                        }}
                        onClick={() => onAssignBed(p.id, p.wardBedId)}
                      >
                        Confirm (OK)
                      </button>
                      <button 
                        className="btn"
                        style={{ 
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.8rem', 
                          background: 'transparent', 
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: 'var(--danger)',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        onClick={() => onDischargePatient(p.id)}
                      >
                        Reject
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
              const isPending = patient && patient.bedAdmissionPending === 1;

              return (
                <div 
                  key={bed.id} 
                  className="card" 
                  style={{ 
                    padding: '1.25rem', 
                    background: isPending ? 'rgba(245, 158, 11, 0.05)' : isOccupied ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
                    borderColor: isPending ? 'rgba(245, 158, 11, 0.3)' : isOccupied ? 'rgba(99, 102, 241, 0.3)' : 'var(--border)',
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
                      <h4 style={{ fontSize: '1.1rem' }}>{bed.name}</h4>
                    </div>
                    <span className={`badge ${
                      isPending ? 'badge-pending' : isOccupied ? 'badge-danger' : 'badge-success'
                    }`}>
                      {isPending ? 'Pending OK' : isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {isOccupied && patient ? (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {isPending ? 'Requested Admission:' : 'Admitted Patient:'}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.gender} • {patient.age} Yrs • Reg: {patient.registrationDate || '--'}</div>
                      
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ 
                              flexGrow: 1, 
                              padding: '0.4rem', 
                              fontSize: '0.8rem', 
                              background: 'var(--success)', 
                              borderColor: 'var(--success)' 
                            }}
                            onClick={() => onAssignBed(patient.id, bed.id)}
                          >
                            OK / Confirm
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ 
                              flexGrow: 1, 
                              padding: '0.4rem', 
                              fontSize: '0.8rem', 
                              color: 'var(--danger)', 
                              borderColor: 'rgba(239, 68, 68, 0.2)' 
                            }}
                            onClick={() => handleDischarge(bed.id)}
                          >
                            Cancel
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
                  <label className="form-label">Select Patient</label>
                  <select 
                    className="form-input" 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select patient from active list</option>
                    {eligiblePatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.age} Yrs - Status: {p.status} - Reg Date: {p.registrationDate || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {eligiblePatients.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      No patients eligible for ward admission (registered and not yet discharged).
                    </p>
                  )}
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
    </div>
  );
};

export default WardDashboard;
