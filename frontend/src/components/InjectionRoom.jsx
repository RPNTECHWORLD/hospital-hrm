import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Search, AlertCircle, Syringe, Plus, Edit3, Trash2, CheckCircle2, XCircle, UserCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ROUTE_OPTIONS = ['IV', 'IM'];
const FREQUENCY_OPTIONS = [
  'STAT (Single / Immediate)',
  'NORMAL',
  'OD (Once Daily)',
  'BD (Twice Daily)',
  'TDS (Thrice Daily)',
  'QID (4 Times Daily)',
  'PRN (As Needed)'
];

const InjectionRoom = ({ patients = [], currentUser }) => {
  const [injections, setInjections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending'); // 'Pending', 'Administered', 'Cancelled', 'All'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdministerModal, setShowAdministerModal] = useState(false);

  const [activeInjection, setActiveInjection] = useState(null);
  const [nurseName, setNurseName] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    patientId: '',
    injectionName: '',
    dosage: '',
    route: 'IV',
    frequency: 'STAT (Single / Immediate)',
    isStat: true,
    notes: ''
  });

  const fetchInjections = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/injections`);
      if (response.ok) {
        const data = await response.json();
        setInjections(data);
      }
    } catch (err) {
      console.error("Failed to fetch injections:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInjections(true);
    const interval = setInterval(() => {
      fetchInjections(false);
    }, 10000); // Poll database every 10s for real-time updates

    return () => clearInterval(interval);
  }, []);

  // Open Administer Modal
  const openAdministerModal = (inj) => {
    setActiveInjection(inj);
    const defaultNurse = currentUser?.name || currentUser?.email || 'Injection Desk Nurse';
    setNurseName(defaultNurse);
    setShowAdministerModal(true);
  };

  // Submit Administer Injection
  const handleConfirmAdminister = async () => {
    if (!activeInjection) return;
    try {
      const response = await fetch(`${API_BASE}/api/injections/${activeInjection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Administered',
          dateGiven: new Date().toLocaleString('en-US', {
            dateStyle: 'short',
            timeStyle: 'medium'
          }),
          administeredBy: nurseName || 'Injection Nurse'
        })
      });

      if (response.ok) {
        setShowAdministerModal(false);
        setActiveInjection(null);
        fetchInjections(false);
      }
    } catch (err) {
      console.error("Failed to update injection status:", err);
    }
  };



  // Open Edit Modal
  const openEditModal = (inj) => {
    setActiveInjection(inj);
    setFormData({
      patientId: inj.patientId || '',
      injectionName: inj.injectionName || '',
      dosage: inj.dosage || '',
      route: inj.route || 'IV',
      frequency: inj.frequency || 'STAT (Single / Immediate)',
      isStat: inj.isStat === 1 || inj.isStat === true || inj.frequency?.includes('STAT'),
      notes: inj.notes || ''
    });
    setShowEditModal(true);
  };

  // Submit Edit Injection
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeInjection) return;

    try {
      const response = await fetch(`${API_BASE}/api/injections/${activeInjection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEdit: true,
          patientId: formData.patientId,
          injectionName: formData.injectionName,
          dosage: formData.dosage,
          route: formData.route,
          frequency: formData.frequency,
          isStat: formData.isStat ? 1 : 0,
          notes: formData.notes
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        setActiveInjection(null);
        fetchInjections(false);
      }
    } catch (err) {
      console.error("Failed to edit injection:", err);
    }
  };

  // Cancel / Delete Injection
  const handleCancelInjection = async (inj) => {
    if (!window.confirm(`Are you sure you want to cancel ${inj.injectionName} for Patient #${inj.patientId}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/injections/${inj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Cancelled',
          dateGiven: `Cancelled on ${new Date().toLocaleString()}`,
          administeredBy: currentUser?.name || 'Staff'
        })
      });

      if (response.ok) {
        fetchInjections(false);
      }
    } catch (err) {
      console.error("Failed to cancel injection:", err);
    }
  };

  // Permanently Delete Injection Log
  const handleDeleteInjection = async (inj) => {
    if (!window.confirm(`Are you sure you want to delete log entry for ${inj.injectionName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/injections/${inj.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchInjections(false);
      }
    } catch (err) {
      console.error("Failed to delete injection record:", err);
    }
  };

  const filteredInjections = injections.filter(inj => {
    const patient = patients.find(p => String(p.id).toUpperCase() === String(inj.patientId).toUpperCase());
    const patientName = patient ? patient.name.toLowerCase() : '';
    const matchSearch = String(inj.patientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      patientName.includes(searchQuery.toLowerCase()) ||
      inj.injectionName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'All') return matchSearch;
    return inj.status === filterStatus && matchSearch;
  });

  const pendingCount = injections.filter(i => i.status === 'Pending').length;
  const givenCount = injections.filter(i => i.status === 'Administered').length;

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Top Header & Action Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <Syringe size={28} style={{ color: 'var(--primary)' }} />
            Injection Desk Administration
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage IM/IV injections, STAT single doses, daily frequencies, and nurse administration records.
          </p>
        </div>

      </div>

      {/* Overview Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending Injections</div>
          </div>
        </div>



        <div className="stat-card">
          <div className="stat-icon success">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{givenCount}</div>
            <div className="stat-label">Administered Today</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ width: '100%', maxWidth: '100%', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {/* Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.03)', padding: '0.3rem', borderRadius: '8px' }}>
            {['Pending', 'Administered', 'Cancelled', 'All'].map(status => (
              <button
                key={status}
                className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px'
                }}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'Administered' ? 'Given' : status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem', paddingRight: '0.8rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.875rem', width: '100%' }}
              placeholder="Search Patient ID, Name, Injection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading injection logs...</div>
        ) : filteredInjections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Syringe size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <div>No injection records found for <strong>"{filterStatus}"</strong> filter.</div>
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.02)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Medicine & Dose</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Route</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Frequency / Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Administered By & Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInjections.map(inj => {
                  const pat = patients.find(p => String(p.id).toUpperCase() === String(inj.patientId).toUpperCase());
                  const isStatDose = inj.isStat === 1 || inj.isStat === true || (inj.frequency && inj.frequency.includes('STAT'));
                  const routeName = inj.route || 'IM';
                  const freqName = inj.frequency || (isStatDose ? 'STAT (Single / Immediate)' : 'NORMAL');

                  return (
                    <tr key={inj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Patient */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{pat ? pat.name : 'Unknown Patient'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>ID: #{inj.patientId}</div>
                      </td>

                      {/* Medicine & Dose */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>{inj.injectionName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.1rem' }}>Dose: {inj.dosage || '1 Dose'}</div>
                        {inj.notes && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.15rem' }}>Note: {inj.notes}</div>
                        )}
                      </td>

                      {/* Route (IM / IV) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          background: routeName === 'IV' ? 'rgba(14, 165, 233, 0.15)' : routeName === 'IM' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: routeName === 'IV' ? '#0284c7' : routeName === 'IM' ? '#7e22ce' : '#a16207',
                          border: `1px solid ${routeName === 'IV' ? 'rgba(14, 165, 233, 0.3)' : routeName === 'IM' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                        }}>
                          {routeName}
                        </span>
                      </td>

                      {/* Frequency / STAT Tag */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isStatDose ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            {freqName}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(14, 165, 233, 0.12)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(14, 165, 233, 0.3)'
                          }}>
                            {freqName}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${inj.status === 'Administered' ? 'badge-success' : inj.status === 'Cancelled' ? 'badge-danger' : ''}`}
                          style={{
                            fontWeight: 600,
                            background: inj.status === 'Administered' ? undefined : inj.status === 'Cancelled' ? undefined : 'rgba(21, 115, 136, 0.12)',
                            color: inj.status === 'Administered' ? undefined : inj.status === 'Cancelled' ? undefined : 'var(--primary)',
                            border: inj.status === 'Administered' ? undefined : inj.status === 'Cancelled' ? undefined : '1px solid rgba(21, 115, 136, 0.25)'
                          }}
                        >
                          {inj.status === 'Administered' ? 'Given ✅' : inj.status}
                        </span>
                      </td>

                      {/* Administered By & Date */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {inj.status === 'Administered' ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)' }}>
                              <UserCheck size={14} />
                              {inj.administeredBy || 'Nurse'}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                              {inj.dateGiven}
                            </div>
                          </div>
                        ) : inj.status === 'Cancelled' ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{inj.dateGiven || 'Cancelled'}</div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Administration</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {inj.status === 'Pending' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            {/* Give Button */}
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#16a34a', borderColor: '#16a34a' }}
                              onClick={() => openAdministerModal(inj)}
                            >
                              <CheckCircle2 size={14} />
                              Give
                            </button>

                            {/* Edit Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', color: '#0f766e' }}
                              title="Edit Injection Details"
                              onClick={() => openEditModal(inj)}
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Cancel Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', color: '#dc2626' }}
                              title="Cancel Injection"
                              onClick={() => handleCancelInjection(inj)}
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Delete Log Entry"
                            onClick={() => handleDeleteInjection(inj)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Mark Administered */}
      {showAdministerModal && activeInjection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowAdministerModal(false)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <ShieldCheck size={22} /> Confirm Injection Administration
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Record nurse details and confirm administration for:
            </p>

            <div style={{ background: 'var(--bg-dark, #f8fafc)', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <div><strong>Medicine:</strong> {activeInjection.injectionName} ({activeInjection.dosage})</div>
              <div><strong>Route & Type:</strong> {activeInjection.route || 'IV'} | {activeInjection.frequency || 'STAT'}</div>
              <div><strong>Patient ID:</strong> #{activeInjection.patientId}</div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block', color: 'var(--text-secondary)' }}>
                Administered By (Nurse / Staff Name) *
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem' }}
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                placeholder="Enter Nurse Name"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdministerModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ background: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleConfirmAdminister}>
                Confirm Given ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Injection */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowEditModal(false)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Edit3 size={22} /> Edit Injection Order
            </h3>

            <form onSubmit={handleEditSubmit}>
              {/* Select Patient */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                  Patient *
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: #{p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                  Medicine Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={formData.injectionName}
                  onChange={(e) => setFormData({ ...formData, injectionName: e.target.value })}
                  required
                />
              </div>

              {/* Dosage & Route */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                    Dosage
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                    Route
                  </label>
                  <select
                    className="form-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  >
                    {ROUTE_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                  Frequency / Dose Type
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={formData.frequency}
                  onChange={(e) => setFormData({
                    ...formData,
                    frequency: e.target.value,
                    isStat: e.target.value.includes('STAT')
                  })}
                >
                  {FREQUENCY_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* STAT Checkbox */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#dc2626' }}>
                  <input
                    type="checkbox"
                    checked={formData.isStat}
                    onChange={(e) => setFormData({ ...formData, isStat: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
                  />
                  STAT Dose (Single / Immediate)
                </label>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                  Special Instructions / Notes
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InjectionRoom;
