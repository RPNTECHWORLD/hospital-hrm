import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, Sparkles, Check, ClipboardList, Clock, AlertCircle, FileText, Camera, CheckCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const API_BASE = import.meta.env.VITE_API_URL || '';

const UtilityLogs = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('housekeeping'); // 'housekeeping', 'attendance', 'waste'
  const [loading, setLoading] = useState(false);

  // Housekeeping States
  const [housekeepingLogs, setHousekeepingLogs] = useState([]);
  const [newPlace, setNewPlace] = useState('');
  const [hkNotes, setHkNotes] = useState('');
  const [hkDate, setHkDate] = useState('');
  const [hkCleaned, setHkCleaned] = useState(false);
  const [hkWatered, setHkWatered] = useState(false);

  // Attendance States
  const [staffList, setStaffList] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { staffId: boolean }
  const [attendanceShift, setAttendanceShift] = useState('Day'); // 'Day' or 'Night'

  // UI & Feedback States
  const [attendanceSavedMsg, setAttendanceSavedMsg] = useState(false);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState(null);
  const [filterAttDate, setFilterAttDate] = useState('');
  const [filterAttStaff, setFilterAttStaff] = useState('');
  const [filterAttShift, setFilterAttShift] = useState('All'); // 'All', 'Day', 'Night'
  const [filterAttStatus, setFilterAttStatus] = useState('All'); // 'All', 'Present', 'Absent'

  // Bio-Waste States
  const [wasteLogs, setWasteLogs] = useState([]);
  const [wasteDate, setWasteDate] = useState('');
  const [wasteType, setWasteType] = useState('Yellow Bag (Anatomical)');
  const [wasteWeight, setWasteWeight] = useState('');
  const [wasteAgency, setWasteAgency] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [scanPreview, setScanPreview] = useState(null);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Housekeeping
      const hkRes = await fetch(`${API_BASE}/api/housekeeping`);
      if (hkRes.ok) setHousekeepingLogs(await hkRes.json());

      // Fetch Staff
      const staffRes = await fetch(`${API_BASE}/api/staff`);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData);
        // Initialize attendance map based on shift
        const initialMap = {};
        staffData.forEach(s => {
          initialMap[s.id] = (attendanceShift === 'Day');
        });
        setAttendanceMap(initialMap);
      }

      // Fetch Attendance logs
      const attRes = await fetch(`${API_BASE}/api/attendance`);
      if (attRes.ok) setAttendanceLogs(await attRes.json());

      // Fetch Bio-waste logs
      const wasteRes = await fetch(`${API_BASE}/api/waste`);
      if (wasteRes.ok) setWasteLogs(await wasteRes.json());

    } catch (err) {
      console.error("Failed to load utility logs data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync attendanceMap dynamically when date, shift, staff, or attendanceLogs change
  useEffect(() => {
    const existingMap = {};
    const matchingLogs = attendanceLogs.filter(l => 
      l.date === attendanceDate && (l.shift || 'Day') === attendanceShift
    );

    if (matchingLogs.length > 0) {
      staffList.forEach(s => {
        const log = matchingLogs.find(l => String(l.staffId) === String(s.id));
        existingMap[s.id] = log ? (log.status === 'Present') : (attendanceShift === 'Day');
      });
    } else {
      staffList.forEach(s => {
        existingMap[s.id] = (attendanceShift === 'Day');
      });
    }
    setAttendanceMap(existingMap);
  }, [attendanceDate, attendanceShift, staffList, attendanceLogs]);

  // Housekeeping handlers
  const handleAddHousekeeping = async (e) => {
    e.preventDefault();
    if (!newPlace) return;

    try {
      const response = await fetch(`${API_BASE}/api/housekeeping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: newPlace,
          date: hkDate,
          isCleaned: hkCleaned ? 1 : 0,
          isPlantsWatered: hkWatered ? 1 : 0,
          notes: hkNotes
        })
      });

      if (response.ok) {
        setNewPlace('');
        setHkNotes('');
        setHkCleaned(false);
        setHkWatered(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHousekeeping = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/housekeeping/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attendance handlers
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const isAlreadyRegistered = attendanceLogs.some(l => 
        l.date === attendanceDate && (l.shift || 'Day') === attendanceShift
      );

      for (const staffId of Object.keys(attendanceMap)) {
        await fetch(`${API_BASE}/api/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: parseInt(staffId),
            date: attendanceDate,
            status: attendanceMap[staffId] ? 'Present' : 'Absent',
            markedBy: 'Doctor/Admin',
            shift: attendanceShift
          })
        });
      }
      setAttendanceSavedMsg(isAlreadyRegistered ? 'updated' : 'new');
      setTimeout(() => setAttendanceSavedMsg(null), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttendance = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/attendance/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete attendance:", err);
    }
  };

  // Simulated Bill Scanner
  const simulateBillScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Simulated receipt data base64 image template
      const base64DummyReceipt = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='260' viewBox='0 0 200 260'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='10' y='30' fill='%23334155' font-family='monospace' font-size='12' font-weight='bold'>MEDIWASTE DISPOSAL RECEIPT</text><line x1='10' y1='40' x2='190' y2='40' stroke='%23475569' stroke-dasharray='4'/><text x='10' y='60' fill='%23475569' font-family='monospace' font-size='10'>DATE: " + new Date().toLocaleDateString() + "</text><text x='10' y='80' fill='%23475569' font-family='monospace' font-size='10'>AGENCY: MEDIWASTE LTD</text><line x1='10' y1='95' x2='190' y2='95' stroke='%23e2e8f0'/><text x='10' y='120' fill='%230f172a' font-family='monospace' font-size='11'>Bio-disposal charges:</text><text x='10' y='140' fill='%23475569' font-family='monospace' font-size='10'>- Yellow Bag (Anatomical)</text><text x='10' y='160' fill='%23475569' font-family='monospace' font-size='10'>Weight: 4.5 kg</text><line x1='10' y1='180' x2='190' y2='180' stroke='%23cbd5e1'/><text x='10' y='210' fill='%23ef4444' font-family='monospace' font-size='12' font-weight='bold'>TOTAL PAID: RS. " + (wasteAmount || "450.00") + "</text><text x='10' y='235' fill='%2322c55e' font-family='monospace' font-size='10' font-weight='bold'>✓ VERIFIED SCAN</text></svg>";
      setScanPreview(base64DummyReceipt);
      setScanning(false);
    }, 1500);
  };

  const handleAddWasteLog = async (e) => {
    e.preventDefault();
    if (!wasteWeight) return;

    try {
      const response = await fetch(`${API_BASE}/api/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: wasteDate || new Date().toISOString().split('T')[0],
          wasteType,
          weight: parseFloat(wasteWeight),
          agencyName: wasteAgency || 'MediWaste Disposal Ltd',
          billAmount: parseFloat(wasteAmount) || 0,
          billAttachment: scanPreview || ''
        })
      });

      if (response.ok) {
        setWasteDate('');
        setWasteWeight('');
        setWasteAgency('');
        setWasteAmount('');
        setScanPreview(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWasteLog = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/waste/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      {userRole !== 'receptionist' && (
        <div className="utility-tabs-nav" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${activeTab === 'housekeeping' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('housekeeping')}>
            🧹 Housekeeping & Plants Checklist
          </button>
          <button className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('attendance')}>
            📅 Staff Attendance
          </button>
          <button className={`btn ${activeTab === 'waste' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('waste')}>
            ☣️ Bio-Medical Waste Logs
          </button>
        </div>
      )}

      {activeTab === 'housekeeping' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
              Housekeeping Cleaning Schedule
            </h3>

            {housekeepingLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No cleaning routines completed today.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Area / Place</th>
                      <th>Cleaned Status</th>
                      <th>Watered Plants</th>
                      <th>Clinical Notes</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {housekeepingLogs.slice().reverse().map(log => (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.placeName}</td>
                        <td>
                          <span className={`badge ${log.isCleaned ? 'badge-success' : 'badge-pending'}`}>
                            {log.isCleaned ? '✓ Cleaned' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${log.isPlantsWatered ? 'badge-success' : 'badge-pending'}`}>
                            {log.isPlantsWatered ? '🌱 Watered' : 'No'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{log.notes || '--'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteConfig({
                              title: 'Delete Housekeeping Log',
                              message: `Delete housekeeping record for "${log.placeName}" on ${log.date}?`,
                              confirmText: 'Delete Record',
                              onConfirm: () => {
                                handleDeleteHousekeeping(log.id);
                                setConfirmDeleteConfig(null);
                              }
                            })}
                            title="Delete Record"
                            style={{
                              background: 'rgba(225, 29, 72, 0.08)',
                              border: '1px solid rgba(225, 29, 72, 0.2)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '0.25rem 0.4rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Register Housekeeping Check</h3>
            
            <form onSubmit={handleAddHousekeeping}>
              <div className="form-group">
                <label className="form-label">Place / Room Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Reception Lobby, Room 101, Pharmacy Block" 
                  value={newPlace} 
                  onChange={(e) => setNewPlace(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={hkDate} onChange={(e) => setHkDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '2rem', margin: '1.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={hkCleaned} onChange={(e) => setHkCleaned(e.target.checked)} />
                  Mark as fully Cleaned
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={hkWatered} onChange={(e) => setHkWatered(e.target.checked)} />
                  🌱 Watered Plants
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Outflow Notes</label>
                <textarea className="form-input" rows="2" placeholder="e.g. Cleaned at 10 AM, sanitization complete" value={hkNotes} onChange={(e) => setHkNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Log Housekeeping check
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (() => {
        const filteredAttendanceLogs = attendanceLogs.filter(log => {
          const staffMember = staffList.find(s => s.id === log.staffId);
          const staffName = staffMember ? staffMember.name.toLowerCase() : '';
          
          const matchDate = !filterAttDate || log.date === filterAttDate;
          const matchStaff = !filterAttStaff || 
                             staffName.includes(filterAttStaff.toLowerCase()) || 
                             String(log.staffId).includes(filterAttStaff);
          const matchShift = filterAttShift === 'All' || log.shift === filterAttShift;
          const matchStatus = filterAttStatus === 'All' || log.status === filterAttStatus;

          return matchDate && matchStaff && matchShift && matchStatus;
        });

        const isAlreadyMarkedForSelected = attendanceLogs.some(
          l => l.date === attendanceDate && (l.shift || 'Day') === attendanceShift
        );

        return (
          <div className="grid-2">
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Calendar size={20} style={{ color: 'var(--primary)' }} />
                Active Staff Attendance Register
              </h3>

              {isAlreadyMarkedForSelected && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  fontSize: '0.84rem',
                  color: '#d97706',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} />
                  <span>
                    Attendance is already registered for <strong>{attendanceDate}</strong> ({attendanceShift} Shift). Saving again will update existing entries without creating duplicates.
                  </span>
                </div>
              )}

              <form onSubmit={handleMarkAttendance}>
                <div className="form-group">
                  <label className="form-label">Select Attendance Date</label>
                  <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Select Shift</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${attendanceShift === 'Day' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', flexGrow: 1 }}
                      onClick={() => setAttendanceShift('Day')}
                    >
                      ☀️ Day Shift
                    </button>
                    <button
                      type="button"
                      className={`btn ${attendanceShift === 'Night' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', flexGrow: 1 }}
                      onClick={() => setAttendanceShift('Night')}
                    >
                      🌙 Night Shift
                    </button>
                  </div>
                </div>

                <div className="table-container" style={{ margin: '1rem 0' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Module Role</th>
                        <th>Status Checklist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map(s => (
                        <tr key={s.id} style={{ 
                          background: attendanceMap[s.id] ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                          transition: 'background 0.2s'
                        }}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{s.role}</td>
                          <td>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: attendanceMap[s.id] ? 'var(--success)' : 'var(--text-secondary)' }}>
                              <input 
                                type="checkbox" 
                                checked={!!attendanceMap[s.id]} 
                                onChange={(e) => setAttendanceMap({
                                  ...attendanceMap,
                                  [s.id]: e.target.checked
                                })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              {attendanceMap[s.id] ? 'Present' : 'Absent'}
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {attendanceSavedMsg === 'new' && (
                  <div style={{ padding: '0.65rem 1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b98140', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
                    <CheckCircle size={16} /> Attendance logs recorded successfully!
                  </div>
                )}

                {attendanceSavedMsg === 'updated' && (
                  <div style={{ padding: '0.65rem 1rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#d97706', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
                    <AlertCircle size={16} /> Attendance already registered! Existing records have been updated (No duplicates added).
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  ✓ Save Attendance Log
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Historical Attendance Logs</h3>
              
              {/* Log Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.75rem', 
                marginBottom: '1.5rem',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Filter Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={filterAttDate} 
                    onChange={(e) => setFilterAttDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Staff Name / ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search..."
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={filterAttStaff} 
                    onChange={(e) => setFilterAttStaff(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Shift</label>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={filterAttShift}
                    onChange={(e) => setFilterAttShift(e.target.value)}
                  >
                    <option value="All">All Shifts</option>
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status</label>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={filterAttStatus}
                    onChange={(e) => setFilterAttStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              {filteredAttendanceLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  No matching attendance logs found.
                </div>
              ) : (
                <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Staff Name</th>
                        <th>Shift</th>
                        <th>Attendance</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceLogs.slice().reverse().map((log, index) => {
                        const s = staffList.find(st => st.id === log.staffId);
                        return (
                          <tr key={log.id || index}>
                            <td>{log.date}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s ? s.name : `Staff #${log.staffId}`}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s ? s.role : ''}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {log.shift === 'Night' ? '🌙 Night' : '☀️ Day'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                log.status === 'Present' ? 'badge-success' : 'badge-danger'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {log.id && (
                                <button
                                  type="button"
                                  className="btn-icon danger"
                                  style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}
                                  title="Delete Attendance Entry"
                                  onClick={() => setConfirmDeleteConfig({
                                    title: 'Delete Attendance Record',
                                    message: `Delete ${s?.name || 'Staff'} attendance record for ${log.date} (${log.shift || 'Day'} Shift)?`,
                                    confirmText: 'Delete Record',
                                    onConfirm: () => {
                                      handleDeleteAttendance(log.id);
                                      setConfirmDeleteConfig(null);
                                    }
                                  })}
                                >
                                  <Trash2 size={15} />
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
          </div>
        );
      })()}

      {activeTab === 'waste' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Bio-Medical Waste Disposal records
            </h3>

            {wasteLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No waste disposal logs found.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bag Type</th>
                      <th>Weight</th>
                      <th>Bill (₹)</th>
                      <th>Receipt Scan</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs.slice().reverse().map(w => (
                      <tr key={w.id}>
                        <td>{w.date}</td>
                        <td style={{ fontWeight: 600 }}>{w.wasteType}</td>
                        <td>{w.weight} kg</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{w.billAmount}</td>
                        <td>
                          {w.billAttachment ? (
                            <div style={{ width: '40px', height: '50px', border: '1px solid var(--border)', background: '#fff', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => {
                              const win = window.open();
                              win.document.write(`<iframe src="${w.billAttachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }}>
                              <img src={w.billAttachment} alt="Scan preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Attachment</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteConfig({
                              title: 'Delete Waste Disposal Log',
                              message: `Delete ${w.wasteType} log recorded on ${w.date}?`,
                              confirmText: 'Delete Record',
                              onConfirm: () => {
                                handleDeleteWasteLog(w.id);
                                setConfirmDeleteConfig(null);
                              }
                            })}
                            title="Delete Record"
                            style={{
                              background: 'rgba(225, 29, 72, 0.08)',
                              border: '1px solid rgba(225, 29, 72, 0.2)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '0.25rem 0.4rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add Waste disposal & Scanned Bill</h3>

            <form onSubmit={handleAddWasteLog}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={wasteDate} 
                  onChange={(e) => setWasteDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio Waste Bag Type</label>
                <select className="form-input" value={wasteType} onChange={(e) => setWasteType(e.target.value)}>
                  <option value="Yellow Bag (Anatomical)">Yellow Bag (Anatomical)</option>
                  <option value="Red Bag (Plastic waste)">Red Bag (Plastic waste)</option>
                  <option value="Blue Box (Glassware)">Blue Box (Glassware)</option>
                  <option value="White Container (Sharps/Needles)">White Container (Sharps/Needles)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Weight (in kg)</label>
                <input type="number" step="0.1" className="form-input" placeholder="e.g. 4.5" value={wasteWeight} onChange={(e) => setWasteWeight(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Authorized Agency</label>
                <input type="text" className="form-input" placeholder="e.g. MediWaste Disposal Ltd" value={wasteAgency} onChange={(e) => setWasteAgency(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Bill Amount (₹)</label>
                <input type="number" className="form-input" placeholder="₹ Payout Amount" value={wasteAmount} onChange={(e) => setWasteAmount(e.target.value)} />
              </div>

              <div className="form-group" style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: '6px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Disposal Receipt Scanner Attachment</label>
                
                {scanPreview ? (
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100px', height: '130px', border: '1px solid var(--border)', background: '#fff', padding: '2px', borderRadius: '4px' }}>
                      <img src={scanPreview} alt="Scan preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => setScanPreview(null)}>Clear Scan</button>
                  </div>
                ) : (
                  <div>
                    <button type="button" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }} onClick={simulateBillScan} disabled={scanning}>
                      <Camera size={14} />
                      {scanning ? 'Scanning bill receipt...' : '📷 Scan Bill Receipt'}
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                Log Waste & Payout
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmDeleteConfig.title}
          message={confirmDeleteConfig.message}
          confirmText={confirmDeleteConfig.confirmText || 'Delete'}
          type="danger"
          onCancel={() => setConfirmDeleteConfig(null)}
          onConfirm={confirmDeleteConfig.onConfirm}
        />
      )}
    </div>
  );
};

export default UtilityLogs;
