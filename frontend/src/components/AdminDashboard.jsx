import React, { useState } from 'react';
import { Shield, UserPlus, Users, Stethoscope, Pill, Bed, Trash2, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = ({
  patients = [],
  doctors = [],
  staffList = [],
  onAddDoctor,
  onDeleteDoctor,
  onAddStaff,
  onDeleteStaff,
  onDeletePatient,
  onDeleteAllPatients
}) => {
  const [activeTab, setActiveTab] = useState('doctors');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('all');
  const [streetFilter, setStreetFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [pincodeFilter, setPincodeFilter] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [specialty, setSpecialty] = useState('General Medicine');

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    let res = false;
    if (role === 'doctor') { 
      res = await onAddDoctor({ name, email, password, specialty }); 
    } else { 
      res = await onAddStaff({ name, email, password, role }); 
    }

    if (res !== false) {
      setName(''); setEmail(''); setPassword(''); setRole('doctor'); setSpecialty('General Medicine');
      alert('User added successfully!');
    } else {
      alert('Failed to add user. Email may already exist or database error occurred.');
    }
  };

  // Staff and Doctor Stats
  const totalDoctors = (doctors || []).length;
  const totalPharmacy = (staffList || []).filter(s => s && s.role === 'pharmacy').length;
  const totalReceptionists = (staffList || []).filter(s => s && s.role === 'receptionist').length;
  const totalWard = (staffList || []).filter(s => s && s.role === 'ward').length;

  // Patient and Payment Stats
  const totalPatientsCount = patients.length;
  const paidPatientsCount = patients.filter(p => p.paymentStatus && p.paymentStatus.startsWith('Paid')).length;
  const unpaidPatientsCount = patients.filter(p => !p.paymentStatus || !p.paymentStatus.startsWith('Paid')).length;

  return (
    <div className="fade-in">
      {/* Primary Stats Grid */}
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Hospital Staffing Statistics
      </h4>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('doctors')}>
          <div className="stat-icon primary"><Stethoscope size={24} /></div>
          <div><div className="stat-value">{totalDoctors}</div><div className="stat-label">Doctors</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>
          <div className="stat-icon info"><Pill size={24} /></div>
          <div><div className="stat-value">{totalPharmacy}</div><div className="stat-label">Pharmacy Staff</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>
          <div className="stat-icon success"><Users size={24} /></div>
          <div><div className="stat-value">{totalReceptionists}</div><div className="stat-label">Receptionists</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>
          <div className="stat-icon warning"><Bed size={24} /></div>
          <div><div className="stat-value">{totalWard}</div><div className="stat-label">Ward Staff</div></div>
        </div>
      </div>

      {/* Patient & Financial Status Stats Grid */}
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Patient Records & Payments Status
      </h4>
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>
          <div className="stat-icon info" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--info)' }}><Users size={24} /></div>
          <div><div className="stat-value">{totalPatientsCount}</div><div className="stat-label">Total Patients</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>
          <div className="stat-icon success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
          <div><div className="stat-value">{paidPatientsCount}</div><div className="stat-label">Paid Consultations</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>
          <div className="stat-icon danger" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}><AlertCircle size={24} /></div>
          <div><div className="stat-value">{unpaidPatientsCount}</div><div className="stat-label">Unpaid Consultations</div></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Add User Form */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <UserPlus size={20} style={{ color: 'var(--primary)' }} />
            Add New User/Staff
          </h3>
          <form onSubmit={handleAddUserSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="email@vijayas.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">User Role</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="doctor">Doctor</option>
                <option value="pharmacy">Pharmacy Staff</option>
                <option value="receptionist">Receptionist</option>
                <option value="ward">Ward Room Staff</option>
              </select>
            </div>
            {role === 'doctor' && (
              <div className="form-group fade-in">
                <label className="form-label">Doctor Specialty</label>
                <input type="text" className="form-input" placeholder="e.g. General Medicine, Orthopedic" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Create User Account
            </button>
          </form>
        </div>

        {/* User / Records Lists */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              Manage System Accounts
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn btn-secondary ${activeTab === 'doctors' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: activeTab === 'doctors' ? 'rgba(255,255,255,0.08)' : '' }}
                onClick={() => setActiveTab('doctors')}
              >Doctors</button>
              <button
                className={`btn btn-secondary ${activeTab === 'staff' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: activeTab === 'staff' ? 'rgba(255,255,255,0.08)' : '' }}
                onClick={() => setActiveTab('staff')}
              >Staff</button>
              <button
                className={`btn btn-secondary ${activeTab === 'patients' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: activeTab === 'patients' ? 'rgba(255,255,255,0.08)' : '' }}
                onClick={() => setActiveTab('patients')}
              >Patients</button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {activeTab === 'doctors' && (
              <table className="custom-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Specialty</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                </thead>
                <tbody>
                  {doctors.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600 }}>{doc.name}</td>
                      <td style={{ fontSize: '0.9rem' }}>{doc.email}</td>
                      <td><span className="badge badge-active">{doc.specialty}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-logout" onClick={() => onDeleteDoctor(doc.id)} title="Delete Doctor" style={{ cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'staff' && (
              <table className="custom-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                </thead>
                <tbody>
                  {staffList.map(staff => (
                    <tr key={staff.id}>
                      <td style={{ fontWeight: 600 }}>{staff.name}</td>
                      <td style={{ fontSize: '0.9rem' }}>{staff.email}</td>
                      <td>
                        <span className={`badge ${staff.role === 'receptionist' ? 'badge-success' : staff.role === 'pharmacy' ? 'badge-active' : 'badge-pending'}`}>
                          {staff.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-logout" onClick={() => onDeleteStaff(staff.id)} title="Delete Staff" style={{ cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'patients' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                    <input type="text" className="form-input" placeholder="Search patient by name or ID..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} style={{ maxWidth: '260px', margin: 0 }} />
                    <select className="form-input" value={patientStatusFilter} onChange={(e) => setPatientStatusFilter(e.target.value)} style={{ maxWidth: '160px', margin: 0 }}>
                      <option value="all">All Patients</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Deleted / Inactive Only</option>
                    </select>
                    <input type="text" className="form-input" placeholder="Filter by Street / Area" value={streetFilter} onChange={(e) => setStreetFilter(e.target.value)} style={{ maxWidth: '160px', margin: 0 }} />
                    <input type="text" className="form-input" placeholder="City / Town" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ maxWidth: '130px', margin: 0 }} />
                    <input type="text" className="form-input" placeholder="Pincode" value={pincodeFilter} onChange={(e) => setPincodeFilter(e.target.value)} style={{ maxWidth: '90px', margin: 0 }} />
                  </div>
                  {patients.length > 0 && (
                    <button type="button" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', background: '#dc2626', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => {
                        if (window.confirm('WARNING: Delete ALL patients? This action cannot be undone!')) {
                          const code = window.prompt("Type 'DELETE ALL' to confirm:");
                          if (code === 'DELETE ALL') { onDeleteAllPatients(); } else { alert('Confirmation failed. No action taken.'); }
                        }
                      }}>
                      <Trash2 size={14} /> Delete All Patients
                    </button>
                  )}
                </div>
                <table className="custom-table">
                  <thead>
                    <tr><th>Patient ID</th><th>Patient</th><th>Doctor</th><th>Address</th><th>Status</th><th>Payment</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {patients.slice().reverse()
                      .filter(patient => {
                        const matchesSearch = patient.name.toLowerCase().includes(patientSearch.toLowerCase()) || String(patient.id).toLowerCase().includes(patientSearch.toLowerCase());
                        const matchesStatus = patientStatusFilter === 'all' || (patientStatusFilter === 'active' && patient.status !== 'Inactive') || (patientStatusFilter === 'inactive' && patient.status === 'Inactive');
                        const addr = (patient.address || '').toLowerCase();
                        const addrParts = addr.split(' | ');
                        const matchesStreet = !streetFilter || (addrParts[0] || '').includes(streetFilter.toLowerCase()) || addr.includes(streetFilter.toLowerCase());
                        const matchesCity = !cityFilter || (addrParts[1] || '').includes(cityFilter.toLowerCase()) || addr.includes(cityFilter.toLowerCase());
                        const matchesPincode = !pincodeFilter || (addrParts[2] || '').includes(pincodeFilter.toLowerCase()) || addr.includes(pincodeFilter.toLowerCase());
                        return matchesSearch && matchesStatus && matchesStreet && matchesCity && matchesPincode;
                      })
                      .map(patient => {
                        const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
                        
                        const getStatusBadge = (status) => {
                          const s = (status || '').toLowerCase().trim();
                          if (s === 'registered' || s === 'inactive' || s === 'in queue' || !status) {
                            return { text: 'In Queue', className: 'badge-pending' };
                          }
                          if (s === 'consulting') {
                            return { text: 'Consulting', className: 'badge-consulting' };
                          }
                          if (s === 'at pharmacy' || s === 'pharmacy') {
                            return { text: 'At Pharmacy', className: 'badge-pharmacy' };
                          }
                          if (s === 'reviewing' || s === 'review') {
                            return { text: 'Reviewing', className: 'badge-reviewing' };
                          }
                          if (s === 'completed' || s === 'paid') {
                            return { text: 'Completed', className: 'badge-completed' };
                          }
                          if (s === 'admitted') {
                            return { text: 'Admitted', className: 'badge-admitted' };
                          }
                          return { text: status, className: 'badge-pending' };
                        };

                        const badgeInfo = getStatusBadge(patient.status);

                        return (
                          <tr key={patient.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{patient.id}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{patient.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{patient.age} Yrs • {patient.gender}</div>
                            </td>
                            <td style={{ fontSize: '0.9rem' }}>
                              {assignedDoc ? assignedDoc.name : 'Unassigned'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '160px' }}>
                              {(() => {
                                const rawAddr = patient.address || '';
                                if (!rawAddr) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>;
                                const parts = rawAddr.split(' | ');
                                return (
                                  <div style={{ lineHeight: '1.5' }}>
                                    {parts[0] && <div>{parts[0]}</div>}
                                    {parts[1] && <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{parts[1]}</div>}
                                    {parts[2] && <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{parts[2]}</div>}
                                  </div>
                                );
                              })()}
                            </td>
                            <td>
                              <span className={`badge ${badgeInfo.className}`}>
                                {badgeInfo.text}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${patient.paymentStatus && patient.paymentStatus.startsWith('Paid') ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 600 }}>
                                {patient.paymentStatus || 'Unpaid'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn-logout" style={{ cursor: 'pointer' }}
                                onClick={() => { if (window.confirm(`Are you sure you want to delete patient ${patient.name}?`)) onDeletePatient(patient.id); }}
                                title="Delete Patient">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
