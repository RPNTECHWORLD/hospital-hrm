import React, { useState } from 'react';
import { Search, Users, CheckCircle, AlertCircle, History, FileText, MapPin, Bed, Calendar } from 'lucide-react';

// Helper: extract city from address string "street | city | pincode"
const extractCity = (address) => {
  if (!address) return '';
  const parts = address.split(' | ');
  return parts.length >= 2 ? parts[1].trim() : parts[0].trim();
};

// Helper: extract pincode from address string "street | city | pincode"
const extractPincode = (address) => {
  if (!address) return '';
  const parts = address.split(' | ');
  return parts.length >= 3 ? parts[2].trim() : '';
};

// Helper: format date as pure DD/MM/YY (e.g. 09/08/24)
const formatOnlyDate = (registrationDate, history) => {
  const raw = registrationDate || (history && history[0] && history[0].date) || '';
  if (!raw) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const AdminPatientRecords = ({
  patients = [],
  doctors = [],
  onAdmitToWard
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [aboveAge, setAboveAge] = useState('');
  const [belowAge, setBelowAge] = useState('');
  const [cityFilter, setCityFilter] = useState('all'); // city/town filter
  const [pincodeFilter, setPincodeFilter] = useState('all'); // pincode filter

  // Selected Patient for Details Overlay Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activePrescriptionPreview, setActivePrescriptionPreview] = useState(null);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setAboveAge('');
    setBelowAge('');
    setCityFilter('all');
    setPincodeFilter('all');
  };

  // Unique cities from patient addresses
  const uniqueCities = Array.from(
    new Set(
      patients
        .map(p => extractCity(p.address))
        .filter(c => c && c.length > 0)
    )
  ).sort();

  // Unique pincodes from patient addresses
  const uniquePincodes = Array.from(
    new Set(
      patients
        .map(p => extractPincode(p.address))
        .filter(pin => pin && pin.length > 0)
    )
  ).sort();

  // City-wise patient counts (for stats panel)
  const cityStats = uniqueCities.map(city => ({
    city,
    count: patients.filter(p => extractCity(p.address).toLowerCase() === city.toLowerCase()).length
  })).sort((a, b) => b.count - a.count);

  // Stats Calculations
  const totalCount = patients.length;
  const activeCount = patients.filter(p => p.status !== 'Inactive').length;
  const deletedCount = patients.filter(p => p.status === 'Inactive').length;
  const paidCount = patients.filter(p => p.paymentStatus && p.paymentStatus.startsWith('Paid')).length;

  // Filtered Patients
  const filteredPatients = patients
    .slice()
    .reverse()
    .filter(p => {
      // 1. Search Query (Name, ID, Contact, Mother/Guardian)
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.motherOrGuardianName && p.motherOrGuardianName.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        statusFilter === 'active' ||
        (statusFilter === 'inactive' && p.status === 'Inactive');

      // 3. Payment Filter
      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'paid' && p.paymentStatus && p.paymentStatus.startsWith('Paid')) ||
        (paymentFilter === 'unpaid' && (!p.paymentStatus || !p.paymentStatus.startsWith('Paid')));

      // 4. Above Age Filter (Minimum Age)
      const matchesAboveAge = aboveAge === '' || p.age >= parseInt(aboveAge);

      // 5. Below Age Filter (Maximum Age)
      const matchesBelowAge = belowAge === '' || p.age <= parseInt(belowAge);

      // 6. City / Town Filter
      const matchesCity =
        cityFilter === 'all' ||
        extractCity(p.address).toLowerCase() === cityFilter.toLowerCase();

      // 7. Pincode Filter
      const matchesPincode =
        pincodeFilter === 'all' ||
        extractPincode(p.address) === pincodeFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesAboveAge && matchesBelowAge && matchesCity && matchesPincode;
    });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Patient Directory Console</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Monitor and audit all patients registered in the clinic database.
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active / In Queue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, display: 'inline-block', lineHeight: 1 }}>$</span>
          </div>
          <div>
            <div className="stat-value">{paidCount}</div>
            <div className="stat-label">Paid Visits</div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--primary)' }} />
          Advanced Query & Filters
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem 1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Search Input */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Query</label>
            <input
              type="text"
              className="form-input"
              placeholder="Name, ID, Phone, Mother/Guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Payment Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Payment Status</label>
            <select
              className="form-input"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>

          {/* Active/Inactive Status */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Registration Status</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deleted / Inactive Only</option>
            </select>
          </div>

          {/* City / Town Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} style={{ color: 'var(--primary)' }} /> City / Town Filter
            </label>
            <select
              className="form-input"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="all">All Cities / Towns</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Pincode Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} style={{ color: '#f59e0b' }} /> Pincode Filter
            </label>
            <select
              className="form-input"
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="all">All Pincodes</option>
              {uniquePincodes.map(pin => (
                <option key={pin} value={pin}>{pin}</option>
              ))}
            </select>
          </div>

          {/* Custom Age Ranges */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Age Boundaries</label>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
              <input
                type="number"
                className="form-input"
                placeholder="Min Age"
                value={aboveAge}
                onChange={(e) => setAboveAge(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem', flex: 1, minWidth: 0, margin: 0 }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input
                type="number"
                className="form-input"
                placeholder="Max Age"
                value={belowAge}
                onChange={(e) => setBelowAge(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem', flex: 1, minWidth: 0, margin: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="card" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Patient Database Records</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredPatients.length}</strong> of {totalCount} records
          </span>
        </div>

        <div className="table-container" style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '520px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {filteredPatients.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No matching patient records found with active filters.
            </p>
          ) : (
            <table className="custom-table" style={{ minWidth: '1100px', width: '100%' }}>
              <thead style={{ background: '#e2e8f0' }}>
                <tr style={{ background: '#e2e8f0' }}>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Patient ID</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} style={{ color: 'var(--primary)' }} /> Admit Date
                    </span>
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Patient Info</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Mother / Guardian</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Contact Details</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} style={{ color: 'var(--primary)' }} /> City / Town
                    </span>
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Previous Doctor</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Assigned Doctor</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Queue Status</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Payment</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, textAlign: 'center', background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>Ward</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => {
                  const assignedDoc = doctors.find(d => d.id === p.assignedDoctorId);
                  const queueStatusText = (p.status === 'Registered' || p.status === 'Inactive' || p.status === 'In Queue' || !p.status)
                    ? 'In Queue'
                    : p.status;
                  const statusBadgeClass = queueStatusText === 'Completed'
                    ? 'badge-success'
                    : (queueStatusText === 'In Queue'
                      ? 'badge-pending'
                      : (queueStatusText === 'At Pharmacy' || queueStatusText === 'Pharmacy'
                        ? 'badge-warning'
                        : 'badge-info'));

                  return (
                    <tr
                      key={p.id}
                      style={{
                        cursor: 'pointer',
                        transition: 'background 0.25s ease'
                      }}
                      onClick={() => setSelectedPatient(p)}
                      title="Click to audit patient files & clinical logs"
                      className="hover-row"
                    >
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        #{p.id}
                      </td>
                      <td style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {formatOnlyDate(p.registrationDate, p.history)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {p.age} Yrs • {p.gender}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem' }}>
                        {p.motherOrGuardianName ? (
                          <span>{p.motherOrGuardianName}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>--</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{p.contact}</div>
                        {p.alternatePhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            Alt: {p.alternatePhone}
                          </div>
                        )}
                      </td>
                      <td>
                        {extractCity(p.address) ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(21, 115, 136, 0.08)',
                            color: 'var(--primary)',
                            borderRadius: '12px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid rgba(21, 115, 136, 0.18)',
                            cursor: 'pointer'
                          }}
                            onClick={(e) => { e.stopPropagation(); setCityFilter(extractCity(p.address)); }}
                            title={`Filter by ${extractCity(p.address)}`}
                          >
                            <MapPin size={10} />
                            {extractCity(p.address)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>--</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>
                        {(() => {
                          let trackingLogs = [];
                          if (p.trackingHistory) {
                            if (Array.isArray(p.trackingHistory)) {
                              trackingLogs = p.trackingHistory;
                            } else if (typeof p.trackingHistory === 'string') {
                              try { trackingLogs = JSON.parse(p.trackingHistory); } catch (e) {}
                            }
                          }
                          const reassignLog = trackingLogs.find(log => log && (log.type === 'Doctor Reassignment' || log.previousDoctor || log.newDoctor));

                          const prevDocName = p.previousDoctor || (reassignLog ? (
                            (reassignLog.previousDoctor && reassignLog.previousDoctor !== 'Unassigned')
                              ? reassignLog.previousDoctor
                              : (reassignLog.changedBy && reassignLog.changedBy !== 'System Admin' ? reassignLog.changedBy : null)
                          ) : null);

                          if (prevDocName && prevDocName !== 'Unassigned') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: '#334155',
                                fontWeight: 700,
                                background: 'rgba(100, 116, 139, 0.1)',
                                border: '1px solid rgba(100, 116, 139, 0.25)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.84rem',
                                whiteSpace: 'nowrap'
                              }}>
                                {prevDocName}
                              </span>
                            );
                          }
                          return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>--</span>;
                        })()}
                      </td>
                      <td style={{ fontSize: '0.9rem' }}>
                        {(() => {
                          let trackingLogs = [];
                          if (p.trackingHistory) {
                            if (Array.isArray(p.trackingHistory)) {
                              trackingLogs = p.trackingHistory;
                            } else if (typeof p.trackingHistory === 'string') {
                              try { trackingLogs = JSON.parse(p.trackingHistory); } catch (e) {}
                            }
                          }
                          const reassignLog = trackingLogs.find(log => log && (log.type === 'Doctor Reassignment' || log.previousDoctor || log.newDoctor));

                          return (
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {assignedDoc ? assignedDoc.name : 'Unassigned'}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>
                          {queueStatusText}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.paymentStatus && p.paymentStatus.startsWith('Paid') ? 'badge-success' : 'badge-danger'
                          }`} style={{ fontWeight: 600 }}>
                          {p.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        {!p.wardBedId && onAdmitToWard ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAdmitToWard(p); }}
                            title="Admit to Ward Room"
                            style={{
                              background: 'rgba(15,118,110,0.08)',
                              border: '1px solid rgba(15,118,110,0.25)',
                              borderRadius: '6px',
                              color: '#0f766e',
                              padding: '0.3rem 0.6rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            <Bed size={13} /> Ward
                          </button>
                        ) : p.wardBedId ? (
                          <span style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 700 }}>
                            Bed #{p.wardBedId}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Patient Details Audit Modal */}
      {selectedPatient && (() => {
        const historyItems = [];
        if (selectedPatient.diagnosis) {
          historyItems.push({
            date: selectedPatient.registrationDate || 'Current Checkup',
            doctorName: doctors.find(d => d.id === selectedPatient.assignedDoctorId)?.name || 'Dr. Vijayan',
            diagnosis: selectedPatient.diagnosis,
            prescription: selectedPatient.prescription,
            status: selectedPatient.status,
            paymentStatus: selectedPatient.paymentStatus,
            issuedMedication: selectedPatient.issuedMedication,
            prescriptionImg: selectedPatient.prescriptionImg
          });
        }
        if (selectedPatient.history) {
          selectedPatient.history.slice().reverse().forEach(visit => {
            historyItems.push({
              date: visit.date,
              doctorName: visit.doctorName,
              diagnosis: visit.diagnosis,
              prescription: visit.prescription,
              status: visit.status,
              paymentStatus: visit.paymentStatus,
              issuedMedication: visit.issuedMedication,
              prescriptionImg: visit.prescriptionImg
            });
          });
        }

        const totalVisits = historyItems.length;
        const vitalsDate = selectedPatient.registrationDate ||
          (selectedPatient.history && selectedPatient.history.length > 0 ? selectedPatient.history[selectedPatient.history.length - 1].date : null) ||
          'N/A';

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fade-in 0.2s ease-out'
          }} onClick={() => setSelectedPatient(null)}>
            <div style={{
              background: '#ffffff',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }} onClick={(e) => e.stopPropagation()}>

              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Audit File: {selectedPatient.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Patient ID: #{selectedPatient.id} • Registered Date: {selectedPatient.registrationDate || '--'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content Area */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#fcfcfd' }}>

                {/* Info Grid splits */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

                  {/* Demographics card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Demographics & Relatives
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span>
                        <strong style={{ textTransform: 'capitalize' }}>{selectedPatient.age} Yrs • {selectedPatient.gender}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Father / Husband:</span>
                        <strong>{selectedPatient.fatherOrHusbandName || '--'}</strong>
                      </div>
                      {(() => {
                        const val = selectedPatient.motherOrGuardianName || '';
                        let motherVal = '--';
                        let guardianVal = '--';
                        if (val) {
                          if (val.includes(' | Guardian: ')) {
                            const parts = val.split(' | Guardian: ');
                            motherVal = parts[0].replace('Mother: ', '');
                            guardianVal = parts[1];
                          } else if (val.startsWith('Mother: ')) {
                            motherVal = val.replace('Mother: ', '');
                          } else if (val.startsWith('Guardian: ')) {
                            guardianVal = val.replace('Guardian: ', '');
                          } else {
                            motherVal = val;
                          }
                        }
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Mother's Name:</span>
                              <strong>{motherVal}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Guardian's Name:</span>
                              <strong>{guardianVal}</strong>
                            </div>
                          </>
                        );
                      })()}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Primary Contact:</span>
                        <strong>{selectedPatient.contact || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Alternate Phone:</span>
                        <strong>{selectedPatient.alternatePhone || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                        <strong>{selectedPatient.address || '--'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Vitals card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Checked Vitals Triage
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem', fontStyle: 'italic' }}>
                      Recorded on: {vitalsDate}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>BP / Heart Rate:</span>
                        <strong>{selectedPatient.bp || '--'} • {selectedPatient.hr || '--'} bpm</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Oxygen SPO2:</span>
                        <strong>{selectedPatient.spo2 ? `${selectedPatient.spo2}%` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Temperature:</span>
                        <strong>{selectedPatient.temp ? `${selectedPatient.temp} °F` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GRBS Glucose:</span>
                        <strong>{selectedPatient.grbs || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Height / Weight:</span>
                        <strong>{selectedPatient.height ? `${selectedPatient.height} cm` : '--'} / {selectedPatient.weight ? `${selectedPatient.weight} kg` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Calculated BMI:</span>
                        <strong style={{ color: 'var(--primary)' }}>{selectedPatient.bmi || '--'}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Audit Timeline */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                      <History size={16} style={{ color: 'var(--primary)' }} />
                      Audited Checkup History logs
                    </h4>
                    <span style={{
                      background: 'rgba(21, 115, 136, 0.1)',
                      color: 'var(--primary)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '12px'
                    }}>
                      Total Visits: {totalVisits}
                    </span>
                  </div>

                  {totalVisits === 0 ? (
                    <div style={{
                      padding: '2.5rem',
                      textAlign: 'center',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1.5px dashed var(--border)',
                      color: 'var(--text-muted)'
                    }}>
                      No visit history records logged for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {historyItems.map((visit, index) => (
                        <div
                          key={index}
                          style={{
                            background: visit.date.includes('Current') ? 'rgba(245, 158, 11, 0.04)' : '#ffffff',
                            border: '1.5px solid #cbd5e1',
                            borderLeft: visit.date.includes('Current') ? '4px solid var(--warning)' : '1.5px solid #cbd5e1',
                            padding: '1rem',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            <span>Date: {visit.date}</span>
                            <span>Doctor: {visit.doctorName}</span>
                          </div>

                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Diagnosis: <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{visit.diagnosis || 'None'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <span>Status: {visit.status}</span>
                              <span>Payment: {visit.paymentStatus}</span>
                              <span>Meds Issued: {visit.issuedMedication || 'No'}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{
                                padding: '0.25rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                height: 'auto',
                                border: '1px solid var(--border)',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              onClick={() => setActivePrescriptionPreview({
                                patientName: selectedPatient.name,
                                visit
                              })}
                            >
                              <FileText size={12} /> Open Prescription
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Doctor Reassignment Audit Log Section */}
                {(() => {
                  let trackingLogs = [];
                  if (selectedPatient.trackingHistory) {
                    if (Array.isArray(selectedPatient.trackingHistory)) {
                      trackingLogs = selectedPatient.trackingHistory;
                    } else if (typeof selectedPatient.trackingHistory === 'string') {
                      try { trackingLogs = JSON.parse(selectedPatient.trackingHistory); } catch(e){}
                    }
                  }
                  const reassignmentLogs = trackingLogs.filter(log => log && (log.type === 'Doctor Reassignment' || log.previousDoctor || log.newDoctor));

                  if (reassignmentLogs.length === 0) return null;

                  return (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)' }}>
                          <Users size={16} /> Doctor Reassignment History ({reassignmentLogs.length})
                        </h4>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reassignmentLogs.map((log, i) => (
                          <div key={log.id || i} style={{
                            background: 'rgba(99, 102, 241, 0.04)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            fontSize: '0.85rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', borderBottom: '1px dashed rgba(0,0,0,0.1)', paddingBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                                🔄 Reassigned: {log.previousDoctor || 'Unassigned'} ➔ {log.newDoctor || 'New Doctor'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                📅 {log.dateTime || log.timestamp || '--'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              <div><strong>Changed By:</strong> {log.changedBy || 'System User'}</div>
                              <div><strong>Reason:</strong> {log.reason || 'Routine Reassignment'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedPatient(null);
                    setActivePrescriptionPreview(null);
                  }}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Close Audit Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Prescription Preview Sub-Modal */}
      {activePrescriptionPreview && (() => {
        const { patientName, visit } = activePrescriptionPreview;
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fade-in 0.15s ease-out'
          }} onClick={() => setActivePrescriptionPreview(null)}>
            <div style={{
              background: '#ffffff',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }} onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Prescription Sheet
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Patient: {patientName} • {visit.date}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePrescriptionPreview(null)}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Prescription Content */}
              <div style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '70vh', background: '#ffffff' }}>
                {visit.prescriptionImg ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                      Handwritten Prescription Canvas:
                    </div>
                    <img
                      src={visit.prescriptionImg}
                      alt="Handwritten prescription sheet"
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        border: 'none',
                        background: 'transparent'
                      }}
                    />
                  </div>
                ) : visit.prescription && visit.prescription.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                      Rx Digital Prescription:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {visit.prescription.map((med, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.65rem 0.85rem',
                            background: '#f8fafc',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{med.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {med.dosage} • <strong>{med.duration} Days</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No prescription details recorded for this checkout log.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid var(--border)',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActivePrescriptionPreview(null)}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  Close Prescription
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminPatientRecords;
