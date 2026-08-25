import React, { useState } from 'react';
import { Activity, Stethoscope, Pill, Syringe, CheckCircle2, Clock, Search, History, ArrowRight, Users, Check } from 'lucide-react';

const PatientTrackingSystem = ({ patients = [], doctors = [], onUpdatePatientTracking }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);

  // Status Change States
  const [updateDesk, setUpdateDesk] = useState('doctor');
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  // Safe patients list
  const safePatients = Array.isArray(patients) ? patients.filter(Boolean) : [];
  const activePatients = safePatients.filter(p => p && p.status !== 'Inactive');

  const getTrackingHistoryArray = (p) => {
    if (!p) return [];
    let list = [];
    if (Array.isArray(p.trackingHistory)) {
      list = p.trackingHistory;
    } else if (typeof p.trackingHistory === 'string') {
      try {
        const parsed = JSON.parse(p.trackingHistory);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        list = [];
      }
    }
    
    // If empty history, return default initial registration log
    if (list.length === 0) {
      return [{
        id: 'initial',
        desk: 'Reception Desk',
        previousStatus: 'New Registration',
        newStatus: 'In Queue',
        notes: 'Patient registered at Reception & added to Doctor Queue',
        timestamp: p.registrationDate || 'Initial Registration'
      }];
    }
    return list;
  };

  // Filter Logic
  const filteredPatients = activePatients.filter(p => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.id && String(p.id).toLowerCase().includes(q)) ||
      (p.contact && String(p.contact).includes(q))
    );

    if (!matchesSearch) return false;

    const docStatus = p.status || 'In Queue';
    const pharmStatus = p.pharmacyStatus || (p.prescription && Array.isArray(p.prescription) && p.prescription.length > 0 ? (p.issuedMedication ? 'Completed' : 'Pending') : 'N/A');
    const injStatus = p.injectionStatus || 'N/A';

    if (activeTab === 'doctor_pending') {
      return ['In Queue', 'Consulting', 'Reviewing'].includes(docStatus);
    }
    if (activeTab === 'pharmacy_pending') {
      return pharmStatus === 'Pending' || pharmStatus === 'Dispensing';
    }
    if (activeTab === 'injection_pending') {
      return injStatus === 'Pending' || injStatus === 'Administering';
    }
    if (activeTab === 'completed') {
      return docStatus === 'Completed' && (pharmStatus === 'Completed' || pharmStatus === 'N/A') && (injStatus === 'Completed' || injStatus === 'N/A');
    }
    return true;
  });

  // Calculate summary counts
  const doctorPendingCount = activePatients.filter(p => p && ['In Queue', 'Consulting', 'Reviewing'].includes(p.status || 'In Queue')).length;
  const pharmacyPendingCount = activePatients.filter(p => {
    if (!p) return false;
    const s = p.pharmacyStatus || (p.prescription && Array.isArray(p.prescription) && p.prescription.length > 0 ? (p.issuedMedication ? 'Completed' : 'Pending') : 'N/A');
    return s === 'Pending' || s === 'Dispensing';
  }).length;
  const injectionPendingCount = activePatients.filter(p => {
    if (!p) return false;
    const s = p.injectionStatus || 'N/A';
    return s === 'Pending' || s === 'Administering';
  }).length;
  const completedCount = activePatients.filter(p => {
    if (!p) return false;
    const docStatus = p.status || 'In Queue';
    const pharmStatus = p.pharmacyStatus || (p.prescription && Array.isArray(p.prescription) && p.prescription.length > 0 ? (p.issuedMedication ? 'Completed' : 'Pending') : 'N/A');
    const injStatus = p.injectionStatus || 'N/A';
    return docStatus === 'Completed' && (pharmStatus === 'Completed' || pharmStatus === 'N/A') && (injStatus === 'Completed' || injStatus === 'N/A');
  }).length;

  const handleOpenStatusModal = (patient, desk) => {
    setEditingPatient(patient);
    setUpdateDesk(desk);
    if (desk === 'doctor') {
      setNewStatus(patient.status || 'In Queue');
    } else if (desk === 'pharmacy') {
      setNewStatus(patient.pharmacyStatus || (patient.prescription && Array.isArray(patient.prescription) && patient.prescription.length > 0 ? (patient.issuedMedication ? 'Completed' : 'Pending') : 'N/A'));
    } else if (desk === 'injection') {
      setNewStatus(patient.injectionStatus || 'N/A');
    }
    setUpdateNotes('');
  };

  const handleSaveStatusUpdate = async () => {
    if (!editingPatient || !newStatus) return;

    if (onUpdatePatientTracking) {
      await onUpdatePatientTracking(editingPatient.id, updateDesk, newStatus, updateNotes);
    }
    setEditingPatient(null);
  };

  // Clean, professional neutral badge styling
  const getBadgeStyle = (status) => {
    if (status === 'Completed') {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', label: 'Completed' };
    }
    if (status === 'Consulting' || status === 'Dispensing' || status === 'Administering') {
      return { bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', border: '1px solid rgba(56, 189, 248, 0.3)', label: status };
    }
    if (status === 'Pending' || status === 'In Queue' || status === 'Reviewing') {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', label: status };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: '1px solid var(--border)', label: 'N/A' };
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-dark, #0b1329)', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-primary)' }}>
      
      {/* ===== SIMPLE PROFESSIONAL HEADER ===== */}
      <div style={{ 
        background: 'var(--bg-card, #111c30)', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        padding: '1.25rem 1.5rem', 
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} style={{ color: 'var(--primary)' }} />
            Patient Workflow Tracking
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Track real-time patient status across Doctor, Pharmacy & Injection desks.
          </p>
        </div>

        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-dark, rgba(0,0,0,0.2))', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          Active Patients: <strong style={{ color: 'var(--primary)' }}>{activePatients.length}</strong>
        </div>
      </div>

      {/* ===== SUMMARY METRIC BAR ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        
        <div 
          onClick={() => setActiveTab('all')}
          style={{ 
            background: activeTab === 'all' ? 'var(--primary)' : 'var(--bg-card, #111c30)', 
            color: activeTab === 'all' ? '#ffffff' : 'var(--text-primary)',
            padding: '1rem', 
            borderRadius: '10px', 
            border: activeTab === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9 }}>All Patients</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>{activePatients.length}</div>
        </div>

        <div 
          onClick={() => setActiveTab('doctor_pending')}
          style={{ 
            background: activeTab === 'doctor_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)', 
            color: activeTab === 'doctor_pending' ? '#ffffff' : 'var(--text-primary)',
            padding: '1rem', 
            borderRadius: '10px', 
            border: activeTab === 'doctor_pending' ? '1px solid var(--primary)' : '1px solid var(--border)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9 }}>Doctor Queue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>{doctorPendingCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('pharmacy_pending')}
          style={{ 
            background: activeTab === 'pharmacy_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)', 
            color: activeTab === 'pharmacy_pending' ? '#ffffff' : 'var(--text-primary)',
            padding: '1rem', 
            borderRadius: '10px', 
            border: activeTab === 'pharmacy_pending' ? '1px solid var(--primary)' : '1px solid var(--border)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9 }}>Pharmacy Queue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>{pharmacyPendingCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('injection_pending')}
          style={{ 
            background: activeTab === 'injection_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)', 
            color: activeTab === 'injection_pending' ? '#ffffff' : 'var(--text-primary)',
            padding: '1rem', 
            borderRadius: '10px', 
            border: activeTab === 'injection_pending' ? '1px solid var(--primary)' : '1px solid var(--border)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9 }}>Injection Queue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>{injectionPendingCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('completed')}
          style={{ 
            background: activeTab === 'completed' ? 'var(--primary)' : 'var(--bg-card, #111c30)', 
            color: activeTab === 'completed' ? '#ffffff' : 'var(--text-primary)',
            padding: '1rem', 
            borderRadius: '10px', 
            border: activeTab === 'completed' ? '1px solid var(--primary)' : '1px solid var(--border)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9 }}>Completed Desks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>{completedCount}</div>
        </div>

      </div>

      {/* ===== FILTER TABS & SEARCH BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Simple Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: activeTab === 'all' ? 'var(--primary)' : 'var(--bg-card, #111c30)',
              color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('all')}
          >
            All Patients ({activePatients.length})
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: activeTab === 'doctor_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)',
              color: activeTab === 'doctor_pending' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('doctor_pending')}
          >
            Doctor Queue ({doctorPendingCount})
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: activeTab === 'pharmacy_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)',
              color: activeTab === 'pharmacy_pending' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('pharmacy_pending')}
          >
            Pharmacy Queue ({pharmacyPendingCount})
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: activeTab === 'injection_pending' ? 'var(--primary)' : 'var(--bg-card, #111c30)',
              color: activeTab === 'injection_pending' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('injection_pending')}
          >
            Injection Queue ({injectionPendingCount})
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: activeTab === 'completed' ? 'var(--primary)' : 'var(--bg-card, #111c30)',
              color: activeTab === 'completed' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.88rem', borderRadius: '6px' }}
            placeholder="Search by Name, Phone or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      </div>

      {/* ===== PATIENT WORKFLOW CARDS ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredPatients.length === 0 ? (
          <div style={{ background: 'var(--bg-card, #111c30)', padding: '3rem 1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
            <Activity size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>No Matching Workflow Records</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>No patient tracking records match the selected filter.</p>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const docBadge = getBadgeStyle(patient.status || 'In Queue');
            const pharmStatus = patient.pharmacyStatus || (patient.prescription && Array.isArray(patient.prescription) && patient.prescription.length > 0 ? (patient.issuedMedication ? 'Completed' : 'Pending') : 'N/A');
            const pharmBadge = getBadgeStyle(pharmStatus);
            const injStatus = patient.injectionStatus || 'N/A';
            const injBadge = getBadgeStyle(injStatus);

            const docObj = (doctors || []).find(d => d && d.id === patient.assignedDoctorId);
            const trackingList = getTrackingHistoryArray(patient);

            return (
              <div 
                key={patient.id}
                style={{
                  background: 'var(--bg-card, #111c30)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Patient Header: PROMINENT PATIENT ID & CLEAN METADATA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    
                    {/* Patient ID Badge - Highly Visible */}
                    <div style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      letterSpacing: '0.02em',
                      flexShrink: 0
                    }}>
                      ID: #{patient.id}
                    </div>

                    <div>
                      {/* Patient Name */}
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {patient.name}
                      </div>

                      {/* Clean Metadata Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', color: 'var(--text-secondary)', padding: '0.15rem 0.55rem', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--border)' }}>
                          {patient.age} Yrs ({patient.gender})
                        </span>
                        
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', color: 'var(--text-secondary)', padding: '0.15rem 0.55rem', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--border)' }}>
                          {patient.contact}
                        </span>

                        <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--primary)', padding: '0.15rem 0.55rem', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                          Doctor: {docObj ? docObj.name : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* View Audit History Button */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem', borderRadius: '6px', fontWeight: 600 }}
                    onClick={() => setSelectedPatientHistory(patient)}
                  >
                    <History size={14} style={{ color: 'var(--primary)' }} /> View Audit History ({trackingList.length})
                  </button>

                </div>

                {/* ===== 3 WORKFLOW DESK CARDS (CLEAN & UNIFORM) ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  
                  {/* 1. Doctor Desk */}
                  <div style={{ 
                    background: 'var(--bg-dark, rgba(0,0,0,0.2))', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Stethoscope size={16} style={{ color: 'var(--primary)' }} />
                          Doctor Desk
                        </div>
                        <span style={{ fontSize: '0.75rem', background: docBadge.bg, color: docBadge.color, border: docBadge.border, padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                          {docBadge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                        {patient.diagnosis ? (
                          <div><strong style={{ color: 'var(--text-primary)' }}>Diagnosis:</strong> {patient.diagnosis}</div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting Examination</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ 
                        width: '100%', 
                        padding: '0.45rem 0.65rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 700
                      }}
                      onClick={() => handleOpenStatusModal(patient, 'doctor')}
                    >
                      Update Doctor Status
                    </button>
                  </div>

                  {/* 2. Pharmacy Desk */}
                  <div style={{ 
                    background: 'var(--bg-dark, rgba(0,0,0,0.2))', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Pill size={16} style={{ color: 'var(--warning)' }} />
                          Pharmacy Desk
                        </div>
                        <span style={{ fontSize: '0.75rem', background: pharmBadge.bg, color: pharmBadge.color, border: pharmBadge.border, padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                          {pharmBadge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                        {patient.prescription && Array.isArray(patient.prescription) && patient.prescription.length > 0 ? (
                          <div><strong style={{ color: 'var(--text-primary)' }}>Prescription:</strong> {patient.prescription.length} items to issue</div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No Medicines Prescribed</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ 
                        width: '100%', 
                        padding: '0.45rem 0.65rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 700
                      }}
                      onClick={() => handleOpenStatusModal(patient, 'pharmacy')}
                    >
                      Update Pharmacy Status
                    </button>
                  </div>

                  {/* 3. Injection Desk */}
                  <div style={{ 
                    background: 'var(--bg-dark, rgba(0,0,0,0.2))', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Syringe size={16} style={{ color: 'var(--danger)' }} />
                          Injection Desk
                        </div>
                        <span style={{ fontSize: '0.75rem', background: injBadge.bg, color: injBadge.color, border: injBadge.border, padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                          {injBadge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                        {injStatus !== 'N/A' ? (
                          <div><strong style={{ color: 'var(--text-primary)' }}>Status:</strong> {injStatus}</div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No Injection Ordered</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ 
                        width: '100%', 
                        padding: '0.45rem 0.65rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 700
                      }}
                      onClick={() => handleOpenStatusModal(patient, 'injection')}
                    >
                      Update Injection Status
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ===== UPDATE STATUS MODAL ===== */}
      {editingPatient && (
        <div className="modal-overlay" style={{ zIndex: 1100, background: 'rgba(11, 19, 41, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card, #111c30)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Update {updateDesk.toUpperCase()} Status
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Patient: <strong style={{ color: 'var(--primary)' }}>{editingPatient.name}</strong> (ID: #{editingPatient.id})
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Select New Desk Status</label>
              <select
                className="form-input"
                style={{ fontSize: '0.9rem', padding: '0.55rem' }}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {updateDesk === 'doctor' && (
                  <>
                    <option value="In Queue">In Queue</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Completed">Completed</option>
                  </>
                )}
                {updateDesk === 'pharmacy' && (
                  <>
                    <option value="N/A">N/A (No Prescriptions)</option>
                    <option value="Pending">Pending Dispensing</option>
                    <option value="Dispensing">Dispensing Medicines</option>
                    <option value="Completed">Completed (Issued)</option>
                  </>
                )}
                {updateDesk === 'injection' && (
                  <>
                    <option value="N/A">N/A (No Injection)</option>
                    <option value="Pending">Pending Injection</option>
                    <option value="Administering">Administering Injection</option>
                    <option value="Completed">Completed (Administered)</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Staff Audit Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.88rem' }}
                placeholder="Reason / notes for status change..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.95rem' }}
                onClick={() => setEditingPatient(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem' }}
                onClick={handleSaveStatusUpdate}
              >
                Save Status Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRACKING HISTORY TIMELINE MODAL ===== */}
      {selectedPatientHistory && (() => {
        const historyList = getTrackingHistoryArray(selectedPatientHistory);
        return (
          <div className="modal-overlay" style={{ zIndex: 1100, background: 'rgba(11, 19, 41, 0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" style={{ maxWidth: '580px', padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card, #111c30)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} style={{ color: 'var(--primary)' }} />
                    Tracking Audit History ({historyList.length})
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Patient: <strong style={{ color: 'var(--primary)' }}>{selectedPatientHistory.name}</strong> (ID: #{selectedPatientHistory.id})
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => setSelectedPatientHistory(null)}
                >
                  Close
                </button>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {historyList.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        border: '1px solid var(--border)', 
                        padding: '0.85rem 1rem', 
                        borderRadius: '8px', 
                        background: 'var(--bg-dark, rgba(0,0,0,0.2))'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {item.desk}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          ⏱ {item.timestamp}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--bg-card, #111c30)', border: '1px solid var(--border)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.previousStatus}
                        </span>
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          {item.newStatus}
                        </span>
                      </div>

                      {item.notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default PatientTrackingSystem;
