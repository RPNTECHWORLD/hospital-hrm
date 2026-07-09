import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Activity, Search, AlertCircle, Syringe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const InjectionRoom = ({ patients }) => {
  const [injections, setInjections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending'); // 'Pending', 'Administered', 'All'
  const [searchQuery, setSearchQuery] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newInjectionName, setNewInjectionName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [formError, setFormError] = useState('');

  const fetchInjections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/injections`);
      if (response.ok) {
        const data = await response.json();
        setInjections(data);
      }
    } catch (err) {
      console.error("Failed to fetch injections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInjections();
  }, []);

  const handleAdminister = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/injections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Administered',
          dateGiven: new Date().toLocaleString()
        })
      });

      if (response.ok) {
        fetchInjections();
      }
    } catch (err) {
      console.error("Failed to update injection status:", err);
    }
  };

  const handleCreateInjection = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newPatientId || !newInjectionName || !newDosage) {
      setFormError('All fields are required.');
      return;
    }

    const patientExists = patients.find(p => String(p.id).toUpperCase() === newPatientId.toUpperCase());
    if (!patientExists) {
      setFormError(`Patient with ID ${newPatientId} does not exist.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/injections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newPatientId,
          injectionName: newInjectionName,
          dosage: newDosage,
          status: 'Pending',
          dateGiven: ''
        })
      });

      if (response.ok) {
        setNewPatientId('');
        setNewInjectionName('');
        setNewDosage('');
        fetchInjections();
      }
    } catch (err) {
      console.error("Failed to create injection entry:", err);
      setFormError('Connection error. Could not add injection.');
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

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">
              {injections.filter(i => i.status === 'Pending').length}
            </div>
            <div className="stat-label">Pending Injections</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value">
              {injections.filter(i => i.status === 'Administered').length}
            </div>
            <div className="stat-label">Administered Today</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', margin: 0 }}>
              <Syringe size={20} style={{ color: 'var(--primary)' }} />
              Injection Queue / Logs
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${filterStatus === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setFilterStatus('Pending')}
              >
                Pending
              </button>
              <button 
                className={`btn ${filterStatus === 'Administered' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setFilterStatus('Administered')}
              >
                Given
              </button>
              <button 
                className={`btn ${filterStatus === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setFilterStatus('All')}
              >
                All
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by Patient ID, Name, or Injection..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</div>
          ) : filteredInjections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No injection logs found matching the filter.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Injection Name</th>
                    <th>Dosage</th>
                    <th>Status</th>
                    <th>Actions / Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInjections.map(inj => {
                    const pat = patients.find(p => String(p.id).toUpperCase() === String(inj.patientId).toUpperCase());
                    return (
                      <tr key={inj.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pat ? pat.name : 'Unknown'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{inj.patientId}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inj.injectionName}</td>
                        <td>{inj.dosage}</td>
                        <td>
                          <span className={`badge ${inj.status === 'Administered' ? 'badge-success' : 'badge-pending'}`}>
                            {inj.status}
                          </span>
                        </td>
                        <td>
                          {inj.status === 'Pending' ? (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleAdminister(inj.id)}
                            >
                              ✓ Administer Injection
                            </button>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Given at: {inj.dateGiven}
                            </div>
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

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            New Injection Entry
          </h3>

          {formError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--danger)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateInjection}>
            <div className="form-group">
              <label className="form-label">Patient ID</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. VH001" 
                value={newPatientId} 
                onChange={(e) => setNewPatientId(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Injection Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ceftriaxone 1g, Tramadol" 
                value={newInjectionName} 
                onChange={(e) => setNewInjectionName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dosage / Frequency</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. IM Stat, IV slowly" 
                value={newDosage} 
                onChange={(e) => setNewDosage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Add to Injection Queue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InjectionRoom;
