import React, { useState } from 'react';
import { Search, Users, CheckCircle, AlertCircle, History, FileText, MapPin, Bed, Calendar, Clock, ShieldAlert, Pill, Eye, Filter, Stethoscope, Printer, Mail, X } from 'lucide-react';
import PrescriptionTemplate from './PrescriptionTemplate';
import ChildPrescriptionTemplate from './ChildPrescriptionTemplate';
import { resolvePatientLocation } from '../utils/locationHelper';
import { printPrescriptionDirectly } from '../utils/printHelper';

// Helper: extract city from address string "street | city | pincode" or free-form address
const extractCity = (address) => {
  if (!address) return '';
  if (typeof address !== 'string') return '';
  if (address.includes(' | ')) {
    const parts = address.split(' | ');
    return parts.length >= 2 ? parts[1].trim() : parts[0].trim();
  }
  const resolved = resolvePatientLocation(address);
  if (resolved && resolved !== 'Not Specified') {
    return resolved.replace(/\s*\(\d{6}\)/, '').trim();
  }
  const commaParts = address.split(',').map(s => s.trim()).filter(Boolean);
  return commaParts.length >= 2 ? commaParts[commaParts.length - 1] : address.trim();
};

// Helper: extract pincode from address string
const extractPincode = (address) => {
  if (!address) return '';
  const pinMatch = String(address).match(/\b([1-9]\d{5})\b/);
  return pinMatch ? pinMatch[1] : '';
};

// Helper: Calculate exact stay duration text & milliseconds from stay object
const getStayDurationInfo = (stay) => {
  if (!stay) return { durationText: '0 Mins', totalHours: 0, totalDays: 0, totalMs: 0, isOngoing: false };

  const isOngoing = !stay.dischargeDate || stay.status === 'Admitted';
  const nowMs = Date.now();

  let admitMs = stay.admitTimestamp;
  if (!admitMs && stay.admitDateTime) {
    const parsed = parseAnyDate(stay.admitDateTime);
    admitMs = parsed ? parsed.getTime() : null;
  }
  if (!admitMs && stay.admitDate) {
    const parsed = parseAnyDate(stay.admitDate);
    admitMs = parsed ? parsed.getTime() : null;
  }

  let dischargeMs = stay.dischargeTimestamp;
  if (!dischargeMs && stay.dischargeDateTime) {
    const parsed = parseAnyDate(stay.dischargeDateTime);
    dischargeMs = parsed ? parsed.getTime() : null;
  }
  if (!dischargeMs && stay.dischargeDate) {
    const parsed = parseAnyDate(stay.dischargeDate);
    dischargeMs = parsed ? parsed.getTime() : null;
  }

  if (isOngoing) {
    dischargeMs = nowMs;
  }

  let diffMs = 0;
  if (admitMs && dischargeMs) {
    diffMs = Math.max(0, dischargeMs - admitMs);
  } else if (stay.totalDays) {
    diffMs = parseInt(stay.totalDays, 10) * 86400000;
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(diffMs / 3600000);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  let durationText = '';
  if (days >= 1) {
    if (remainingHours > 0) {
      durationText = `${days} Day${days > 1 ? 's' : ''}, ${remainingHours} Hr${remainingHours > 1 ? 's' : ''}`;
    } else {
      durationText = `${days} Day${days > 1 ? 's' : ''}`;
    }
  } else if (totalHours >= 1) {
    if (remainingMinutes > 0) {
      durationText = `${totalHours} Hr${totalHours > 1 ? 's' : ''}, ${remainingMinutes} Min${remainingMinutes > 1 ? 's' : ''}`;
    } else {
      durationText = `${totalHours} Hr${totalHours > 1 ? 's' : ''}`;
    }
  } else if (totalMinutes > 0) {
    durationText = `${totalMinutes} Min${totalMinutes > 1 ? 's' : ''}`;
  } else if (isOngoing) {
    durationText = '< 1 Min (Just Admitted)';
  } else {
    durationText = stay.stayDuration || 'Less than 1 Hour';
  }

  return {
    durationText,
    totalMinutes,
    totalHours,
    days,
    totalMs: diffMs,
    isOngoing
  };
};

// Helper: Format cumulative milliseconds into friendly string
const formatCumulativeDuration = (totalMs) => {
  if (!totalMs || totalMs <= 0) return '0 Mins';
  const totalMinutes = Math.floor(totalMs / 60000);
  const totalHours = Math.floor(totalMs / 3600000);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days >= 1) {
    if (remainingHours > 0) {
      return `${days} Day${days > 1 ? 's' : ''}, ${remainingHours} Hr${remainingHours > 1 ? 's' : ''}`;
    }
    return `${days} Day${days > 1 ? 's' : ''}`;
  }
  if (totalHours >= 1) {
    if (remainingMinutes > 0) {
      return `${totalHours} Hr${totalHours > 1 ? 's' : ''}, ${remainingMinutes} Min${remainingMinutes > 1 ? 's' : ''}`;
    }
    return `${totalHours} Hr${totalHours > 1 ? 's' : ''}`;
  }
  return `${Math.max(1, totalMinutes)} Min${totalMinutes > 1 ? 's' : ''}`;
};

// Helper: robustly parse any date representation into a valid Date object
const parseAnyDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // 1. Check if string matches DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
  const match = str.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const p3 = parseInt(match[3], 10);

    // Case A: YYYY-MM-DD or YYYY/MM/DD
    if (p1 > 1000) {
      const d = new Date(p1, p2 - 1, p3);
      if (!isNaN(d.getTime())) return d;
    }

    // Year is in p3
    let year = p3;
    if (year < 100) year += 2000;

    // Case B: DD/MM/YYYY (p1 > 12 -> p1 is day, p2 is month)
    if (p1 > 12 && p2 <= 12) {
      const d = new Date(year, p2 - 1, p1);
      if (!isNaN(d.getTime())) return d;
    }

    // Case C: MM/DD/YYYY (p2 > 12 -> p2 is day, p1 is month)
    if (p2 > 12 && p1 <= 12) {
      const d = new Date(year, p1 - 1, p2);
      if (!isNaN(d.getTime())) return d;
    }

    // Case D: Both <= 12 (e.g. 8/9/2026 or 08/09/2026)
    // Standard JS native parse defaults to MM/DD/YYYY (en-US which is standard in registration)
    const nativeDate = new Date(str);
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate;
    }

    const d = new Date(year, p2 - 1, p1);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Standard native Date parsing fallback (e.g. "Aug 27, 2026", ISO timestamps)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

// Helper: compare if two date objects fall on the same calendar day
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Helper: parse any date format into epoch timestamp for accurate chronological sorting
const parseDateToTimestamp = (dateVal, history) => {
  const raw = dateVal || (history && history.length > 0 && (history[history.length - 1].date || history[0].date)) || '';
  if (!raw) return 0;
  const d = parseAnyDate(raw);
  return d ? d.getTime() : 0;
};

// Helper: format date as pure DD/MM/YY (e.g. 26/08/26)
const formatOnlyDate = (registrationDate, history) => {
  const raw = registrationDate || (history && history.length > 0 && (history[history.length - 1].date || history[0].date)) || '';
  if (!raw) return '—';
  const d = parseAnyDate(raw);
  if (d) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
  return String(raw);
};

// Helper: Check if date string matches yesterday
const isYesterdayDate = (dateVal) => {
  const d = parseAnyDate(dateVal);
  if (!d) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d, yesterday);
};

// Helper: Check if date string matches today
const isTodayDate = (dateVal) => {
  const d = parseAnyDate(dateVal);
  if (!d) return false;
  const today = new Date();
  return isSameDay(d, today);
};

// Helper: check if patient matches active date filter (checking registration date, consultation date, and visit histories)
const patientMatchesDateFilter = (patient, filterType, customDateStr) => {
  if (filterType === 'all') return true;

  const candidateDates = [];
  if (patient.registrationDate) candidateDates.push(patient.registrationDate);
  if (patient.consultationDate) candidateDates.push(patient.consultationDate);
  if (Array.isArray(patient.history)) {
    patient.history.forEach(h => {
      if (h && h.date) candidateDates.push(h.date);
    });
  }

  if (candidateDates.length === 0) return false;

  if (filterType === 'today') {
    return candidateDates.some(d => isTodayDate(d));
  }
  if (filterType === 'yesterday') {
    return candidateDates.some(d => isYesterdayDate(d));
  }
  if (filterType === 'custom' && customDateStr) {
    const targetDate = parseAnyDate(customDateStr);
    if (!targetDate) return false;
    return candidateDates.some(d => {
      const parsed = parseAnyDate(d);
      return parsed && isSameDay(parsed, targetDate);
    });
  }

  return true;
};

const AdminPatientRecords = ({
  patients = [],
  doctors = [],
  onAdmitToWard
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'Reviewing', etc.
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [aboveAge, setAboveAge] = useState('');
  const [belowAge, setBelowAge] = useState('');
  const [cityFilter, setCityFilter] = useState('all'); // city/town filter
  const [pincodeFilter, setPincodeFilter] = useState('all'); // pincode filter

  // Selected Patient for Details Overlay Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activePrescriptionPreview, setActivePrescriptionPreview] = useState(null);
  const [activeStaySlip, setActiveStaySlip] = useState(null);
  const [padDesignMode, setPadDesignMode] = useState('auto');

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomDate('');
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
  const activeCount = patients.filter(p => {
    const s = (p.status || '').toLowerCase();
    return s !== 'inactive' && s !== 'deleted';
  }).length;
  const paidCount = patients.filter(p => {
    const s = (p.paymentStatus || p.paymentstatus || '').toLowerCase().trim();
    return s.startsWith('paid');
  }).length;
  const unpaidCount = totalCount - paidCount;

  // Filtered Patients sorted strictly by Admit Date (Descending: Today on top, yesterday below today, etc.)
  const filteredPatients = patients
    .filter(p => {
      // 1. Search Query (Name, ID, Contact, Mother/Guardian, Father/Husband, Email, Address, Token, Doctor)
      const matchesSearch = !searchQuery.trim() || (() => {
        const q = searchQuery.toLowerCase().trim();
        const assignedDoc = (doctors || []).find(d => d.id === p.assignedDoctorId);
        const idStr = String(p.id || '').toLowerCase();
        const numId = idStr.replace(/\D/g, '');
        const qNum = q.replace(/\D/g, '');

        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          idStr.includes(q) ||
          (qNum && numId && numId.includes(qNum)) ||
          (p.contact && String(p.contact).toLowerCase().includes(q)) ||
          (p.alternatePhone && String(p.alternatePhone).toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.motherOrGuardianName && p.motherOrGuardianName.toLowerCase().includes(q)) ||
          (p.fatherOrHusbandName && p.fatherOrHusbandName.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.tokenNumber && String(p.tokenNumber).includes(q)) ||
          (p.previousDoctor && p.previousDoctor.toLowerCase().includes(q)) ||
          (assignedDoc && assignedDoc.name && assignedDoc.name.toLowerCase().includes(q))
        );
      })();

      // 2. Status Filter
      const pStatus = (p.status || '').trim().toLowerCase();
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return pStatus !== 'inactive' && pStatus !== 'deleted';
        if (statusFilter === 'inactive') return pStatus === 'inactive' || pStatus === 'deleted';
        if (statusFilter === 'Reviewing') return pStatus === 'reviewing' || pStatus === 'review';
        if (statusFilter === 'In Queue') return pStatus === 'in queue' || pStatus === 'registered' || pStatus === 'waiting' || !p.status;
        if (statusFilter === 'Consulting') return pStatus === 'consulting';
        if (statusFilter === 'At Pharmacy') return pStatus === 'at pharmacy' || pStatus === 'pharmacy';
        if (statusFilter === 'Completed') return pStatus === 'completed';
        if (statusFilter === 'Admitted' || statusFilter === 'ward_admitted') return pStatus === 'admitted' || Boolean(p.wardBedId) || Boolean(p.bedAdmissionPending);
        if (statusFilter === 'ward_discharged') {
          let wardList = [];
          if (p.wardHistory) {
            if (Array.isArray(p.wardHistory)) wardList = p.wardHistory;
            else if (typeof p.wardHistory === 'string') { try { wardList = JSON.parse(p.wardHistory); } catch (e) {} }
          }
          return !p.wardBedId && wardList.some(s => s && (s.status === 'Discharged' || s.dischargeDate));
        }
        if (statusFilter === 'ward_all') {
          let wardList = [];
          if (p.wardHistory) {
            if (Array.isArray(p.wardHistory)) wardList = p.wardHistory;
            else if (typeof p.wardHistory === 'string') { try { wardList = JSON.parse(p.wardHistory); } catch (e) {} }
          }
          return Boolean(p.wardBedId) || wardList.length > 0;
        }
        return pStatus === statusFilter.toLowerCase();
      })();

      // 3. Date Filter (Check registration date, consultation date, and visit histories)
      const matchesDate = patientMatchesDateFilter(p, dateFilter, customDate);

      // 4. Payment Filter
      const matchesPayment = (() => {
        if (!paymentFilter || paymentFilter === 'all') return true;
        const pPay = (p.paymentStatus || p.paymentstatus || '').toLowerCase().trim();
        if (paymentFilter === 'paid') {
          return pPay.startsWith('paid');
        }
        if (paymentFilter === 'unpaid') {
          return !pPay || pPay.startsWith('unpaid');
        }
        if (paymentFilter === 'cash') {
          return pPay.startsWith('paid') && pPay.includes('cash');
        }
        if (paymentFilter === 'upi') {
          return pPay.startsWith('paid') && pPay.includes('upi');
        }
        if (paymentFilter === 'card') {
          return pPay.startsWith('paid') && pPay.includes('card');
        }
        return pPay.startsWith(paymentFilter.toLowerCase());
      })();

      // 5. Age Boundaries Filter (Min and Max Age)
      const pAge = parseInt(p.age, 10);
      const minA = aboveAge !== '' ? parseInt(aboveAge, 10) : null;
      const maxA = belowAge !== '' ? parseInt(belowAge, 10) : null;
      const matchesAboveAge = minA === null || isNaN(minA) || (!isNaN(pAge) && pAge >= minA);
      const matchesBelowAge = maxA === null || isNaN(maxA) || (!isNaN(pAge) && pAge <= maxA);

      // 6. City / Town Filter (Strictly matches against the patient's identified City/Town)
      const matchesCity = (() => {
        if (!cityFilter || cityFilter === 'all' || cityFilter.trim() === '') return true;
        const query = cityFilter.trim().toLowerCase();
        const pCity = extractCity(p.address).toLowerCase();
        return pCity.includes(query);
      })();

      // 7. Pincode Filter (Strictly matches against the patient's Pincode)
      const matchesPincode = (() => {
        if (!pincodeFilter || pincodeFilter === 'all' || pincodeFilter.trim() === '') return true;
        const query = pincodeFilter.trim();
        const pPin = extractPincode(p.address);
        return pPin.includes(query);
      })();

      return matchesSearch && matchesStatus && matchesDate && matchesPayment && matchesAboveAge && matchesBelowAge && matchesCity && matchesPincode;
    })
    .sort((a, b) => {
      const timeA = parseDateToTimestamp(a.registrationDate, a.history);
      const timeB = parseDateToTimestamp(b.registrationDate, b.history);

      if (timeB !== timeA) {
        return timeB - timeA; // Descending by Admit Date (Newest / Today on top, yesterday next, etc.)
      }

      // If same date, sort by numeric ID descending (e.g. #VH042 before #VH041)
      const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    statusFilter !== 'all' ||
    dateFilter !== 'all' ||
    paymentFilter !== 'all' ||
    aboveAge !== '' ||
    belowAge !== '' ||
    (cityFilter && cityFilter !== 'all' && cityFilter.trim() !== '') ||
    (pincodeFilter && pincodeFilter !== 'all' && pincodeFilter.trim() !== '')
  );

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
      <div className="stats-grid" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
        <div className="stat-card" style={{ cursor: 'pointer', border: !hasActiveFilters ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => handleResetFilters()} title="Click to view all registered patients">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Registered</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer', border: statusFilter === 'active' ? '2px solid var(--success)' : '1px solid var(--border)' }} onClick={() => { handleResetFilters(); setStatusFilter('active'); }} title="Click to filter active patients">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Patients</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer', border: paymentFilter === 'paid' ? '2px solid #10b981' : '1px solid var(--border)' }} onClick={() => { handleResetFilters(); setPaymentFilter('paid'); }} title="Click to filter paid visits">
          <div className="stat-icon warning" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, display: 'inline-block', lineHeight: 1 }}>$</span>
          </div>
          <div>
            <div className="stat-value">{paidCount}</div>
            <div className="stat-label">Paid Visits</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer', border: paymentFilter === 'unpaid' ? '2px solid #ef4444' : '1px solid var(--border)' }} onClick={() => { handleResetFilters(); setPaymentFilter('unpaid'); }} title="Click to filter unpaid visits">
          <div className="stat-icon danger" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{unpaidCount}</div>
            <div className="stat-label">Unpaid Visits</div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} style={{ color: 'var(--primary)' }} />
            Advanced Query & Filters
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <X size={14} /> Clear All Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem 1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Search Input */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Query</label>
            <input
              type="text"
              className="form-input"
              placeholder="Name, ID, Phone, Guardian, Doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Date Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} style={{ color: 'var(--primary)' }} /> Date Filter
            </label>
            <select
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontWeight: dateFilter !== 'all' ? 700 : 400 }}
            >
              <option value="all">All Dates</option>
              <option value="today">Registered / Visited Today</option>
              <option value="yesterday">Registered / Visited Yesterday 📅</option>
              <option value="custom">Custom Date Pick...</option>
            </select>
            {dateFilter === 'custom' && (
              <input
                type="date"
                className="form-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{ marginTop: '0.4rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
              />
            )}
          </div>

          {/* Queue & Registration Status Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={13} style={{ color: 'var(--primary)' }} /> Queue / Registration Status
            </label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontWeight: statusFilter !== 'all' ? 700 : 400 }}
            >
              <option value="all">All Statuses</option>
              <option value="Reviewing">📋 Reviewing (Doctor Follow-Up)</option>
              <option value="In Queue">⏳ In Queue</option>
              <option value="Consulting">🩺 Consulting</option>
              <option value="At Pharmacy">💊 At Pharmacy</option>
              <option value="Completed">✅ Completed</option>
              <option value="ward_admitted">🛏️ In Ward (Currently Admitted)</option>
              <option value="ward_discharged">🏥 Ward Discharged (Past Stays)</option>
              <option value="ward_all">🏥 All Ward Stay Patients</option>
              <option value="active">Active Patients Only</option>
              <option value="inactive">Deleted / Inactive Only</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Payment Status</label>
            <select
              className="form-input"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontWeight: paymentFilter !== 'all' ? 700 : 400 }}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid Only (All Paid)</option>
              <option value="cash">Paid - Cash Only</option>
              <option value="upi">Paid - UPI Only</option>
              <option value="card">Paid - Card Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>

          {/* City / Town Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} style={{ color: 'var(--primary)' }} /> City / Town Filter
            </label>
            <input
              type="text"
              list="city-options-list"
              className="form-input"
              placeholder="Search City / Town..."
              value={cityFilter === 'all' ? '' : cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
            <datalist id="city-options-list">
              {uniqueCities.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Pincode Filter */}
          <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} style={{ color: '#f59e0b' }} /> Pincode Filter
            </label>
            <input
              type="text"
              list="pincode-options-list"
              className="form-input"
              placeholder="Search Pincode..."
              value={pincodeFilter === 'all' ? '' : pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              style={{ fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
            <datalist id="pincode-options-list">
              {uniquePincodes.map(pin => (
                <option key={pin} value={pin} />
              ))}
            </datalist>
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

        {/* Active Filter Pills Indicator */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>
            {searchQuery.trim() && (
              <span style={{ background: 'rgba(21, 115, 136, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Search: "{searchQuery}" <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              </span>
            )}
            {dateFilter !== 'all' && (
              <span style={{ background: 'rgba(21, 115, 136, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : customDate || 'Custom'} <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setDateFilter('all'); setCustomDate(''); }} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Status: {statusFilter} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('all')} />
              </span>
            )}
            {paymentFilter !== 'all' && (
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Payment: {paymentFilter} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPaymentFilter('all')} />
              </span>
            )}
            {cityFilter && cityFilter !== 'all' && (
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                City: {cityFilter} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCityFilter('all')} />
              </span>
            )}
            {pincodeFilter && pincodeFilter !== 'all' && (
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Pin: {pincodeFilter} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPincodeFilter('all')} />
              </span>
            )}
            {(aboveAge !== '' || belowAge !== '') && (
              <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Age: {aboveAge || '0'} to {belowAge || '100+'} <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setAboveAge(''); setBelowAge(''); }} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Patient Directory Table */}
      <div className="card" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Patient Database Records</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: filteredPatients.length > 0 ? 'var(--primary)' : '#ef4444' }}>{filteredPatients.length}</strong> of {totalCount} records
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
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                No matching patient records found with active filters.
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
                Try adjusting or clearing your active filters to display patients in the database.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetFilters}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
              >
                Clear All Filters (Show All {totalCount} Patients)
              </button>
            </div>
          ) : (
            <table className="custom-table" style={{ minWidth: '1350px', width: '100%' }}>
              <thead style={{ background: '#e2e8f0' }}>
                <tr style={{ background: '#e2e8f0' }}>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Patient ID</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} style={{ color: 'var(--primary)' }} /> Admit Date
                    </span>
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Patient Info</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Mother / Guardian</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Contact Details</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap', minWidth: '180px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={13} style={{ color: 'var(--primary)' }} /> Email ID
                    </span>
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} style={{ color: 'var(--primary)' }} /> City / Town
                    </span>
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Previous Doctor</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Assigned Doctor</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Queue Status</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Payment</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, textAlign: 'center', background: '#e2e8f0', color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #cbd5e1', whiteSpace: 'nowrap' }}>Ward</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => {
                  const assignedDoc = doctors.find(d => d.id === p.assignedDoctorId);
                  const queueStatusText = (p.status === 'Registered' || p.status === 'Inactive' || p.status === 'In Queue' || !p.status)
                    ? 'In Queue'
                    : p.status;

                  const getStatusBadgeClass = (status) => {
                    const s = (status || '').toLowerCase().trim();
                    if (s === 'completed') return 'badge-completed';
                    if (s === 'registered' || s === 'in queue' || !status) return 'badge-pending';
                    if (s === 'at pharmacy' || s === 'pharmacy') return 'badge-pharmacy';
                    if (s === 'reviewing' || s === 'review') return 'badge-reviewing';
                    if (s === 'consulting') return 'badge-consulting';
                    if (s === 'admitted') return 'badge-admitted';
                    return 'badge-info';
                  };

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
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
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
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <div>{p.contact}</div>
                        {p.alternatePhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            Alt: {p.alternatePhone}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(21, 115, 136, 0.08)',
                              color: 'var(--primary)',
                              borderRadius: '12px',
                              padding: '0.22rem 0.65rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              border: '1px solid rgba(21, 115, 136, 0.2)',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap'
                            }}
                            title={`Click to send email to ${p.email}`}
                          >
                            <Mail size={11} style={{ flexShrink: 0 }} />
                            <span>{p.email}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>--</span>
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
                          const historyDoc = (p.history && Array.isArray(p.history) && p.history.length > 0)
                            ? p.history[p.history.length - 1].doctorName
                            : null;

                          const currentAssignedDoc = (doctors || []).find(d => parseInt(d.id) === parseInt(p.assignedDoctorId));
                          const currentDocName = currentAssignedDoc ? currentAssignedDoc.name : (p.assignedDoctorName || '');

                          const prevDocName = p.previousDoctor || (reassignLog ? (
                            (reassignLog.previousDoctor && reassignLog.previousDoctor !== 'Unassigned')
                              ? reassignLog.previousDoctor
                              : (reassignLog.changedBy && reassignLog.changedBy !== 'System Admin' ? reassignLog.changedBy : null)
                          ) : null) || historyDoc;

                          if (prevDocName && prevDocName !== 'Unassigned' && prevDocName !== currentDocName) {
                            return (
                              <span className="previous-doctor-badge">
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
                        <span className={`badge ${getStatusBadgeClass(p.status)}`}>
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
                        {(() => {
                          let wardLogs = [];
                          if (p.wardHistory) {
                            if (Array.isArray(p.wardHistory)) {
                              wardLogs = p.wardHistory;
                            } else if (typeof p.wardHistory === 'string') {
                              try { wardLogs = JSON.parse(p.wardHistory); } catch (e) {}
                            }
                          }
                          const activeStay = wardLogs.find(s => s && (s.status === 'Admitted' || !s.dischargeDate));
                          const pastStays = wardLogs.filter(s => s && (s.status === 'Discharged' || s.dischargeDate));

                          if (p.wardBedId) {
                            const durationBadgeText = activeStay ? getStayDurationInfo(activeStay).durationText : 'Admitted';
                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{
                                  fontSize: '0.78rem',
                                  color: '#0f766e',
                                  fontWeight: 800,
                                  background: 'rgba(15, 118, 110, 0.12)',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(15, 118, 110, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}>
                                  <Bed size={13} /> Bed #{p.wardBedId}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                                  🟢 In Ward ({durationBadgeText})
                                </span>
                              </div>
                            );
                          }

                          if (pastStays.length > 0) {
                            const latestPast = pastStays[0];
                            const latestPastInfo = getStayDurationInfo(latestPast);
                            const totalPastMs = pastStays.reduce((acc, s) => acc + getStayDurationInfo(s).totalMs, 0);
                            const displayDuration = formatCumulativeDuration(totalPastMs);

                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                <span
                                  title={`Ward Stay: Admitted ${latestPast.admitDate || '--'} to ${latestPast.dischargeDate || '--'} (${latestPastInfo.durationText}) • Click to view full audit logs`}
                                  onClick={(e) => { e.stopPropagation(); setSelectedPatient(p); }}
                                  style={{
                                    fontSize: '0.76rem',
                                    color: '#0284c7',
                                    fontWeight: 700,
                                    background: 'rgba(2, 132, 199, 0.1)',
                                    padding: '0.22rem 0.55rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(2, 132, 199, 0.25)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <History size={12} /> Stay: {displayDuration}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  Discharged ({latestPast.dischargeDate || 'Past'})
                                </span>
                              </div>
                            );
                          }

                          if (onAdmitToWard) {
                            return (
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
                                <Bed size={13} /> + Ward
                              </button>
                            );
                          }

                          return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>--</span>;
                        })()}
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
        if (selectedPatient.diagnosis || selectedPatient.prescription) {
          historyItems.push({
            date: selectedPatient.registrationDate ? `${selectedPatient.registrationDate} (Current Visit)` : 'Current Visit',
            doctorName: doctors.find(d => d.id === selectedPatient.assignedDoctorId)?.name || 'Dr. Vijayan',
            diagnosis: selectedPatient.diagnosis || 'General Checkup',
            prescription: selectedPatient.prescription,
            status: selectedPatient.status,
            paymentStatus: selectedPatient.paymentStatus,
            issuedMedication: selectedPatient.issuedMedication,
            prescriptionImg: selectedPatient.prescriptionImg,
            complaints: selectedPatient.complaints,
            examination: selectedPatient.examination,
            pastHistory: selectedPatient.pastHistory,
            investigation: selectedPatient.investigation,
            bp: selectedPatient.bp,
            hr: selectedPatient.hr,
            spo2: selectedPatient.spo2,
            temp: selectedPatient.temp,
            grbs: selectedPatient.grbs,
            weight: selectedPatient.weight,
            height: selectedPatient.height,
            patientCategory: selectedPatient.patientCategory,
            age: selectedPatient.age,
            gender: selectedPatient.gender
          });
        }
        if (selectedPatient.history) {
          selectedPatient.history.slice().reverse().forEach(visit => {
            historyItems.push({
              date: visit.date,
              doctorName: visit.doctorName || 'Dr. Vijayan',
              diagnosis: visit.diagnosis || 'Checkup Completed',
              prescription: visit.prescription,
              status: visit.status,
              paymentStatus: visit.paymentStatus,
              issuedMedication: visit.issuedMedication,
              prescriptionImg: visit.prescriptionImg,
              complaints: visit.complaints,
              examination: visit.examination,
              pastHistory: visit.pastHistory,
              investigation: visit.investigation,
              bp: visit.bp,
              hr: visit.hr,
              spo2: visit.spo2,
              temp: visit.temp,
              grbs: visit.grbs,
              weight: visit.weight,
              height: visit.height,
              patientCategory: visit.patientCategory,
              age: visit.age,
              gender: visit.gender
            });
          });
        }

        const totalVisits = historyItems.length;
        const vitalsDate = selectedPatient.registrationDate ||
          (selectedPatient.history && selectedPatient.history.length > 0 ? selectedPatient.history[selectedPatient.history.length - 1].date : null) ||
          'N/A';

        return (
          <div className="audit-modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            animation: 'fade-in 0.2s ease-out'
          }} onClick={() => setSelectedPatient(null)}>
            <div className="audit-modal-container" style={{
              background: 'var(--bg-card, #111c30)',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '94vh',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }} onClick={(e) => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="audit-modal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
                    background: 'rgba(128, 128, 128, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content Area */}
              <div className="audit-modal-body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, background: 'var(--bg-dark, #0b1329)' }}>

                {/* Info Grid splits */}
                <div className="audit-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>

                  {/* Demographics card */}
                  <div style={{
                    background: 'var(--bg-card, #111c30)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Demographics & Relatives
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{selectedPatient.age} Yrs • {selectedPatient.gender}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Father / Husband:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.fatherOrHusbandName || '--'}</strong>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Mother's Name:</span>
                              <strong style={{ color: 'var(--text-primary)' }}>{motherVal}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Guardian's Name:</span>
                              <strong style={{ color: 'var(--text-primary)' }}>{guardianVal}</strong>
                            </div>
                          </>
                        );
                      })()}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Primary Contact:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.contact || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Email ID:</span>
                        <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {selectedPatient.email ? (
                            <a href={`mailto:${selectedPatient.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              {selectedPatient.email}
                            </a>
                          ) : '--'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Alternate Phone:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.alternatePhone || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.address || '--'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Vitals card */}
                  <div style={{
                    background: 'var(--bg-card, #111c30)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Checked Vitals Triage
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem', fontStyle: 'italic' }}>
                      Recorded on: {vitalsDate}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>BP / Heart Rate:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.bp || '--'} • {selectedPatient.hr || '--'} bpm</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Oxygen SPO2:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.spo2 ? `${selectedPatient.spo2}%` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Temperature:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.temp ? `${selectedPatient.temp} °F` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GRBS Glucose:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.grbs || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Height / Weight:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedPatient.height ? `${selectedPatient.height} cm` : '--'} / {selectedPatient.weight ? `${selectedPatient.weight} kg` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Calculated BMI:</span>
                        <strong style={{ color: 'var(--primary)' }}>{selectedPatient.bmi || '--'}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Doctor Review & Clinical Consultation Audit Card */}
                <div style={{
                  background: selectedPatient.status === 'Reviewing' ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-card, #111c30)',
                  border: selectedPatient.status === 'Reviewing' ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: selectedPatient.status === 'Reviewing' ? '#a78bfa' : 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Stethoscope size={18} />
                      {selectedPatient.status === 'Reviewing' ? '📋 Doctor Review Details (Follow-Up)' : '🩺 Primary Clinical Consultation Details'}
                    </h4>
                    <span className={`badge ${selectedPatient.status === 'Reviewing' ? 'badge-reviewing' : (selectedPatient.status === 'Completed' ? 'badge-success' : 'badge-info')}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', fontWeight: 800 }}>
                      Status: {selectedPatient.status || 'In Queue'}
                    </span>
                  </div>

                  {/* Doctor & Fulfillment Summary Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Assigned Doctor</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {doctors.find(d => Number(d.id) === Number(selectedPatient.assignedDoctorId))?.name || selectedPatient.assignedDoctorName || 'Dr. Vijayan'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Pharmacy Fulfillment</span>
                      <strong style={{ fontSize: '0.9rem', color: selectedPatient.issuedMedication ? 'var(--success)' : 'var(--warning)' }}>
                        {selectedPatient.issuedMedication || 'Pending / None Issued'}
                      </strong>
                    </div>
                    {selectedPatient.previousDoctor && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Previous Doctor</span>
                        <span className="previous-doctor-badge">{selectedPatient.previousDoctor}</span>
                      </div>
                    )}
                  </div>

                  {/* Consultation / Review Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {/* Diagnosis */}
                    <div style={{ background: 'var(--bg-card, #111c30)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        Diagnosis / Doctor Assessment
                      </span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {selectedPatient.diagnosis ||
                          (selectedPatient.history && selectedPatient.history.length > 0 && selectedPatient.history[selectedPatient.history.length - 1].diagnosis) ||
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No diagnosis recorded</span>}
                      </div>
                    </div>

                    {/* Chief Complaints */}
                    <div style={{ background: 'var(--bg-card, #111c30)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        Chief Complaints
                      </span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {selectedPatient.complaints ||
                          (selectedPatient.history && selectedPatient.history.length > 0 && selectedPatient.history[selectedPatient.history.length - 1].complaints) ||
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>--</span>}
                      </div>
                    </div>

                    {/* Examination */}
                    <div style={{ background: 'var(--bg-card, #111c30)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        Clinical Examination
                      </span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {selectedPatient.examination ||
                          (selectedPatient.history && selectedPatient.history.length > 0 && selectedPatient.history[selectedPatient.history.length - 1].examination) ||
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>--</span>}
                      </div>
                    </div>

                    {/* Investigation / Lab Orders */}
                    <div style={{ background: 'var(--bg-card, #111c30)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        Ordered Investigation / Lab Tests
                      </span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {selectedPatient.investigation ||
                          (selectedPatient.history && selectedPatient.history.length > 0 && selectedPatient.history[selectedPatient.history.length - 1].investigation) ||
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>--</span>}
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
                      background: 'rgba(56, 189, 248, 0.12)',
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
                      background: 'var(--bg-card, #111c30)',
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
                            background: visit.date.includes('Current') ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card, #111c30)',
                            border: '1px solid var(--border)',
                            borderLeft: visit.date.includes('Current') ? '4px solid var(--warning)' : '1px solid var(--border)',
                            padding: '1rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            <span>Date: {visit.date}</span>
                            <span>Doctor: {visit.doctorName}</span>
                          </div>

                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Diagnosis: <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{visit.diagnosis || 'None'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
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
                              onClick={() => {
                                const isChild = selectedPatient.patientCategory === 'child' || (selectedPatient.age && parseInt(selectedPatient.age) <= 12) || (visit.patientCategory === 'child') || (visit.age && parseInt(visit.age) <= 12);
                                const combinedPatient = {
                                  ...selectedPatient,
                                  patientCategory: isChild ? 'child' : (selectedPatient.patientCategory || 'adult'),
                                  registrationDate: visit.date ? (visit.date.includes('(') ? visit.date.split('(')[0].trim() : visit.date) : selectedPatient.registrationDate,
                                  assignedDoctorName: visit.doctorName || selectedPatient.assignedDoctorName || 'Dr. Vijayan',
                                  diagnosis: visit.diagnosis || selectedPatient.diagnosis || '',
                                  prescription: visit.prescription || (selectedPatient.prescription && Array.isArray(selectedPatient.prescription) ? selectedPatient.prescription : []),
                                  prescriptionImg: visit.prescriptionImg || selectedPatient.prescriptionImg || null,
                                  complaints: visit.complaints || selectedPatient.complaints || '',
                                  pastHistory: visit.pastHistory || selectedPatient.pastHistory || '',
                                  examination: visit.examination || selectedPatient.examination || '',
                                  investigation: visit.investigation || selectedPatient.investigation || '',
                                  bp: visit.bp || selectedPatient.bp || '',
                                  hr: visit.hr || selectedPatient.hr || '',
                                  spo2: visit.spo2 || selectedPatient.spo2 || '',
                                  temp: visit.temp || selectedPatient.temp || '',
                                  grbs: visit.grbs || selectedPatient.grbs || '',
                                  weight: visit.weight || selectedPatient.weight || '',
                                  height: visit.height || selectedPatient.height || '',
                                };
                                setActivePrescriptionPreview({
                                  patientName: selectedPatient.name,
                                  patient: combinedPatient,
                                  visit
                                });
                                setPadDesignMode('auto');
                              }}
                            >
                              <FileText size={12} /> Open Prescription
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ward & Hospital Bed Stay History Audit Section */}
                {(() => {
                  let wardLogs = [];
                  if (selectedPatient.wardHistory) {
                    if (Array.isArray(selectedPatient.wardHistory)) {
                      wardLogs = selectedPatient.wardHistory;
                    } else if (typeof selectedPatient.wardHistory === 'string') {
                      try { wardLogs = JSON.parse(selectedPatient.wardHistory); } catch (e) {}
                    }
                  }

                  const activeWardStay = wardLogs.find(s => s && (s.status === 'Admitted' || !s.dischargeDate));
                  const totalWardStaysCount = wardLogs.length;
                  const totalCumulativeMs = wardLogs.reduce((sum, s) => sum + getStayDurationInfo(s).totalMs, 0);
                  const cumulativeDurationFormatted = formatCumulativeDuration(totalCumulativeMs);

                  return (
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '1.25rem',
                      marginTop: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0f766e' }}>
                          <Bed size={18} /> Inpatient & Ward Stay Audit History
                        </h4>
                        {wardLogs.length > 0 && (
                          <span style={{
                            background: 'rgba(15, 118, 110, 0.12)',
                            color: '#0f766e',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(15, 118, 110, 0.25)'
                          }}>
                            Total Ward Stays: {totalWardStaysCount} • Cumulative: {cumulativeDurationFormatted}
                          </span>
                        )}
                      </div>

                      {/* Summary Banner */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                        background: 'var(--bg-card, #111c30)',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Current Ward Status</span>
                          {selectedPatient.wardBedId ? (
                            <strong style={{ color: '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🟢 Admitted in Bed #{selectedPatient.wardBedId}
                            </strong>
                          ) : wardLogs.length > 0 ? (
                            <strong style={{ color: '#0284c7', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🚪 Discharged ({wardLogs[0]?.dischargeDate || 'Completed'})
                            </strong>
                          ) : (
                            <strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Never Admitted
                            </strong>
                          )}
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Total Inpatient Duration</span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {wardLogs.length > 0 ? `${cumulativeDurationFormatted}${activeWardStay ? ' (Active Stay)' : ' Total'}` : (selectedPatient.wardBedId ? 'Active Inpatient (Ongoing)' : '0 Hours / None')}
                          </strong>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Last Bed Occupied</span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {selectedPatient.wardBedId ? `Bed #${selectedPatient.wardBedId}` : (wardLogs[0]?.bedId ? `Bed #${wardLogs[0].bedId} (${wardLogs[0].bedLabel || 'Room ' + wardLogs[0].room})` : 'N/A')}
                          </strong>
                        </div>
                      </div>

                      {/* Ward Stay Session Cards */}
                      {wardLogs.length === 0 ? (
                        <div style={{
                          padding: '2rem 1.5rem',
                          textAlign: 'center',
                          background: 'var(--bg-card, #111c30)',
                          borderRadius: '10px',
                          border: '1.5px dashed var(--border)',
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem'
                        }}>
                          {selectedPatient.wardBedId ? `Patient is currently assigned to Bed #${selectedPatient.wardBedId}. Official discharge duration will be calculated once discharged.` : 'No ward room admission records logged for this patient yet.'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {wardLogs.map((stay, index) => {
                            const stayInfo = getStayDurationInfo(stay);
                            const isOngoing = stayInfo.isOngoing;

                            return (
                              <div
                                key={stay.id || index}
                                style={{
                                  background: isOngoing ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-card, #111c30)',
                                  border: isOngoing ? '1.5px solid rgba(15, 118, 110, 0.4)' : '1px solid var(--border)',
                                  borderLeft: isOngoing ? '4px solid #0f766e' : '4px solid #0284c7',
                                  borderRadius: '10px',
                                  padding: '1rem 1.25rem',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                      background: isOngoing ? '#0f766e' : '#0284c7',
                                      color: '#fff',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '6px'
                                    }}>
                                      {isOngoing ? 'ACTIVE ADMISSION' : `STAY #${wardLogs.length - index}`}
                                    </span>
                                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                      {stay.bedLabel || `Room ${stay.room || '101'} - ${stay.bedName || 'Bed A'}`} (Bed #{stay.bedId})
                                    </strong>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                      background: isOngoing ? 'rgba(22, 163, 74, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                                      color: isOngoing ? '#16a34a' : '#0284c7',
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      padding: '0.25rem 0.65rem',
                                      borderRadius: '8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}>
                                      <Clock size={13} /> Stay: {stayInfo.durationText}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => setActiveStaySlip({ patient: selectedPatient, stay })}
                                      title="Print or View Ward Stay / Discharge Slip"
                                      style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--primary)',
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                      }}
                                    >
                                      <Printer size={12} /> Slip
                                    </button>
                                  </div>
                                </div>

                                {/* Stay Timeline Grid */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '0.75rem',
                                  background: 'var(--bg-dark, rgba(0,0,0,0.2))',
                                  padding: '0.75rem 1rem',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.82rem'
                                }}>
                                  <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>📅 Admitted On:</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                      {stay.admitDateTime || stay.admitDate || '--'}
                                    </strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
                                      By: {stay.admittedBy || 'Ward Staff'}
                                    </span>
                                  </div>

                                  <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>🚪 Discharged On:</span>
                                    <strong style={{ color: isOngoing ? '#16a34a' : 'var(--text-primary)' }}>
                                      {isOngoing ? 'Currently In Ward' : (stay.dischargeDateTime || stay.dischargeDate || '--')}
                                    </strong>
                                    {!isOngoing && (
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
                                        By: {stay.dischargedBy || 'Ward Staff'}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>⏱️ Duration:</span>
                                    <strong style={{ color: '#0f766e', fontWeight: 800 }}>
                                      {stayInfo.durationText}
                                    </strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
                                      Status: {isOngoing ? 'Active Inpatient' : 'Discharged'}
                                    </span>
                                  </div>
                                </div>

                                {stay.notes && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Notes:</strong> {stay.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                            background: 'rgba(56, 189, 248, 0.08)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            fontSize: '0.85rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                                🔄 Reassigned: {log.previousDoctor || 'Unassigned'} ➔ {log.newDoctor || 'New Doctor'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                📅 {log.dateTime || log.timestamp || '--'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              <div><strong style={{ color: 'var(--text-primary)' }}>Changed By:</strong> {log.changedBy || 'System User'}</div>
                              <div><strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {log.reason || 'Routine Reassignment'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Footer */}
              <div className="audit-footer" style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)',
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

      {/* Full Prescription Preview Modal */}
      {activePrescriptionPreview && (() => {
        const rxPatient = activePrescriptionPreview.patient || {
          ...selectedPatient,
          ...(activePrescriptionPreview.visit || {}),
          name: activePrescriptionPreview.patientName || selectedPatient?.name
        };
        const isPediatric = padDesignMode === 'child' || (padDesignMode === 'auto' && (rxPatient?.patientCategory === 'child' || (rxPatient?.age && parseInt(rxPatient.age) <= 12)));

        return (
          <div className="rx-modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fade-in 0.15s ease-out'
          }} onClick={() => setActivePrescriptionPreview(null)}>
            <div className="rx-modal-container" style={{
              background: 'var(--bg-card, #111c30)',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '94vh',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }} onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="rx-modal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                    Official Prescription Sheet
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Patient: <strong style={{ color: 'var(--primary)' }}>{rxPatient.name}</strong> • UHID: #{rxPatient.id || rxPatient.patientId || '--'} • Date: {activePrescriptionPreview.visit?.date || rxPatient.registrationDate || '--'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePrescriptionPreview(null)}
                  style={{
                    background: 'rgba(128, 128, 128, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Pad Selection & Prescription Body */}
              <div className="rx-modal-body" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '74vh', background: 'var(--bg-dark, #0b1329)' }}>
                
                {/* Pad Design Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select Pad Design:</span>
                  <button
                    type="button"
                    className={`btn ${!isPediatric ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => setPadDesignMode('adult')}
                  >
                    Standard Adult Pad
                  </button>
                  <button
                    type="button"
                    className={`btn ${isPediatric ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => setPadDesignMode('child')}
                  >
                    Pediatric / Child Pad (Vijaya's)
                  </button>
                </div>

                {/* Prescription Component */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  {isPediatric ? (
                    <ChildPrescriptionTemplate patient={rxPatient} />
                  ) : (
                    <PrescriptionTemplate patient={rxPatient} />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="rx-modal-footer" style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-card, #111c30)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Doctor: <strong style={{ color: 'var(--text-primary)' }}>{rxPatient.assignedDoctorName || rxPatient.doctorName || 'Dr. Vijayan'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => printPrescriptionDirectly('printable-rx')}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Printer size={16} /> Print Prescription
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActivePrescriptionPreview(null)}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Ward Stay & Discharge Slip Modal */}
      {activeStaySlip && (() => {
        const { patient, stay } = activeStaySlip;
        const isOngoing = !stay.dischargeDate || stay.status === 'Admitted';

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }} onClick={() => setActiveStaySlip(null)}>
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '650px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Slip Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f766e, #0e7490)',
                color: '#fff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>VIJAYA'S HEALTH CARE</h3>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Inpatient Ward Admission & Stay Summary Certificate
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStaySlip(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Slip Content */}
              <div style={{ padding: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>PATIENT NAME</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{patient.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      ID: #{patient.id} • {patient.age} Yrs • {patient.gender}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>WARD / ROOM</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f766e' }}>
                      {stay.bedLabel || `Room ${stay.room || '101'} - ${stay.bedName || 'Bed A'}`}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Bed Identifier: #{stay.bedId}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>ADMISSION DATE & TIME</span>
                    <strong style={{ color: '#0f172a' }}>{stay.admitDateTime || stay.admitDate || '--'}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Admitted By: {stay.admittedBy || 'Ward Desk'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>DISCHARGE DATE & TIME</span>
                    <strong style={{ color: isOngoing ? '#16a34a' : '#0f172a' }}>
                      {isOngoing ? 'Currently In Ward' : (stay.dischargeDateTime || stay.dischargeDate || '--')}
                    </strong>
                    {!isOngoing && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Discharged By: {stay.dischargedBy || 'Ward Staff'}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#065f46', display: 'block', fontWeight: 700 }}>TOTAL STAY DURATION</span>
                    <strong style={{ fontSize: '1.25rem', color: '#047857' }}>
                      {stay.stayDuration || `${stay.totalDays || 1} Days`}
                    </strong>
                  </div>
                  <span style={{
                    background: isOngoing ? '#16a34a' : '#0f766e',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    {isOngoing ? 'ACTIVE ADMISSION' : 'DISCHARGED'}
                  </span>
                </div>

                {patient.contact && (
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    Contact Phone: <strong style={{ color: '#0f172a' }}>{patient.contact}</strong>
                  </div>
                )}

                {stay.notes && (
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Remarks: <span style={{ color: '#0f172a' }}>{stay.notes}</span>
                  </div>
                )}
              </div>

              {/* Slip Footer */}
              <div style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Vijaya's Health Care Hospital Information System
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const printWindow = window.open('', '_blank', 'width=750,height=850');
                      const admitStr = stay.admitDateTime || stay.admitDate || '--';
                      const dischargeStr = isOngoing ? 'Currently In Ward' : (stay.dischargeDateTime || stay.dischargeDate || '--');
                      const durationStr = stay.stayDuration || `${stay.totalDays || 1} Days`;
                      const bedTitle = stay.bedLabel || `Room ${stay.room || '101'} - ${stay.bedName || 'Bed A'}`;

                      if (!printWindow) {
                        window.print();
                        return;
                      }

                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Ward Stay Certificate - ${patient.name}</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                color: #0f172a;
                                background: #fff;
                                margin: 0;
                                padding: 20px;
                              }
                              .slip-card {
                                border: 2px solid #0f766e;
                                border-radius: 12px;
                                overflow: hidden;
                                max-width: 680px;
                                margin: 0 auto;
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                              }
                              .slip-header {
                                background: linear-gradient(135deg, #0f766e, #0e7490);
                                color: #fff;
                                padding: 20px 24px;
                              }
                              .slip-header h2 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
                              .slip-header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.95; }
                              .slip-body { padding: 24px; }
                              .patient-row {
                                display: flex;
                                justify-content: space-between;
                                border-bottom: 2px solid #e2e8f0;
                                padding-bottom: 16px;
                                margin-bottom: 18px;
                              }
                              .patient-name { font-size: 20px; font-weight: 800; color: #0f172a; }
                              .patient-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
                              .room-title { font-size: 18px; font-weight: 800; color: #0f766e; text-align: right; }
                              .grid-2 {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 16px;
                                background: #f8fafc;
                                padding: 16px;
                                border-radius: 8px;
                                border: 1px solid #e2e8f0;
                                margin-bottom: 18px;
                              }
                              .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                              .val { font-size: 15px; font-weight: 700; color: #0f172a; }
                              .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
                              .duration-box {
                                background: #ecfdf5;
                                border: 1.5px solid #a7f3d0;
                                padding: 16px 20px;
                                border-radius: 8px;
                                margin-bottom: 18px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                              }
                              .duration-val { font-size: 22px; font-weight: 800; color: #047857; }
                              .badge {
                                background: ${isOngoing ? '#16a34a' : '#0f766e'};
                                color: #fff;
                                padding: 6px 14px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 800;
                                text-transform: uppercase;
                              }
                              .slip-footer {
                                background: #f8fafc;
                                border-top: 1px solid #e2e8f0;
                                padding: 14px 24px;
                                font-size: 11px;
                                color: #94a3b8;
                                display: flex;
                                justify-content: space-between;
                              }
                              .sig-row {
                                display: flex;
                                justify-content: space-between;
                                margin-top: 35px;
                                padding-top: 20px;
                                border-top: 1px dashed #cbd5e1;
                              }
                              .sig-box { text-align: center; font-size: 12px; color: #64748b; }
                              .sig-line { width: 140px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px; }
                            </style>
                          </head>
                          <body>
                            <div class="slip-card">
                              <div class="slip-header">
                                <h2>VIJAYA'S HEALTH CARE</h2>
                                <p>Inpatient Ward Admission & Stay Summary Certificate</p>
                              </div>
                              <div class="slip-body">
                                <div class="patient-row">
                                  <div>
                                    <div class="label">Patient Details</div>
                                    <div class="patient-name">${patient.name}</div>
                                    <div class="patient-sub">UHID: #${patient.id} • ${patient.age} Yrs • ${patient.gender}</div>
                                  </div>
                                  <div>
                                    <div class="label" style="text-align: right;">Ward & Room Allocation</div>
                                    <div class="room-title">${bedTitle}</div>
                                    <div class="patient-sub" style="text-align: right;">Bed Identifier: #${stay.bedId}</div>
                                  </div>
                                </div>

                                <div class="grid-2">
                                  <div>
                                    <div class="label">Admission Date & Time</div>
                                    <div class="val">${admitStr}</div>
                                    <div class="sub">Admitted By: ${stay.admittedBy || 'Ward Desk'}</div>
                                  </div>
                                  <div>
                                    <div class="label">Discharge Date & Time</div>
                                    <div class="val" style="color: ${isOngoing ? '#16a34a' : '#0f172a'};">${dischargeStr}</div>
                                    <div class="sub">${isOngoing ? 'Status: Active Inpatient' : 'Discharged By: ' + (stay.dischargedBy || 'Ward Staff')}</div>
                                  </div>
                                </div>

                                <div class="duration-box">
                                  <div>
                                    <div class="label" style="color: #065f46;">Total Stay Duration</div>
                                    <div class="duration-val">${durationStr}</div>
                                  </div>
                                  <div class="badge">${isOngoing ? 'ACTIVE ADMISSION' : 'DISCHARGED'}</div>
                                </div>

                                ${patient.contact ? '<div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">Contact Phone: <strong style="color: #0f172a;">' + patient.contact + '</strong></div>' : ''}
                                ${stay.notes ? '<div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">Remarks: <span style="color: #0f172a;">' + stay.notes + '</span></div>' : ''}

                                <div class="sig-row">
                                  <div class="sig-box">
                                    <div class="sig-line"></div>
                                    Medical Officer / Doctor
                                  </div>
                                  <div class="sig-box">
                                    <div class="sig-line"></div>
                                    Ward Administrator
                                  </div>
                                </div>
                              </div>
                              <div class="slip-footer">
                                <span>Vijaya's Health Care Hospital Information System</span>
                                <span>Printed on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                              </div>
                            </div>
                            <script>
                              window.onload = function() {
                                setTimeout(function() {
                                  window.print();
                                }, 250);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }}
                    style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Printer size={15} /> Print Slip
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveStaySlip(null)}
                    style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminPatientRecords;
