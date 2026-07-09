import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const LabDashboard = ({ patients }) => {
  const [labLogs, setLabLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Ordered'); // 'Ordered', 'Sample Collected', 'Report Delivered', 'All'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newPatientId, setNewPatientId] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [formError, setFormError] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('Sample Collected');

  const fetchLabLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/lab`);
      if (response.ok) {
        const data = await response.json();
        setLabLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch lab logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabLogs();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;

    try {
      const response = await fetch(`${API_BASE}/api/lab/${selectedLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          reportNotes: reportNotes
        })
      });

      if (response.ok) {
        setSelectedLog(null);
        setReportNotes('');
        fetchLabLogs();
      }
    } catch (err) {
      console.error("Failed to update lab log status:", err);
    }
  };

  const handleCreateLabLog = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newPatientId || !newTestName) {
      setFormError('All fields are required.');
      return;
    }

    const patientExists = patients.find(p => String(p.id).toUpperCase() === newPatientId.toUpperCase());
    if (!patientExists) {
      setFormError(`Patient with ID ${newPatientId} does not exist.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newPatientId,
          testName: newTestName,
          dateOrdered: new Date().toLocaleString(),
          status: 'Ordered',
          reportNotes: ''
        })
      });

      if (response.ok) {
        setNewPatientId('');
        setNewTestName('');
        fetchLabLogs();
      }
    } catch (err) {
      console.error("Failed to create lab log entry:", err);
      setFormError('Connection error. Could not add test.');
    }
  };

  const openUpdateModal = (log) => {
    setSelectedLog(log);
    setUpdateStatus(log.status === 'Ordered' ? 'Sample Collected' : 'Report Delivered');
    setReportNotes(log.reportNotes || '');
  };

  const filteredLogs = labLogs.filter(log => {
    const patient = patients.find(p => String(p.id).toUpperCase() === String(log.patientId).toUpperCase());
    const patientName = patient ? patient.name.toLowerCase() : '';
    const matchSearch = String(log.patientId).toLowerCase().includes(searchQuery.toLowerCase()) || 
                        patientName.includes(searchQuery.toLowerCase()) || 
                        log.testName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'All') return matchSearch;
    return log.status === filterStatus && matchSearch;
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
              {labLogs.filter(l => l.status === 'Ordered' || l.status === 'Sample Collected').length}
            </div>
            <div className="stat-label">Pending Lab Reports</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">
              {labLogs.filter(l => l.status === 'Report Delivered').length}
            </div>
            <div className="stat-label">Delivered Today</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', margin: 0 }}>
              <FlaskConical size={20} style={{ color: 'var(--primary)' }} />
              Laboratory Queue & Logs
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['Ordered', 'Sample Collected', 'Report Delivered', 'All'].map(status => (
                <button 
                  key={status}
                  className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by Patient ID, Name, or Lab Test..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No laboratory logs found matching the filter.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Date Ordered</th>
                    <th>Status</th>
                    <th>Actions / Outcomes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const pat = patients.find(p => String(p.id).toUpperCase() === String(log.patientId).toUpperCase());
                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pat ? pat.name : 'Unknown'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{log.patientId}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.testName}</td>
                        <td style={{ fontSize: '0.8rem' }}>{log.dateOrdered}</td>
                        <td>
                          <span className={`badge ${
                            log.status === 'Report Delivered' ? 'badge-success' : 
                            log.status === 'Sample Collected' ? 'badge-active' : 'badge-pending'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.status !== 'Report Delivered' ? (
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => openUpdateModal(log)}
                            >
                              Update Status
                            </button>
                          ) : (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', wordBreak: 'break-word' }}>
                              <strong>Report Notes:</strong> {log.reportNotes || 'No notes added'}
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

        <div>
          {selectedLog ? (
            <div className="card fade-in">
              <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Update Lab Log #{selectedLog.id}</h3>
                <button className="close-btn" onClick={() => setSelectedLog(null)}>✕</button>
              </div>

              <form onSubmit={handleUpdateStatus}>
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select 
                    className="form-input"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  >
                    <option value="Sample Collected">Sample Collected</option>
                    <option value="Report Delivered">Report Delivered</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Report / Test Outcome Notes</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Enter test outcome results, e.g. Hb count, X-ray findings..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Plus size={20} style={{ color: 'var(--primary)' }} />
                New Lab Investigation Entry
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

              <form onSubmit={handleCreateLabLog}>
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
                  <label className="form-label">Investigation Test Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. CBC Blood Test, Chest X-Ray" 
                    value={newTestName} 
                    onChange={(e) => setNewTestName(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                  Register Investigation
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;
