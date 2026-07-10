import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Activity, Search, AlertCircle, Syringe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const InjectionRoom = ({ patients }) => {
  const [injections, setInjections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending'); // 'Pending', 'Administered', 'All'
  const [searchQuery, setSearchQuery] = useState('');


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
    }, 2000); // Poll database every 2 seconds for real-time updates!

    return () => clearInterval(interval);
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

      <div style={{ width: '100%' }}>
        <div className="card" style={{ width: '100%', maxWidth: '100%' }}>
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
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(21, 115, 136, 0.05)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(21, 115, 136, 0.15)' }}>
                              <input 
                                type="checkbox" 
                                onChange={() => handleAdminister(inj.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--success)' }} 
                              />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Mark Given</span>
                            </label>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                              <span>Checked / Given ✅</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({inj.dateGiven})</span>
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
      </div>
    </div>
  );
};

export default InjectionRoom;
