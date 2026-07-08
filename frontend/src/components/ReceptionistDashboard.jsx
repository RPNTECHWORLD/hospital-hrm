import React, { useState } from 'react';
import { UserPlus, Users, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';

const ReceptionistDashboard = ({ patients, doctors, onRegisterPatient, onUpdatePaymentStatus }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState(doctors[0]?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !age || !contact || !assignedDoctorId) return;

    onRegisterPatient({
      name,
      age: parseInt(age),
      gender,
      contact,
      address,
      assignedDoctorId: parseInt(assignedDoctorId)
    });

    // Reset Form
    setName('');
    setAge('');
    setGender('Male');
    setContact('');
    setAddress('');
  };

  // Stats
  const totalPatients = patients.length;
  const activeQueue = patients.filter(p => ['Registered', 'Consulting', 'At Pharmacy', 'Reviewing'].includes(p.status)).length;
  const completedConsultations = patients.filter(p => p.status === 'Completed').length;
  const paidConsultations = patients.filter(p => p.paymentStatus === 'Paid').length;

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
              <label className="form-label">Address</label>
              <textarea 
                className="form-input" 
                rows="2"
                placeholder="Patient's Home Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
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
            <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice().reverse().map(patient => {
                    const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
                    return (
                      <tr key={patient.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{patient.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {patient.age} Yrs • {patient.gender}
                          </div>
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

export default ReceptionistDashboard;
