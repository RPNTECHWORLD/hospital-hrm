import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, CheckCircle, CheckCircle2, Clock, AlertCircle, Plus, Trash2, X, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const LabDashboard = ({ patients }) => {
  const [labLogs, setLabLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Sample Collected'); // 'Sample Collected', 'Report Delivered', 'All'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newPatientId, setNewPatientId] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('Sample Collected');
  const [reportImg, setReportImg] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

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

    if (updateStatus === 'Report Delivered' && !reportImg) {
      alert("Please upload the lab report image / photo to complete this action.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/lab/${selectedLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          reportNotes: reportNotes,
          reportImg: reportImg
        })
      });

      if (response.ok) {
        setSelectedLog(null);
        setReportNotes('');
        setReportImg(null);
        fetchLabLogs();
      }
    } catch (err) {
      console.error("Failed to update lab log status:", err);
    }
  };

  const handleCreateLabLog = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!newPatientId || !newTestName) {
      setFormError('All fields are required.');
      return;
    }

    const cleanPid = newPatientId.trim().toUpperCase();
    const cleanTest = newTestName.trim();

    const patientExists = (patients || []).find(p => String(p.id).toUpperCase() === cleanPid || String(p.patientId || '').toUpperCase() === cleanPid);
    if (!patientExists) {
      setFormError(`Patient with ID ${newPatientId} does not exist.`);
      return;
    }

    // Check duplicate active/pending lab test
    const isDuplicate = labLogs.some(
      log => String(log.patientId).trim().toUpperCase() === cleanPid &&
             String(log.testName).trim().toUpperCase() === cleanTest.toUpperCase() &&
             (log.status === 'Ordered' || log.status === 'Sample Collected')
    );

    if (isDuplicate) {
      setFormError(`Lab investigation "${cleanTest}" is already requested/pending for patient ${cleanPid}. Duplicate entries are not allowed.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: cleanPid,
          testName: cleanTest,
          dateOrdered: new Date().toLocaleString(),
          status: 'Ordered',
          reportNotes: ''
        })
      });

      if (response.ok) {
        const patLabel = patientExists.name ? `${patientExists.name} (#${cleanPid})` : `#${cleanPid}`;
        setNewPatientId('');
        setNewTestName('');
        setFormError('');
        setFormSuccess(`✓ Lab Investigation "${cleanTest}" registered successfully for ${patLabel}!`);
        fetchLabLogs();
      } else {
        const errData = await response.json().catch(() => ({}));
        setFormError(errData.message || 'Could not register test.');
      }
    } catch (err) {
      console.error("Failed to create lab log entry:", err);
      setFormError('Connection error. Could not add test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOrder = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/lab/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Sample Collected',
          reportNotes: ''
        })
      });
      if (response.ok) {
        fetchLabLogs();
      }
    } catch (err) {
      console.error("Failed to accept order:", err);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to dismiss/remove this lab request?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/lab/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchLabLogs();
      }
    } catch (err) {
      console.error("Failed to delete lab order:", err);
    }
  };

  const openUpdateModal = (log) => {
    setSelectedLog(log);
    setUpdateStatus(log.status === 'Ordered' ? 'Sample Collected' : 'Report Delivered');
    setReportNotes(log.reportNotes || '');
    setReportImg(log.reportImg || null);
  };

  const orderedNotifications = labLogs.filter(log => log.status === 'Ordered');

  const filteredLogs = labLogs.filter(log => {
    if (log.status === 'Ordered') return false; // Show in notifications instead

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
      {/* New Lab Investigation Requests (Notifications) */}
      {orderedNotifications.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1.5px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ 
            color: '#d97706', 
            margin: 0, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '1rem',
            fontWeight: 700 
          }}>
            <span style={{ 
              background: '#d97706', 
              color: '#fff', 
              borderRadius: '50%', 
              width: '24px', 
              height: '24px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.8rem'
            }}>
              {orderedNotifications.length}
            </span>
            New Lab Investigation Requests from Doctor
          </h4>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem', 
            marginTop: '1rem',
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            {orderedNotifications.map(notification => {
              const pat = patients.find(p => String(p.id).toUpperCase() === String(notification.patientId).toUpperCase());
              return (
                <div key={notification.id} style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '0.75rem 1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {pat ? pat.name : 'Unknown Patient'} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>({notification.patientId})</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                      Test: {notification.testName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Ordered: {notification.dateOrdered}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleAcceptOrder(notification.id)}
                      style={{ 
                        background: '#d97706', 
                        borderColor: '#d97706',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '0.4rem 1rem'
                      }}
                    >
                      ✓ Accept & Collect Sample
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleDeleteOrder(notification.id)}
                      title="Remove / Delete duplicate request"
                      style={{ 
                        color: 'var(--danger)', 
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
              {['Sample Collected', 'Report Delivered', 'All'].map(status => (
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div><strong>Report Notes:</strong> {log.reportNotes || 'No notes added'}</div>
                              {log.reportImg && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  <img 
                                    src={log.reportImg} 
                                    alt="Report Thumbnail" 
                                    style={{ width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border)' }}
                                    onClick={() => setPreviewImage(log.reportImg)}
                                  />
                                </div>
                              )}
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

                {updateStatus === 'Report Delivered' && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                      Upload Report Image / Photo (Required) *
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setReportImg(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required={!reportImg}
                    />
                    {reportImg && (
                      <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                        <img 
                          src={reportImg} 
                          alt="Report Preview" 
                          style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', border: '1px solid var(--border)' }} 
                        />
                        <button
                          type="button"
                          onClick={() => setReportImg(null)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setSelectedLog(null); setReportImg(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Plus size={20} style={{ color: 'var(--primary)' }} />
                New Lab Investigation Entry
              </h3>

              {formSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>{formSuccess}</span>
                </div>
              )}

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <FlaskConical size={16} /> Register Investigation
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
    </div>

      {/* Floating Toast Notification */}
      {formSuccess && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          background: '#065f46',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          <CheckCircle2 size={18} color="#34d399" />
          <span>{formSuccess}</span>
          <button
            type="button"
            onClick={() => setFormSuccess('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              opacity: 0.8,
              padding: 0,
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} onClick={() => setPreviewImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button 
              style={{
                position: 'absolute',
                top: '-30px',
                right: '0px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <img 
              src={previewImage} 
              alt="Lab Report Full View" 
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
