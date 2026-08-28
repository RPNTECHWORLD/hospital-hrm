import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, FlaskConical, CheckCircle, CheckCircle2, Clock, AlertCircle, Plus, Trash2, X, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ⚡ Ultra-fast client-side image compression (reduces 15MB+ camera/scans down to ~150KB in 30ms)
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = () => {
      resolve(null);
    };
  });
};

const LabDashboard = ({ patients }) => {
  const [labLogs, setLabLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Ordered', 'Sample Collected', 'Report Delivered'
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
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, confirmText, onConfirm }
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  const fetchLabLogs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/lab`);
      if (response.ok) {
        const data = await response.json();
        setLabLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch lab logs:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabLogs(true);
    const interval = setInterval(() => {
      fetchLabLogs(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedLog || isUpdatingStatus) return;

    if (updateStatus === 'Report Delivered' && !reportImg) {
      alert("Please upload the lab report image / photo to complete this action.");
      return;
    }

    setIsUpdatingStatus(true);
    const logId = selectedLog.id;
    const targetStatus = updateStatus;
    const targetNotes = reportNotes;
    const targetImg = reportImg;

    // ⚡ Optimistic UI update: instantly update table and close form with zero delay
    setLabLogs(prev => prev.map(l => l.id === logId ? {
      ...l,
      status: targetStatus,
      reportNotes: targetNotes,
      reportImg: targetImg
    } : l));

    setSelectedLog(null);
    setReportNotes('');
    setReportImg(null);

    try {
      const response = await fetch(`${API_BASE}/api/lab/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reportNotes: targetNotes,
          reportImg: targetImg
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }
      fetchLabLogs(false);
    } catch (err) {
      console.error("Failed to update lab log status:", err);
      fetchLabLogs(false);
    } finally {
      setIsUpdatingStatus(false);
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
    setProcessingOrderId(id);
    // Instant Optimistic update: mark as Sample Collected locally
    setLabLogs(prev => prev.map(log => log.id === id ? { ...log, status: 'Sample Collected' } : log));
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
        fetchLabLogs(false);
      }
    } catch (err) {
      console.error("Failed to accept order:", err);
      fetchLabLogs(false);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleDeleteOrder = (id) => {
    setConfirmDialog({
      title: 'Dismiss Lab Request',
      message: 'Are you sure you want to dismiss and remove this laboratory test request?',
      confirmText: 'Yes, Dismiss',
      onConfirm: async () => {
        setProcessingOrderId(id);
        // Instant Optimistic update: remove locally
        setLabLogs(prev => prev.filter(log => log.id !== id));
        try {
          const response = await fetch(`${API_BASE}/api/lab/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchLabLogs(false);
          }
        } catch (err) {
          console.error("Failed to delete lab order:", err);
          fetchLabLogs(false);
        } finally {
          setConfirmDialog(null);
          setProcessingOrderId(null);
        }
      }
    });
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
    if (filterStatus === 'Report Delivered') {
      return (log.status === 'Report Delivered' || log.status === 'Report Reviewed') && matchSearch;
    }
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
                      disabled={processingOrderId === notification.id}
                      style={{ 
                        background: '#d97706', 
                        borderColor: '#d97706',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        padding: '0.45rem 1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: processingOrderId === notification.id ? 'not-allowed' : 'pointer',
                        opacity: processingOrderId === notification.id ? 0.75 : 1,
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {processingOrderId === notification.id ? (
                        <>
                          <Loader2 size={14} className="spin" /> Accepting...
                        </>
                      ) : (
                        <>✓ Accept & Collect Sample</>
                      )}
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
              {labLogs.filter(l => l.status === 'Report Delivered' || l.status === 'Report Reviewed').length}
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
                    const isDelivered = log.status === 'Report Delivered' || log.status === 'Report Reviewed';
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
                            isDelivered ? 'badge-success' : 
                            log.status === 'Sample Collected' ? 'badge-active' : 'badge-pending'
                          }`}>
                            {isDelivered ? 'Report Delivered' : log.status}
                          </span>
                        </td>
                        <td>
                          {!isDelivered ? (
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
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setIsCompressingImage(true);
                          try {
                            const compressed = await compressImage(file, 1200, 1200, 0.82);
                            if (compressed) {
                              setReportImg(compressed);
                            }
                          } catch (err) {
                            console.error("Compression error:", err);
                          } finally {
                            setIsCompressingImage(false);
                          }
                        }
                      }}
                      required={!reportImg}
                      disabled={isCompressingImage || isUpdatingStatus}
                    />
                    {isCompressingImage && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Loader2 size={14} className="spin" /> Optimizing & compressing image for instant upload...
                      </div>
                    )}
                    {reportImg && !isCompressingImage && (
                      <div style={{ marginTop: '0.75rem', position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={reportImg} 
                          alt="Report Preview" 
                          style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', border: '1px solid var(--border)', display: 'block' }} 
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
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    disabled={isUpdatingStatus || isCompressingImage}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 size={16} className="spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    disabled={isUpdatingStatus}
                    onClick={() => { setSelectedLog(null); setReportImg(null); }}
                  >
                    Cancel
                  </button>
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

      {previewImage && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999999,
          padding: '1.5rem',
          boxSizing: 'border-box'
        }} onClick={() => setPreviewImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button 
              style={{
                position: 'absolute',
                top: '-35px',
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
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(10, 15, 29, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            boxSizing: 'border-box',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="card fade-in"
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--bg-card, #111c30)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85)',
              textAlign: 'center',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={30} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {confirmDialog.title}
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0 0 1.5rem 0' }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, flex: 1 }}
                onClick={() => setConfirmDialog(null)}
              >
                No, Keep
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                }}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LabDashboard;
