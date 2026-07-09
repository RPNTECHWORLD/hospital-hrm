import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, Sparkles, Check, ClipboardList, Clock, AlertCircle, FileText, Camera } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const UtilityLogs = () => {
  const [activeTab, setActiveTab] = useState('housekeeping'); // 'housekeeping', 'attendance', 'waste'
  const [loading, setLoading] = useState(false);

  // Housekeeping States
  const [housekeepingLogs, setHousekeepingLogs] = useState([]);
  const [newPlace, setNewPlace] = useState('');
  const [hkNotes, setHkNotes] = useState('');
  const [hkDate, setHkDate] = useState(new Date().toISOString().split('T')[0]);
  const [hkCleaned, setHkCleaned] = useState(false);
  const [hkWatered, setHkWatered] = useState(false);

  // Attendance States
  const [staffList, setStaffList] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { staffId: status }

  // Bio-Waste States
  const [wasteLogs, setWasteLogs] = useState([]);
  const [wasteType, setWasteType] = useState('Yellow Bag (Anatomical)');
  const [wasteWeight, setWasteWeight] = useState('');
  const [wasteAgency, setWasteAgency] = useState('MediWaste Disposal Ltd');
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
        // Initialize attendance map
        const initialMap = {};
        staffData.forEach(s => {
          initialMap[s.id] = 'Present';
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

  // Attendance handlers
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      for (const staffId of Object.keys(attendanceMap)) {
        await fetch(`${API_BASE}/api/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: parseInt(staffId),
            date: attendanceDate,
            status: attendanceMap[staffId],
            markedBy: 'Doctor/Admin'
          })
        });
      }
      alert('Attendance logs recorded successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
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
          date: new Date().toLocaleDateString(),
          wasteType,
          weight: parseFloat(wasteWeight),
          agencyName: wasteAgency,
          billAmount: parseFloat(wasteAmount) || 0,
          billAttachment: scanPreview || ''
        })
      });

      if (response.ok) {
        setWasteWeight('');
        setWasteAmount('');
        setScanPreview(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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

      {activeTab === 'attendance' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              Active Staff Attendance Register
            </h3>

            <form onSubmit={handleMarkAttendance}>
              <div className="form-group">
                <label className="form-label">Select Attendance Date</label>
                <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
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
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{s.role}</td>
                        <td>
                          <select 
                            className="form-input" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'fit-content' }}
                            value={attendanceMap[s.id] || 'Present'}
                            onChange={(e) => setAttendanceMap({
                              ...attendanceMap,
                              [s.id]: e.target.value
                            })}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                ✓ Save Attendance Log
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Historical Attendance Logs</h3>
            
            {attendanceLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No attendance logs found.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Staff ID</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.slice().reverse().map((log, index) => (
                      <tr key={index}>
                        <td>{log.date}</td>
                        <td>Staff #{log.staffId}</td>
                        <td>
                          <span className={`badge ${
                            log.status === 'Present' ? 'badge-success' : 
                            log.status === 'Absent' ? 'badge-danger' : 'badge-pending'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
                <input type="text" className="form-input" value={wasteAgency} onChange={(e) => setWasteAgency(e.target.value)} required />
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
    </div>
  );
};

export default UtilityLogs;
