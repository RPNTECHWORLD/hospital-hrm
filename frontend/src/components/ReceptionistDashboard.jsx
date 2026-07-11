import React, { useState } from 'react';
import { UserPlus, Users, DollarSign, Calendar, CheckCircle, Clock, Search, History, Check, X, Trash2 } from 'lucide-react';

const ReceptionistDashboard = ({ 
  patients, 
  doctors, 
  onRegisterPatient, 
  onUpdatePaymentStatus, 
  onReRegisterPatient,
  isAdmin = false,
  onDeletePatient
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [contact, setContact] = useState('');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState(doctors[0]?.id || '');
  const [previewImage, setPreviewImage] = useState(null);

  // Vitals States
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [grbs, setGrbs] = useState('');
  const [temp, setTemp] = useState('');
  const [bmi, setBmi] = useState('');

  React.useEffect(() => {
    if (height && weight) {
      const hMeters = parseFloat(height) / 100;
      const wKg = parseFloat(weight);
      if (hMeters > 0 && wKg > 0) {
        setBmi((wKg / (hMeters * hMeters)).toFixed(1));
      } else {
        setBmi('');
      }
    } else {
      setBmi('');
    }
  }, [height, weight]);

  // Search & Re-queue States
  const [receptionistTab, setReceptionistTab] = useState('new'); // 'new' or 'returning'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [reRegisterDoctorId, setReRegisterDoctorId] = useState(doctors[0]?.id || '');
  const [successPatient, setSuccessPatient] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age || !contact || !assignedDoctorId) return;

    let motherOrGuardianValue = '';
    if (motherName.trim() && guardianName.trim()) {
      motherOrGuardianValue = `Mother: ${motherName.trim()} | Guardian: ${guardianName.trim()}`;
    } else if (motherName.trim()) {
      motherOrGuardianValue = `Mother: ${motherName.trim()}`;
    } else if (guardianName.trim()) {
      motherOrGuardianValue = `Guardian: ${guardianName.trim()}`;
    }

    const registered = await onRegisterPatient({
      name,
      age: parseInt(age),
      gender,
      contact,
      fatherOrHusbandName,
      motherOrGuardianName: motherOrGuardianValue,
      alternatePhone,
      address,
      assignedDoctorId: parseInt(assignedDoctorId),
      height,
      weight,
      bp,
      hr,
      spo2,
      grbs,
      temp,
      bmi
    });

    if (registered) {
      setSuccessPatient(registered);
      // Reset Form
      setName('');
      setAge('');
      setGender('Male');
      setContact('');
      setFatherOrHusbandName('');
      setMotherName('');
      setGuardianName('');
      setAlternatePhone('');
      setAddress('');
      setHeight('');
      setWeight('');
      setBp('');
      setHr('');
      setSpo2('');
      setGrbs('');
      setTemp('');
      setBmi('');
    }
  };

  const handleReRegisterClick = async (patientId) => {
    const updated = await onReRegisterPatient(patientId, reRegisterDoctorId, {
      height,
      weight,
      bp,
      hr,
      spo2,
      grbs,
      temp,
      bmi
    });
    if (updated) {
      setSuccessPatient(updated);
      setHeight('');
      setWeight('');
      setBp('');
      setHr('');
      setSpo2('');
      setGrbs('');
      setTemp('');
      setBmi('');
    }
  };

  // Stats
  const totalPatients = patients.length;
  const activeQueue = patients.filter(p => ['Registered', 'Consulting', 'At Pharmacy', 'Reviewing'].includes(p.status)).length;
  const completedConsultations = patients.filter(p => p.status === 'Completed').length;
  const paidConsultations = patients.filter(p => p.paymentStatus === 'Paid').length;

  // Filter existing patients for re-queuing (unique by name/contact combination to avoid duplicates)
  const uniquePatients = [];
  const seenPatients = new Set();
  patients.forEach(p => {
    const key = `${p.name.toLowerCase()}_${p.contact}`;
    if (!seenPatients.has(key)) {
      seenPatients.add(key);
      uniquePatients.push(p);
    }
  });

  const filteredPatients = searchQuery.trim()
    ? uniquePatients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.includes(searchQuery) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalPatients}</div>
            <div className="stat-label">Total Registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{activeQueue}</div>
            <div className="stat-label">In Active Queue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{completedConsultations}</div>
            <div className="stat-label">Awaiting Payment</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">{paidConsultations}</div>
            <div className="stat-label">Payments Collected</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Register Patient Form */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <button 
              type="button"
              className={`btn ${receptionistTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => setReceptionistTab('new')}
            >
              <UserPlus size={16} /> New Patient
            </button>
            <button 
              type="button"
              className={`btn ${receptionistTab === 'returning' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => setReceptionistTab('returning')}
            >
              <Search size={16} /> Returning Patient
            </button>
          </div>

          {receptionistTab === 'new' ? (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                New Patient Registration
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Patient's Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Father's / Husband's Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Father's or Husband's Name"
                      value={fatherOrHusbandName}
                      onChange={(e) => setFatherOrHusbandName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Mother's Name (Optional)"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Guardian's Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Guardian's Name (Optional)"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-input" 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Contact Number"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alternate Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Alternate Mobile (Optional)"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                    />
                  </div>
                </div>



                <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Patient Vitals / Triage
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Height (Ht in cm)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Height (e.g. 170)"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (Wt in kg)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Weight (e.g. 65)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Calculated BMI</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: 'var(--primary)' }}
                        placeholder="BMI"
                        value={bmi}
                        readOnly
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Blood Pressure (BP)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 120/80"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Heart Rate / Pulse (HR)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Pulse (e.g. 72)"
                        value={hr}
                        onChange={(e) => setHr(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">SPO2 (%)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="SPO2 (e.g. 98)"
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GRBS (Blood Sugar)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="GRBS (e.g. 110)"
                        value={grbs}
                        onChange={(e) => setGrbs(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">TEMP (°F)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Temp (e.g. 98.4)"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Available Doctor</label>
                  <select 
                    className="form-input" 
                    value={assignedDoctorId}
                    onChange={(e) => setAssignedDoctorId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Doctor</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Register & Queue Patient
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Search size={20} style={{ color: 'var(--primary)' }} />
                Re-queue Returning Patient
              </h3>

              <div className="form-group">
                <label className="form-label">Search Patient Name, Mobile Number or ID</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Enter name, phone or ID (e.g. VH001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredPatients.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No matching patients found.</p>
                  ) : (
                    filteredPatients.map(p => (
                      <div key={p.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{p.name}</span>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                            ID: #{p.id}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                          <div>{p.age} Yrs • {p.gender} • {p.contact}</div>
                          {p.fatherOrHusbandName && <div>Father/Husband: {p.fatherOrHusbandName}</div>}
                          {p.motherOrGuardianName && (
                            <div>
                              {p.motherOrGuardianName.includes(' | Guardian: ') ? (
                                <>
                                  <div>Mother: {p.motherOrGuardianName.split(' | Guardian: ')[0].replace('Mother: ', '')}</div>
                                  <div>Guardian: {p.motherOrGuardianName.split(' | Guardian: ')[1]}</div>
                                </>
                              ) : p.motherOrGuardianName.startsWith('Mother: ') ? (
                                <div>Mother: {p.motherOrGuardianName.replace('Mother: ', '')}</div>
                              ) : p.motherOrGuardianName.startsWith('Guardian: ') ? (
                                <div>Guardian: {p.motherOrGuardianName.replace('Guardian: ', '')}</div>
                              ) : (
                                <div>Mother/Guardian: {p.motherOrGuardianName}</div>
                              )}
                            </div>
                          )}
                          {p.alternatePhone && <div>Alt Contact: {p.alternatePhone}</div>}
                        </div>
                        
                        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.35rem' }}>Current Visit Vitals / Triage</label>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>Ht (cm)</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="Ht" value={height} onChange={(e) => setHeight(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>Wt (kg)</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="Wt" value={weight} onChange={(e) => setWeight(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>BP</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="BP" value={bp} onChange={(e) => setBp(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>HR</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="HR" value={hr} onChange={(e) => setHr(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>SPO2 (%)</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="SPO2" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>GRBS</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="GRBS" value={grbs} onChange={(e) => setGrbs(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>TEMP (°F)</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem' }} placeholder="TEMP" value={temp} onChange={(e) => setTemp(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>BMI</label>
                              <input type="text" className="form-input" style={{ padding: '0.35rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: 'var(--primary)' }} placeholder="BMI" value={bmi} readOnly />
                            </div>
                          </div>

                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Assign Doctor for New Visit</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                            <select 
                              className="form-input"
                              style={{ padding: '0.45rem', fontSize: '0.85rem', flexGrow: 1 }}
                              value={reRegisterDoctorId}
                              onChange={(e) => setReRegisterDoctorId(e.target.value)}
                            >
                              {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                              ))}
                            </select>
                            
                            <button 
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                              onClick={() => handleReRegisterClick(p.id)}
                            >
                              Queue
                            </button>
                          </div>
                        </div>

                        {((p.history && p.history.length > 0) || p.diagnosis) && (
                          <button 
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginTop: '0.75rem', width: '100%', gap: '0.25rem' }}
                            onClick={() => {
                              if (p.history && p.history.length > 0) {
                                setSelectedPatientForHistory(p);
                              } else {
                                const currentVisitMock = {
                                  name: p.name,
                                  history: [{
                                    visitId: p.id,
                                    date: 'Last Visit Details',
                                    doctorName: doctors.find(d => d.id === p.assignedDoctorId)?.name || 'Unknown',
                                    diagnosis: p.diagnosis,
                                    prescription: p.prescription || [],
                                    issuedMedication: p.issuedMedication || 'None',
                                    paymentStatus: p.paymentStatus,
                                    status: p.status
                                  }]
                                };
                                setSelectedPatientForHistory(currentVisitMock);
                              }
                            }}
                          >
                            <History size={14} /> View Clinical History
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Queue / Patient List */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
            Patients List & Payment Collection
          </h3>

          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No patients registered today.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto', overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Details</th>
                    <th style={{ textAlign: 'center' }}>Token</th>
                    <th>Assigned Doctor</th>
                    <th>Queue Status</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice().reverse().filter(patient => patient.status !== 'Inactive').map(patient => {
                    const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
                    return (
                      <tr key={patient.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          #{patient.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{patient.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {patient.age} Yrs • {patient.gender} • {patient.contact}
                            {patient.fatherOrHusbandName && <div>F/H: {patient.fatherOrHusbandName}</div>}
                            {patient.motherOrGuardianName && (
                              <div>
                                {patient.motherOrGuardianName.includes(' | Guardian: ') ? (
                                  <>
                                    <div>Mother: {patient.motherOrGuardianName.split(' | Guardian: ')[0].replace('Mother: ', '')}</div>
                                    <div>Guardian: {patient.motherOrGuardianName.split(' | Guardian: ')[1]}</div>
                                  </>
                                ) : patient.motherOrGuardianName.startsWith('Mother: ') ? (
                                  <div>Mother: {patient.motherOrGuardianName.replace('Mother: ', '')}</div>
                                ) : patient.motherOrGuardianName.startsWith('Guardian: ') ? (
                                  <div>Guardian: {patient.motherOrGuardianName.replace('Guardian: ', '')}</div>
                                ) : (
                                  <div>Mother/Guardian: {patient.motherOrGuardianName}</div>
                                )}
                              </div>
                            )}
                            {patient.alternatePhone && <div>Alt: {patient.alternatePhone}</div>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--success)',
                            fontWeight: 800,
                            fontSize: '1rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            {patient.tokenNumber ? String(patient.tokenNumber).padStart(2, '0') : '--'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>
                          {assignedDoc ? assignedDoc.name : 'Unassigned'}
                        </td>
                        <td>
                          <span className={`badge ${
                            patient.status === 'Paid' || patient.status === 'Completed' ? 'badge-success' : 'badge-pending'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td>
                          <select 
                            className="form-input" 
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              fontSize: '0.85rem', 
                              width: 'fit-content',
                              background: patient.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: patient.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--danger)',
                              borderColor: patient.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                              fontWeight: 600
                            }}
                            value={patient.paymentStatus}
                            onChange={(e) => onUpdatePaymentStatus(patient.id, e.target.value)}
                          >
                            <option value="Unpaid" style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>Unpaid</option>
                            <option value="Paid" style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>Paid</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-logout" 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete patient ${patient.name}?`)) {
                                onDeletePatient(patient.id);
                              }
                            }}
                            title="Delete Patient"
                            style={{ cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Clinical History Modal */}
      {selectedPatientForHistory && (
        <div className="modal-overlay" onClick={() => setSelectedPatientForHistory(null)}>
          <div className="card modal-content fade-in" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedPatientForHistory.name} - Clinical Visit History</h3>
              <button className="close-btn" onClick={() => setSelectedPatientForHistory(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedPatientForHistory.history && selectedPatientForHistory.history.length > 0 ? (
                selectedPatientForHistory.history.slice().reverse().map((visit, index) => (
                  <div key={index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      <span>Date: {visit.date}</span>
                      <span>Doctor: {visit.doctorName}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                      Diagnosis: <span style={{ fontWeight: 500 }}>{visit.diagnosis}</span>
                    </div>
                    
                    {visit.prescription && visit.prescription.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Prescribed Medicines:</div>
                        <table className="custom-table" style={{ marginTop: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.01)' }}>
                              <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Medicine</th>
                              <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Dosage</th>
                              <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', textAlign: 'right' }}>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visit.prescription.map((med, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{med.name}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{med.dosage}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', textAlign: 'right' }}>{med.duration} Days</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {visit.prescriptionImg && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Handwritten Prescription (Click to enlarge):</div>
                        <img 
                          src={visit.prescriptionImg} 
                          alt="Handwritten Prescription" 
                          style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} 
                          onClick={() => setPreviewImage(visit.prescriptionImg)}
                        />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                      <span>Payment: {visit.paymentStatus}</span>
                      <span>Medication Issued: {visit.issuedMedication || 'None'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No clinical history found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration/Re-queue Success Modal */}
      {successPatient && (
        <div className="modal-overlay" onClick={() => setSuccessPatient(null)}>
          <div className="card modal-content fade-in" style={{ padding: '2rem', maxWidth: '450px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <CheckCircle size={36} />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Patient Queued Successfully!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              The patient has been registered and added to the doctor's queue.
            </p>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Patient Name:</span>
                <strong style={{ fontSize: '0.95rem' }}>{successPatient.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Register ID (Patient ID):</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>#{successPatient.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Token Number:</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{successPatient.tokenNumber ? `#${successPatient.tokenNumber}` : 'N/A'}</strong>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setSuccessPatient(null)}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <img 
              src={previewImage} 
              alt="Prescription Preview" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', borderRadius: '8px' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
