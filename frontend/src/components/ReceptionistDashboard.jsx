import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, UserPlus, Users, DollarSign, Calendar, CheckCircle, Clock, Search, History, Check, X, Trash2, Bed, Baby, Microscope, Sparkles, Sprout, UserX, RotateCcw, FileText, ArrowRight } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
const API_BASE = import.meta.env.VITE_API_URL || '';

import { TN_LOCATIONS } from '../utils/locationHelper';


const getSavedReceptionDraft = () => {
  try {
    const saved = localStorage.getItem('reception_patient_form_draft');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const ReceptionistDashboard = ({
  patients,
  doctors,
  onRegisterPatient,
  onUpdatePaymentStatus,
  onUpdatePatientStatus,
  onReRegisterPatient,
  isAdmin = false,
  onDeletePatient,
  onAdmitToWard
}) => {
  const savedDraft = React.useMemo(() => getSavedReceptionDraft(), []);

  const [name, setName] = useState(savedDraft.name || '');
  const [age, setAge] = useState(savedDraft.age || '');
  const [gender, setGender] = useState(savedDraft.gender || 'Male');
  const [countryCode, setCountryCode] = useState(savedDraft.countryCode || '+91');
  const [contact, setContact] = useState(savedDraft.contact || '');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState(savedDraft.fatherOrHusbandName || '');
  const [motherName, setMotherName] = useState(savedDraft.motherName || '');
  const [guardianName, setGuardianName] = useState(savedDraft.guardianName || '');
  const [altCountryCode, setAltCountryCode] = useState(savedDraft.altCountryCode || '+91');
  const [alternatePhone, setAlternatePhone] = useState(savedDraft.alternatePhone || '');
  const [email, setEmail] = useState(savedDraft.email || '');
  const [dob, setDob] = useState(savedDraft.dob || '');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [returningPatientId, setReturningPatientId] = useState(savedDraft.returningPatientId || null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [alreadyInQueuePatient, setAlreadyInQueuePatient] = useState(null);

  // Helper to compare dates robustly across different string formats
  const isSameDayStr = (d1, d2) => {
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    const parseD = (s) => {
      if (!s) return null;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
      const parts = String(s).trim().split(/[/.-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          const tryD = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
          if (!isNaN(tryD.getTime())) return tryD;
        }
      }
      return null;
    };
    const dateA = parseD(d1);
    const dateB = parseD(d2);
    if (dateA && dateB) {
      return dateA.getFullYear() === dateB.getFullYear() &&
             dateA.getMonth() === dateB.getMonth() &&
             dateA.getDate() === dateB.getDate();
    }
    return false;
  };

  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

  // Helper to check if a patient is already active in today's queue
  const getActiveQueuePatient = (patientIdOrName, phone = '', patientName = '') => {
    const targetName = (patientName || name || '').trim().toLowerCase();
    const targetPhone = String(phone || contact || '').replace(/\D/g, '');
    const targetId = patientIdOrName ? String(patientIdOrName).replace(/#/g, '').trim().toLowerCase() : '';

    if (!targetId && !targetName && !targetPhone) return null;

    return (patients || []).find(p => {
      if (!p || p.status === 'Inactive') return false;

      const isToday = isSameDayStr(p.registrationDate, todayStr);
      const isReviewing = p.status === 'Reviewing' || (p.status || '').toLowerCase() === 'review';
      const isCompleted = p.status === 'Completed';

      const isCurrentlyActiveInQueue = (isToday && !isCompleted) || isReviewing;
      if (!isCurrentlyActiveInQueue) return false;

      const cleanDbId = String(p.id || '').replace(/#/g, '').trim().toLowerCase();
      const cleanDbName = String(p.name || '').trim().toLowerCase();
      const cleanDbPhone = String(p.contact || '').replace(/\D/g, '');

      // 1. Match by Patient ID
      if (targetId && cleanDbId && targetId === cleanDbId) {
        return p;
      }

      // 2. Match by exact 10-digit Phone number
      if (targetPhone.length >= 10 && cleanDbPhone.length >= 10 && targetPhone.slice(-10) === cleanDbPhone.slice(-10)) {
        return p;
      }

      // 3. Match by exact Name (case-insensitive) if active in today's queue
      if (targetName && cleanDbName && targetName === cleanDbName) {
        return p;
      }

      return false;
    });
  };

  // Registration Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Housekeeping Modal & Form States
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [hkLogs, setHkLogs] = useState([]);
  const [hkPlaceName, setHkPlaceName] = useState('');
  const [hkIsCleaned, setHkIsCleaned] = useState(false);
  const [hkIsPlantsWatered, setHkIsPlantsWatered] = useState(false);
  const [hkNotes, setHkNotes] = useState('');
  const [hkLoading, setHkLoading] = useState(false);
  const [hkDeleteTarget, setHkDeleteTarget] = useState(null);

  const fetchHkLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/housekeeping`);
      if (res.ok) setHkLogs(await res.json());
    } catch (err) {
      console.error("Failed to fetch housekeeping logs:", err);
    }
  };

  useEffect(() => {
    if (showHousekeepingModal) {
      fetchHkLogs();
    }
  }, [showHousekeepingModal]);

  const handleAddHkCheck = async (e) => {
    e.preventDefault();
    if (!hkPlaceName.trim()) return;
    setHkLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/housekeeping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: hkPlaceName.trim(),
          date: hkDate,
          isCleaned: hkCleaned ? 1 : 0,
          isPlantsWatered: hkWatered ? 1 : 0,
          notes: hkNotes.trim()
        })
      });
      if (res.ok) {
        setHkPlaceName('');
        setHkNotes('');
        setHkCleaned(false);
        setHkWatered(false);
        fetchHkLogs();
      }
    } catch (err) {
      console.error("Failed to add housekeeping log:", err);
    } finally {
      setHkLoading(false);
    }
  };

  const handleDeleteHkCheck = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/housekeeping/${id}`, { method: 'DELETE' });
      if (res.ok) fetchHkLogs();
    } catch (err) {
      console.error("Failed to delete housekeeping log:", err);
    }
  };

  const nameMatches = (patients && name && name.trim().length >= 2 && showNameSuggestions)
    ? patients.filter(p => p.name && p.name.toLowerCase().includes(name.trim().toLowerCase()))
    : [];

  const handleSelectReturningPatient = (p) => {
    const activeInQueue = getActiveQueuePatient(p.id);
    if (activeInQueue) {
      setAlreadyInQueuePatient(activeInQueue);
      return;
    }

    setReturningPatientId(p.id);
    setName(p.name || '');
    setFatherOrHusbandName(p.fatherOrHusbandName || '');
    
    let mName = '';
    let gName = '';
    if (p.motherOrGuardianName) {
      if (p.motherOrGuardianName.includes(' | Guardian: ')) {
        const parts = p.motherOrGuardianName.split(' | Guardian: ');
        mName = parts[0].replace('Mother: ', '');
        gName = parts[1];
      } else if (p.motherOrGuardianName.startsWith('Mother: ')) {
        mName = p.motherOrGuardianName.replace('Mother: ', '');
      } else if (p.motherOrGuardianName.startsWith('Guardian: ')) {
        gName = p.motherOrGuardianName.replace('Guardian: ', '');
      } else {
        mName = p.motherOrGuardianName;
      }
    }
    setMotherName(mName);
    setGuardianName(gName);

    setDob(p.dob || '');
    setAge(p.age !== undefined && p.age !== null ? String(p.age) : '');
    setGender(p.gender || 'Male');

    if (p.contact) {
      const parts = p.contact.trim().split(' ');
      if (parts.length > 1 && parts[0].startsWith('+')) {
        setCountryCode(parts[0]);
        setContact(parts.slice(1).join('').replace(/\D/g, ''));
      } else {
        setContact(p.contact.replace(/\D/g, ''));
      }
    }

    if (p.alternatePhone) {
      const altParts = p.alternatePhone.trim().split(' ');
      if (altParts.length > 1 && altParts[0].startsWith('+')) {
        setAltCountryCode(altParts[0]);
        setAlternatePhone(altParts.slice(1).join('').replace(/\D/g, ''));
      } else {
        setAlternatePhone(p.alternatePhone.replace(/\D/g, ''));
      }
    } else {
      setAlternatePhone('');
    }

    setEmail(p.email || '');

    if (p.address) {
      const addrParts = p.address.split(' | ');
      setStreet(addrParts[0] || '');
      setCity(addrParts[1] || '');
      setPincode(addrParts[2] || '');
    } else {
      setStreet('');
      setCity('');
      setPincode('');
    }

    if (p.assignedDoctorId) {
      setAssignedDoctorId(String(p.assignedDoctorId));
    }

    // CLEAR ALL VITALS FOR TODAY'S NEW VISIT
    setHeight('');
    setWeight('');
    setBp('');
    setHr('');
    setSpo2('');
    setGrbs('');
    setTemp('');
    setRespiratoryRate('');
    setPainScale('');
    setHeadCircumference('');
    setAvpu('Alert');
    setBmi('');
    setFormSubmitted(false);

    setReceptionistTab(p.isChild ? 'child' : 'new');
  };

  const calculateAgeFromDob = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
    }
    if (ageYears < 1) {
      let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) ageMonths--;
      return ageMonths > 0 ? `${ageMonths} Months` : '0 Yrs';
    }
    return `${ageYears}`;
  };

  const handleContactChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setContact(val);
    }
  };

  const handleAlternatePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setAlternatePhone(val);
    }
  };
  const [street, setStreet] = useState(savedDraft.street || '');
  const [city, setCity] = useState(savedDraft.city || '');
  const [pincode, setPincode] = useState(savedDraft.pincode || '');
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [assignedDoctorId, setAssignedDoctorId] = useState(savedDraft.assignedDoctorId || (doctors[0]?.id || ''));
  const [previewImage, setPreviewImage] = useState(null);

  // Payment Collection Modal States
  const [paymentModalPatient, setPaymentModalPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Paid - Cash'); // 'Paid - Cash', 'Paid - UPI', 'Unpaid'
  const [feeDoctor, setFeeDoctor] = useState(100);
  const [feeDoctorChecked, setFeeDoctorChecked] = useState(true);
  const [feeProcedure, setFeeProcedure] = useState(200);
  const [feeProcedureChecked, setFeeProcedureChecked] = useState(true);
  const [feeLab, setFeeLab] = useState(150);
  const [feeLabChecked, setFeeLabChecked] = useState(true);
  const [feeWard, setFeeWard] = useState(500);
  const [feeWardChecked, setFeeWardChecked] = useState(true);
  const [feeO2, setFeeO2] = useState(100);
  const [feeO2Checked, setFeeO2Checked] = useState(true);
  const [feeGrbs, setFeeGrbs] = useState(50);
  const [feeGrbsChecked, setFeeGrbsChecked] = useState(true);
  const [feeDressing, setFeeDressing] = useState(100);
  const [feeDressingChecked, setFeeDressingChecked] = useState(true);
  const [feeNebuliser, setFeeNebuliser] = useState(100);
  const [feeNebuliserChecked, setFeeNebuliserChecked] = useState(true);
  const [feeEcg, setFeeEcg] = useState(150);
  const [feeEcgChecked, setFeeEcgChecked] = useState(true);
  const [feeNurse, setFeeNurse] = useState(50);
  const [feeNurseChecked, setFeeNurseChecked] = useState(true);
  const [customPaidAmount, setCustomPaidAmount] = useState('');

  const openPaymentModal = (patient) => {
    setPaymentModalPatient(patient);
    setPaymentMethod(patient.paymentStatus && patient.paymentStatus.startsWith('Paid') ? patient.paymentStatus : 'Paid - Cash');

    let breakdown = {
      doctor: { checked: true, amount: 100 },
      procedure: { checked: true, amount: 200 },
      lab: { checked: true, amount: 150 },
      ward: { checked: true, amount: 500 },
      o2: { checked: true, amount: 100 },
      grbs: { checked: true, amount: 50 },
      dressing: { checked: true, amount: 100 },
      nebuliser: { checked: true, amount: 100 },
      ecg: { checked: true, amount: 150 },
      nurse: { checked: true, amount: 50 }
    };

    if (patient.feeBreakdown) {
      try {
        const parsed = JSON.parse(patient.feeBreakdown);
        breakdown = { ...breakdown, ...parsed };
      } catch (e) {
        console.error("Failed to parse fee breakdown", e);
      }
    }

    setFeeDoctorChecked(breakdown.doctor.checked);
    setFeeDoctor(breakdown.doctor.amount);
    setFeeProcedureChecked(breakdown.procedure.checked);
    setFeeProcedure(breakdown.procedure.amount);
    setFeeLabChecked(breakdown.lab.checked);
    setFeeLab(breakdown.lab.amount);
    setFeeWardChecked(breakdown.ward.checked);
    setFeeWard(breakdown.ward.amount);
    setFeeO2Checked(breakdown.o2 ? breakdown.o2.checked : true);
    setFeeO2(breakdown.o2 ? breakdown.o2.amount : 100);
    setFeeGrbsChecked(breakdown.grbs ? breakdown.grbs.checked : true);
    setFeeGrbs(breakdown.grbs ? breakdown.grbs.amount : 50);
    setFeeDressingChecked(breakdown.dressing ? breakdown.dressing.checked : true);
    setFeeDressing(breakdown.dressing ? breakdown.dressing.amount : 100);
    setFeeNebuliserChecked(breakdown.nebuliser ? breakdown.nebuliser.checked : true);
    setFeeNebuliser(breakdown.nebuliser ? breakdown.nebuliser.amount : 100);
    setFeeEcgChecked(breakdown.ecg ? breakdown.ecg.checked : true);
    setFeeEcg(breakdown.ecg ? breakdown.ecg.amount : 150);
    setFeeNurseChecked(breakdown.nurse ? breakdown.nurse.checked : true);
    setFeeNurse(breakdown.nurse ? breakdown.nurse.amount : 50);

    setCustomPaidAmount(patient.paidAmount !== undefined && patient.paidAmount > 0 ? String(patient.paidAmount) : '');
  };

  const calculatedTotal = (feeDoctorChecked ? parseFloat(feeDoctor || 0) : 0) +
    (feeProcedureChecked ? parseFloat(feeProcedure || 0) : 0) +
    (feeLabChecked ? parseFloat(feeLab || 0) : 0) +
    (feeWardChecked ? parseFloat(feeWard || 0) : 0) +
    (feeO2Checked ? parseFloat(feeO2 || 0) : 0) +
    (feeGrbsChecked ? parseFloat(feeGrbs || 0) : 0) +
    (feeDressingChecked ? parseFloat(feeDressing || 0) : 0) +
    (feeNebuliserChecked ? parseFloat(feeNebuliser || 0) : 0) +
    (feeEcgChecked ? parseFloat(feeEcg || 0) : 0) +
    (feeNurseChecked ? parseFloat(feeNurse || 0) : 0);

  // Automatically update the paid amount field when checkboxes change, unless they manually override
  React.useEffect(() => {
    if (paymentModalPatient) {
      setCustomPaidAmount(String(calculatedTotal));
    }
  }, [feeDoctorChecked, feeDoctor, feeProcedureChecked, feeProcedure, feeLabChecked, feeLab, feeWardChecked, feeWard, feeO2Checked, feeO2, feeGrbsChecked, feeGrbs, feeDressingChecked, feeDressing, feeNebuliserChecked, feeNebuliser, feeEcgChecked, feeEcg, feeNurseChecked, feeNurse]);

  const handleConfirmPayment = () => {
    const finalAmount = customPaidAmount !== '' ? parseFloat(customPaidAmount) : calculatedTotal;
    const breakdown = {
      doctor: { checked: feeDoctorChecked, amount: parseFloat(feeDoctor || 0) },
      procedure: { checked: feeProcedureChecked, amount: parseFloat(feeProcedure || 0) },
      lab: { checked: feeLabChecked, amount: parseFloat(feeLab || 0) },
      ward: { checked: feeWardChecked, amount: parseFloat(feeWard || 0) },
      o2: { checked: feeO2Checked, amount: parseFloat(feeO2 || 0) },
      grbs: { checked: feeGrbsChecked, amount: parseFloat(feeGrbs || 0) },
      dressing: { checked: feeDressingChecked, amount: parseFloat(feeDressing || 0) },
      nebuliser: { checked: feeNebuliserChecked, amount: parseFloat(feeNebuliser || 0) },
      ecg: { checked: feeEcgChecked, amount: parseFloat(feeEcg || 0) },
      nurse: { checked: feeNurseChecked, amount: parseFloat(feeNurse || 0) }
    };
    onUpdatePaymentStatus(
      paymentModalPatient.id,
      paymentMethod,
      finalAmount,
      JSON.stringify(breakdown)
    );
    setPaymentModalPatient(null);
  };

  // Vitals States
  const [height, setHeight] = useState(savedDraft.height || '');
  const [weight, setWeight] = useState(savedDraft.weight || '');
  const [bp, setBp] = useState(savedDraft.bp || '');
  const [hr, setHr] = useState(savedDraft.hr || '');
  const [spo2, setSpo2] = useState(savedDraft.spo2 || '');
  const [grbs, setGrbs] = useState(savedDraft.grbs || '');
  const [temp, setTemp] = useState(savedDraft.temp || '');
  const [respiratoryRate, setRespiratoryRate] = useState(savedDraft.respiratoryRate || '');
  const [painScale, setPainScale] = useState(savedDraft.painScale || '');
  const [headCircumference, setHeadCircumference] = useState(savedDraft.headCircumference || '');
  const [avpu, setAvpu] = useState(savedDraft.avpu || 'Alert');
  const [bmi, setBmi] = useState(savedDraft.bmi || '');

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
  const [receptionistTab, setReceptionistTab] = useState(savedDraft.receptionistTab || 'new'); // 'new', 'returning' or 'child'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [reRegisterDoctorId, setReRegisterDoctorId] = useState(doctors[0]?.id || '');
  const [successPatient, setSuccessPatient] = useState(null);

  // Child Register specific states
  const [childGa, setChildGa] = useState(savedDraft.childGa || '');
  const [childBirthDate, setChildBirthDate] = useState(savedDraft.childBirthDate || '');
  const [childBirthWeight, setChildBirthWeight] = useState(savedDraft.childBirthWeight || '');
  const [childPlaceOfBirth, setChildPlaceOfBirth] = useState(savedDraft.childPlaceOfBirth || '');
  const [childDeliveryType, setChildDeliveryType] = useState(savedDraft.childDeliveryType || 'NVD');
  const [childNicuHistory, setChildNicuHistory] = useState(savedDraft.childNicuHistory || 'No');

  // Special Investigation
  const [specialInvestigation, setSpecialInvestigation] = useState(savedDraft.specialInvestigation || false);
  const [specialInvestigationNotes, setSpecialInvestigationNotes] = useState(savedDraft.specialInvestigationNotes || '');

  // Auto-save form draft to localStorage on any changes
  useEffect(() => {
    const hasData = !!(
      name || age || contact || email || fatherOrHusbandName || motherName || guardianName ||
      alternatePhone || dob || street || city || pincode || returningPatientId ||
      height || weight || bp || hr || spo2 || grbs || temp || respiratoryRate ||
      painScale || headCircumference || childGa || childBirthDate || childBirthWeight ||
      childPlaceOfBirth || specialInvestigationNotes || specialInvestigation
    );

    if (hasData) {
      const draft = {
        name,
        age,
        gender,
        countryCode,
        contact,
        email,
        fatherOrHusbandName,
        motherName,
        guardianName,
        altCountryCode,
        alternatePhone,
        dob,
        returningPatientId,
        street,
        city,
        pincode,
        assignedDoctorId,
        receptionistTab,
        height,
        weight,
        bp,
        hr,
        spo2,
        grbs,
        temp,
        respiratoryRate,
        painScale,
        headCircumference,
        avpu,
        bmi,
        childGa,
        childBirthDate,
        childBirthWeight,
        childPlaceOfBirth,
        childDeliveryType,
        childNicuHistory,
        specialInvestigation,
        specialInvestigationNotes
      };
      try {
        localStorage.setItem('reception_patient_form_draft', JSON.stringify(draft));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem('reception_patient_form_draft');
      } catch (e) {}
    }
  }, [
    name, age, gender, countryCode, contact, email, fatherOrHusbandName, motherName, guardianName,
    altCountryCode, alternatePhone, dob, returningPatientId, street, city, pincode,
    assignedDoctorId, receptionistTab, height, weight, bp, hr, spo2, grbs, temp,
    respiratoryRate, painScale, headCircumference, avpu, bmi, childGa, childBirthDate,
    childBirthWeight, childPlaceOfBirth, childDeliveryType, childNicuHistory,
    specialInvestigation, specialInvestigationNotes
  ]);

  const clearFormDraft = () => {
    try {
      localStorage.removeItem('reception_patient_form_draft');
    } catch (e) {}
  };

  // Vitals validation helpers (All optional)
  const isValidWeight = (val) => !val || !val.trim() || /^\d+(\.\d+)?$/.test(val.trim());
  const isValidBp = (val) => !val || !val.trim() || /^\d{2,3}(\/\d{2,3})?$/.test(val.trim());
  const isValidHr = (val) => !val || !val.trim() || /^\d{2,3}$/.test(val.trim());
  const isValidTemp = (val) => !val || !val.trim() || /^\d{2,3}(\.\d+)?$/.test(val.trim());
  const isValidHeight = (val) => !val || !val.trim() || /^\d+(\.\d+)?$/.test(val.trim());
  const isValidSpo2 = (val) => !val || !val.trim() || /^\d{1,3}$/.test(val.trim());
  const isValidGrbs = (val) => !val || !val.trim() || /^\d{1,4}(\.\d+)?$/.test(val.trim());
  const isValidRr = (val) => !val || !val.trim() || /^\d{1,3}$/.test(val.trim());
  const isValidHeadCirc = (val) => !val || !val.trim() || /^\d{1,3}(\.\d+)?$/.test(val.trim());

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormSubmitted(true);

    if (!name.trim()) {
      alert("Please enter Patient Full Name.");
      const nameInput = document.querySelector('input[placeholder*="patient full name"]');
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
      return;
    }

    if (receptionistTab !== 'child' && (!age || isNaN(parseInt(age)))) {
      alert("Please enter Patient Age or Date of Birth.");
      const ageInput = document.querySelector('input[placeholder="Age"]');
      if (ageInput) {
        ageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ageInput.focus();
      }
      return;
    }

    if (contact && contact.replace(/\D/g, '').length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      const phoneInput = document.querySelector('input[placeholder="10-digit number"]');
      if (phoneInput) {
        phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInput.focus();
      }
      return;
    }

    if (alternatePhone) {
      const cleanAlt = alternatePhone.replace(/\D/g, '');
      if (cleanAlt.length !== 10) {
        alert("Alternate Phone Number must be exactly 10 digits.");
        return;
      }
    }

    if (!assignedDoctorId) {
      alert("Please select an Available Doctor to queue the patient.");
      const docSelect = document.querySelector('select[value="' + assignedDoctorId + '"]');
      if (docSelect) docSelect.focus();
      return;
    }

    const cleanContact = contact ? contact.replace(/\D/g, '') : '';
    const fullContact = cleanContact ? `${countryCode} ${cleanContact}` : '';
    const fullAltPhone = alternatePhone ? `${altCountryCode} ${alternatePhone.replace(/\D/g, '')}` : '';

    let calculatedAge = parseInt(age);
    if (isNaN(calculatedAge)) {
      if (childBirthDate) {
        const diffMs = Date.now() - new Date(childBirthDate).getTime();
        const ageDate = new Date(diffMs);
        calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      } else {
        calculatedAge = 0;
      }
    }

    let motherOrGuardianValue = '';
    if (motherName.trim() && guardianName.trim()) {
      motherOrGuardianValue = `Mother: ${motherName.trim()} | Guardian: ${guardianName.trim()}`;
    } else if (motherName.trim()) {
      motherOrGuardianValue = `Mother: ${motherName.trim()}`;
    } else if (guardianName.trim()) {
      motherOrGuardianValue = `Guardian: ${guardianName.trim()}`;
    }

    const patientPayload = {
      name,
      age: calculatedAge,
      gender,
      contact: fullContact,
      email: email.trim().toLowerCase(),
      fatherOrHusbandName,
      motherOrGuardianName: motherOrGuardianValue,
      alternatePhone: fullAltPhone,
      address: [street.trim(), city.trim(), pincode.trim()].filter(Boolean).join(' | '),
      assignedDoctorId: parseInt(assignedDoctorId),
      dob,
      height,
      weight,
      bp,
      hr,
      spo2,
      grbs,
      temp,
      respiratoryRate,
      painScale,
      headCircumference,
      avpu,
      bmi,
      isChild: receptionistTab === 'child' ? 1 : 0,
      childGa: receptionistTab === 'child' ? childGa : '',
      childBirthDate: receptionistTab === 'child' ? childBirthDate : '',
      childBirthWeight: receptionistTab === 'child' ? childBirthWeight : '',
      childPlaceOfBirth: receptionistTab === 'child' ? childPlaceOfBirth : '',
      childDeliveryType: receptionistTab === 'child' ? childDeliveryType : '',
      childNicuHistory: receptionistTab === 'child' ? childNicuHistory : '',
      specialInvestigation: specialInvestigation ? 1 : 0,
      specialInvestigationNotes: specialInvestigation ? specialInvestigationNotes : ''
    };

    let registered;
    setIsSubmitting(true);
    try {
      if (returningPatientId) {
        const activeInQueue = getActiveQueuePatient(returningPatientId, fullContact, name);
        if (activeInQueue) {
          setAlreadyInQueuePatient(activeInQueue);
          setIsSubmitting(false);
          return;
        }
        registered = await onReRegisterPatient(returningPatientId, parseInt(assignedDoctorId), patientPayload);
      } else {
        const activeInQueue = getActiveQueuePatient(null, fullContact, name);
        if (activeInQueue) {
          setAlreadyInQueuePatient(activeInQueue);
          setIsSubmitting(false);
          return;
        }
        registered = await onRegisterPatient(patientPayload);
      }

      if (registered) {
        clearFormDraft();
        setSuccessPatient(registered);
        setFormSubmitted(false);
        setReturningPatientId(null);
        // Reset Form
        setName('');
        setAge('');
        setGender('Male');
        setContact('');
        setEmail('');
        setCountryCode('+91');
        setFatherOrHusbandName('');
        setMotherName('');
        setGuardianName('');
      setAlternatePhone('');
      setAltCountryCode('+91');
      setStreet('');
      setCity('');
      setPincode('');
      setHeight('');
      setWeight('');
      setBp('');
      setHr('');
      setSpo2('');
      setGrbs('');
      setTemp('');
      setRespiratoryRate('');
      setPainScale('');
      setHeadCircumference('');
      setAvpu('Alert');
      setDob('');
      setBmi('');
      // Child Fields Reset
      setChildGa('');
      setChildBirthDate('');
      setChildBirthWeight('');
      setChildPlaceOfBirth('');
      setChildDeliveryType('NVD');
      setChildNicuHistory('No');
        setSpecialInvestigation(false);
        setSpecialInvestigationNotes('');
      } else {
        alert("Patient registration could not be completed. Please check server connection.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Error registering patient: " + (err.message || 'Please check your connection and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReRegisterClick = async (patientId) => {
    const activeInQueue = getActiveQueuePatient(patientId);
    if (activeInQueue) {
      setAlreadyInQueuePatient(activeInQueue);
      return;
    }
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

  const [liveDoctors, setLiveDoctors] = useState(doctors || []);

  useEffect(() => {
    setLiveDoctors(doctors || []);
  }, [doctors]);

  useEffect(() => {
    const fetchLatestDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/doctors`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setLiveDoctors(data);
        }
      } catch (e) {}
    };

    fetchLatestDoctors();
    window.addEventListener('focus', fetchLatestDoctors);
    return () => window.removeEventListener('focus', fetchLatestDoctors);
  }, []);

  // Filter active doctors who have logged in today with user ID & password
  const availableDoctors = (liveDoctors || []).filter(doc => isSameDayStr(doc.lastLoginDate, todayStr));

  useEffect(() => {
    if (availableDoctors.length > 0) {
      if (!assignedDoctorId || !availableDoctors.some(d => String(d.id) === String(assignedDoctorId))) {
        setAssignedDoctorId(String(availableDoctors[0].id));
      }
      if (!reRegisterDoctorId || !availableDoctors.some(d => String(d.id) === String(reRegisterDoctorId))) {
        setReRegisterDoctorId(String(availableDoctors[0].id));
      }
    } else {
      setAssignedDoctorId('');
      setReRegisterDoctorId('');
    }
  }, [availableDoctors, assignedDoctorId, reRegisterDoctorId]);

  const todayPatients = patients.filter(p => {
    if (!p || p.status === 'Inactive') return false;
    const isToday = isSameDayStr(p.registrationDate, todayStr);
    const isReviewing = p.status === 'Reviewing' || (p.status || '').toLowerCase() === 'review';
    return isToday || isReviewing;
  });

  // Stats for Today & Active Reviews
  const totalPatients = todayPatients.length;
  const activeQueue = todayPatients.filter(p => ['Registered', 'In Queue', 'Consulting', 'At Pharmacy', 'Reviewing'].includes(p.status) || (p.status || '').toLowerCase() === 'review').length;
  const skippedPatientsCount = todayPatients.filter(p => p.status === 'Skipped').length;
  const completedConsultations = todayPatients.filter(p => p.status === 'Completed' && (!p.paymentStatus || !p.paymentStatus.startsWith('Paid'))).length;
  const paidConsultations = todayPatients.filter(p => p.paymentStatus && p.paymentStatus.startsWith('Paid')).length;

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

        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
            <UserX size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#d97706' }}>{skippedPatientsCount}</div>
            <div className="stat-label">Skipped Patients</div>
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
          <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`btn ${receptionistTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              onClick={() => setReceptionistTab('new')}
            >
              <UserPlus size={15} /> New Patient
            </button>
            <button
              type="button"
              className={`btn ${receptionistTab === 'child' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              onClick={() => setReceptionistTab('child')}
            >
              <Baby size={15} /> Child Register
            </button>
            <button
              type="button"
              className={`btn ${receptionistTab === 'returning' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              onClick={() => setReceptionistTab('returning')}
            >
              <Search size={15} /> Returning Patient
            </button>
          </div>

          {receptionistTab === 'new' || receptionistTab === 'child' ? (
            <>
              {returningPatientId && (
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', 
                  borderRadius: '8px', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                    🔄 Re-Registering Returning Patient: #{returningPatientId} - {name}
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Demographics pre-filled. Please record today's new vitals and assign a doctor below.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      clearFormDraft();
                      setReturningPatientId(null);
                      setName('');
                      setAge('');
                      setContact('');
                      setEmail('');
                      setFatherOrHusbandName('');
                      setMotherName('');
                      setGuardianName('');
                      setAlternatePhone('');
                      setStreet('');
                      setCity('');
                      setPincode('');
                      setDob('');
                      setHeight('');
                      setWeight('');
                      setBp('');
                      setHr('');
                      setSpo2('');
                      setGrbs('');
                      setTemp('');
                      setRespiratoryRate('');
                      setPainScale('');
                      setHeadCircumference('');
                      setAvpu('Alert');
                      setBmi('');
                      setChildGa('');
                      setChildBirthDate('');
                      setChildBirthWeight('');
                      setChildPlaceOfBirth('');
                      setChildDeliveryType('NVD');
                      setChildNicuHistory('No');
                      setSpecialInvestigation(false);
                      setSpecialInvestigationNotes('');
                      setFormSubmitted(false);
                    }}
                  >
                    Cancel & Clear Form
                  </button>
                </div>
              )}

              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                {returningPatientId ? (
                  <>
                    <History size={20} style={{ color: 'var(--primary)' }} />
                    Re-Register Returning Patient (#{returningPatientId})
                  </>
                ) : receptionistTab === 'child' ? (
                  <>
                    <Baby size={20} style={{ color: 'var(--primary)' }} />
                    Pediatric Child Registration
                  </>
                ) : (
                  <>
                    <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                    New Patient Registration
                  </>
                )}
              </h3>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={formSubmitted && !name.trim() ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                    placeholder="Enter patient full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowNameSuggestions(true);
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    required
                  />
                  {formSubmitted && !name.trim() && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      Please fill out this field
                    </span>
                  )}
                  {nameMatches.length > 0 && (
                    <div className="auto-suggestions-dropdown" style={{
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      border: '1.5px solid var(--primary)',
                      zIndex: 99999,
                      maxHeight: '260px',
                      padding: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.6rem',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)'
                      }}>
                        <span>💡 Existing Patient(s) Found in Database ({nameMatches.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowNameSuggestions(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          ✕ Close
                        </button>
                      </div>

                      {nameMatches.map((p) => (
                        <div
                          key={p.id}
                          className="suggestion-item"
                          onClick={() => {
                            handleSelectReturningPatient(p);
                            setShowNameSuggestions(false);
                          }}
                          style={{
                            borderRadius: '6px',
                            marginTop: '0.25rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {p.name} <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>(#{p.id})</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {p.age} Yrs • {p.gender} • Phone: {p.contact || 'N/A'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'var(--primary)', pointerEvents: 'none' }}
                          >
                            Select Patient
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="reg-dob-age-gender-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Date of Birth (DOB)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dob}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDob(val);
                        setChildBirthDate(val);
                        if (val) {
                          const birthDate = new Date(val);
                          const today = new Date();
                          if (!isNaN(birthDate.getTime())) {
                            let years = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              years--;
                            }
                            const finalYears = years < 0 ? 0 : years;
                            setAge(String(finalYears));
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Age {dob ? '(Auto)' : ''}</label>
                    <input
                      type="number"
                      className="form-input"
                      style={formSubmitted && receptionistTab !== 'child' && !age ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                    {formSubmitted && receptionistTab !== 'child' && !age && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                        Please fill out this field
                      </span>
                    )}
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

                <div className="reg-contact-alt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-input"
                        style={{ width: '80px', flexShrink: 0, fontWeight: 600, fontSize: '0.85rem', padding: '0.4rem 0.25rem' }}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+94">🇱🇰 +94</option>
                      </select>
                      <input
                        type="tel"
                        className="form-input"
                        style={formSubmitted && contact.replace(/\D/g, '').length !== 10 ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="10-digit number"
                        value={contact}
                        onChange={handleContactChange}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                    {contact && contact.length > 0 && contact.length < 10 && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                        Must be exactly 10 digits ({contact.length}/10)
                      </span>
                    )}
                    {formSubmitted && contact.length === 0 && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                        Please fill out this field
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alternate Phone Number (Optional)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-input"
                        style={{ width: '80px', flexShrink: 0, fontWeight: 600, fontSize: '0.85rem', padding: '0.4rem 0.25rem' }}
                        value={altCountryCode}
                        onChange={(e) => setAltCountryCode(e.target.value)}
                      >
                        <option value="+91"> +91</option>

                      </select>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="10-digit number"
                        value={alternatePhone}
                        onChange={handleAlternatePhoneChange}
                        maxLength={10}
                      />
                    </div>
                    {alternatePhone && alternatePhone.length > 0 && alternatePhone.length < 10 && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                        Must be 10 digits if provided ({alternatePhone.length}/10)
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem' }}>
                  <label className="form-label">Email ID (Optional - For sending digital prescriptions)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. patient@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Address Fields with Location Auto-suggest */}
                <div style={{ margin: '0.25rem 0 0' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Address</label>
                  <div className="reg-address-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                    {/* Street / Area Field with Suggestions */}
                    <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Street / Area (e.g. Kollidam)"
                        value={street}
                        onChange={(e) => {
                          setStreet(e.target.value);
                          setShowStreetSuggestions(true);
                        }}
                        onFocus={() => setShowStreetSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowStreetSuggestions(false), 200)}
                      />
                      {showStreetSuggestions && street.trim().length > 0 && (
                        <div className="auto-suggestions-dropdown">
                          {TN_LOCATIONS.filter(loc =>
                            loc.area.toLowerCase().includes(street.toLowerCase()) ||
                            loc.city.toLowerCase().includes(street.toLowerCase()) ||
                            loc.pincode.includes(street.trim())
                          ).slice(0, 10).map((loc, idx) => (
                            <div
                              key={idx}
                              className="suggestion-item"
                              onMouseDown={() => {
                                setStreet(loc.area);
                                setCity(loc.city);
                                setPincode(loc.pincode);
                                setShowStreetSuggestions(false);
                              }}
                            >
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className="suggestion-item-text">📍 {loc.area}</span>
                                <span className="suggestion-item-sub">({loc.city})</span>
                              </div>
                              <span className="suggestion-item-pincode">{loc.pincode}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* City / Town Field with Suggestions */}
                    <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City / Town"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                      />
                      {showCitySuggestions && city.trim().length > 0 && (
                        <div className="auto-suggestions-dropdown">
                          {TN_LOCATIONS.filter(loc =>
                            loc.city.toLowerCase().includes(city.toLowerCase()) ||
                            loc.area.toLowerCase().includes(city.toLowerCase())
                          ).slice(0, 10).map((loc, idx) => (
                            <div
                              key={idx}
                              className="suggestion-item"
                              onMouseDown={() => {
                                setCity(loc.city);
                                if (!street) setStreet(loc.area);
                                setPincode(loc.pincode);
                                setShowCitySuggestions(false);
                              }}
                            >
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className="suggestion-item-text">🏙️ {loc.city}</span>
                                <span className="suggestion-item-sub">({loc.area})</span>
                              </div>
                              <span className="suggestion-item-pincode">{loc.pincode}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pincode Field */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pediatric Details Section (only visible when Child Register tab is active) */}
                {receptionistTab === 'child' && (
                  <div style={{ margin: '1.25rem 0', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Baby size={16} /> Child Birth Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">GA (Gestational Age)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 38 - 40 weeks (Full Term)"
                          value={childGa}
                          onChange={(e) => setChildGa(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Birth Weight</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 3.2 kg"
                          value={childBirthWeight}
                          onChange={(e) => setChildBirthWeight(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Place of Birth</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Hospital name / Home"
                          value={childPlaceOfBirth}
                          onChange={(e) => setChildPlaceOfBirth(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delivery Type</label>
                        <select
                          className="form-input"
                          value={childDeliveryType}
                          onChange={(e) => setChildDeliveryType(e.target.value)}
                        >
                          <option value="NVD">Normal Vaginal Delivery (NVD)</option>
                          <option value="LSCS">Lower Segment Cesarean Section (LSCS)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">History of NICU Admission</label>
                        <select
                          className="form-input"
                          value={childNicuHistory}
                          onChange={(e) => setChildNicuHistory(e.target.value)}
                        >
                          <option value="No">No (Healthy Birth)</option>
                          <option value="Yes">Yes (Admitted to NICU)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Patient Vitals / Triage (Optional)
                    </h4>
                  </div>

                  <div className="reg-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Height (Ht in cm)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidHeight(height) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="Height (e.g. 170)"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                      {formSubmitted && !isValidHeight(height) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (Wt in kg)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidWeight(weight) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="Weight (e.g. 65)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      {formSubmitted && weight.trim() && !isValidWeight(weight) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct value
                        </span>
                      )}
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

                  <div className="reg-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Blood Pressure (BP)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidBp(bp) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="e.g. 120/80"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                      />
                      {formSubmitted && bp.trim() && !isValidBp(bp) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Heart Rate / Pulse (HR)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidHr(hr) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="Pulse (e.g. 72)"
                        value={hr}
                        onChange={(e) => setHr(e.target.value)}
                      />
                      {formSubmitted && hr.trim() && !isValidHr(hr) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">TEMP (°F)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidTemp(temp) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="Temp (e.g. 98.4)"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                      />
                      {formSubmitted && temp.trim() && !isValidTemp(temp) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="reg-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">SPO2 (%)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidSpo2(spo2) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="SPO2 (e.g. 98)"
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value)}
                      />
                      {formSubmitted && !isValidSpo2(spo2) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">GRBS (Blood Sugar)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidGrbs(grbs) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="GRBS (e.g. 110)"
                        value={grbs}
                        onChange={(e) => setGrbs(e.target.value)}
                      />
                      {formSubmitted && !isValidGrbs(grbs) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Respiratory Rate (RR)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidRr(respiratoryRate) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="RR (e.g. 18 breaths/min)"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(e.target.value)}
                      />
                      {formSubmitted && !isValidRr(respiratoryRate) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="reg-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Pain Scale (0-10)</label>
                      <select
                        className="form-input"
                        value={painScale}
                        onChange={(e) => setPainScale(e.target.value)}
                      >
                        <option value="">Select Pain Level</option>
                        <option value="0">0 - No Pain</option>
                        <option value="2">2 - Mild Pain</option>
                        <option value="4">4 - Moderate Pain</option>
                        <option value="6">6 - Severe Pain</option>
                        <option value="8">8 - Very Severe Pain</option>
                        <option value="10">10 - Worst Pain Possible</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Head Circumference (cm)</label>
                      <input
                        type="text"
                        className="form-input"
                        style={formSubmitted && !isValidHeadCirc(headCircumference) ? { borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.04)' } : {}}
                        placeholder="Head Cir. (e.g. 42 cm)"
                        value={headCircumference}
                        onChange={(e) => setHeadCircumference(e.target.value)}
                      />
                      {formSubmitted && !isValidHeadCirc(headCircumference) && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          Please fill correct answer
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Consciousness (AVPU)</label>
                      <select
                        className="form-input"
                        value={avpu}
                        onChange={(e) => setAvpu(e.target.value)}
                      >
                        <option value="Alert">Alert (A)</option>
                        <option value="Voice">Responds to Voice (V)</option>
                        <option value="Pain">Responds to Pain (P)</option>
                        <option value="Unresponsive">Unresponsive (U)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special Investigation Toggle */}
                <div className={`special-investigation-box ${specialInvestigation ? 'active' : ''}`} style={{
                  margin: '0 0 1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: specialInvestigation ? '1.5px solid rgba(234, 88, 12, 0.5)' : '1.5px solid var(--border)',
                  background: specialInvestigation ? 'rgba(234, 88, 12, 0.06)' : 'var(--bg-dark)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="special-investigation-title" style={{ fontWeight: 700, fontSize: '0.9rem', color: specialInvestigation ? '#ea580c' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="special-investigation-icon" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: specialInvestigation ? 'rgba(234, 88, 12, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                          color: specialInvestigation ? '#ea580c' : 'var(--text-secondary)',
                          borderRadius: '6px',
                          padding: '0.3rem',
                          marginRight: '2px',
                          border: specialInvestigation ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid var(--border)',
                          transition: 'all 0.2s ease'
                        }}>
                          <Microscope size={15} strokeWidth={2.5} />
                        </span>
                        Special Investigation Required
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Flag this patient for special attention / investigation</div>
                    </div>
                    <button
                      type="button"
                      className="special-investigation-toggle"
                      onClick={() => setSpecialInvestigation(!specialInvestigation)}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        background: specialInvestigation ? '#ea580c' : 'rgba(150,150,150,0.3)',
                        position: 'relative',
                        transition: 'background 0.25s ease',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: specialInvestigation ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.25s ease',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                  {specialInvestigation && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Brief reason / notes for special investigation (optional)"
                        value={specialInvestigationNotes}
                        onChange={(e) => setSpecialInvestigationNotes(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Assign Available Doctor</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: availableDoctors.length > 0 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)' }}>
                      {availableDoctors.length > 0 ? `🟢 ${availableDoctors.length} Logged In Today` : `⚠️ No Doctor Logged In Today`}
                    </span>
                  </label>
                  <select
                    className="form-input"
                    value={assignedDoctorId}
                    onChange={(e) => setAssignedDoctorId(e.target.value)}
                    required
                  >
                    {availableDoctors.length === 0 ? (
                      <option value="" disabled>⚠️ No doctors have logged in today</option>
                    ) : (
                      <>
                        <option value="" disabled>Select Doctor</option>
                        {availableDoctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting} 
                  style={{ width: '100%', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Registering & Queuing Patient...' : 'Register & Queue Patient'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                <Search size={20} style={{ color: 'var(--primary)' }} />
                Re-queue Returning Patient
              </h3>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Search Patient Profile</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem', fontSize: '0.92rem' }}
                    placeholder="Search by Patient Name, Mobile Number or ID (e.g. VH001)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {searchQuery.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredPatients.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', borderRadius: '10px', border: '1px dashed var(--border)', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No matching patient record found for "<strong>{searchQuery}</strong>".</p>
                    </div>
                  ) : (
                    filteredPatients.map(p => (
                      <div 
                        key={p.id} 
                        style={{ 
                          border: '1px solid var(--border)', 
                          padding: '1.15rem', 
                          borderRadius: '12px', 
                          background: 'var(--bg-card, #111c30)',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {/* Header: Patient Name + Avatar + ID Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                              flexShrink: 0
                            }}>
                              {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                Last Visit: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.registrationDate || 'Previous Visit'}</span>
                              </div>
                            </div>
                          </div>

                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            background: 'rgba(56, 189, 248, 0.12)', 
                            color: 'var(--primary)', 
                            padding: '0.3rem 0.65rem', 
                            borderRadius: '20px',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            letterSpacing: '0.02em',
                            flexShrink: 0
                          }}>
                            ID: #{p.id}
                          </span>
                        </div>

                        {/* Demographic Info Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', color: 'var(--text-primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border)' }}>
                            {p.age} Yrs
                          </span>
                          <span style={{ fontSize: '0.78rem', background: 'var(--bg-dark, rgba(0,0,0,0.2))', color: 'var(--text-primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border)' }}>
                            {p.gender}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600, border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                            📞 {p.contact}
                          </span>
                        </div>

                        {/* Family Details if present */}
                        {(p.fatherOrHusbandName || p.motherOrGuardianName || p.alternatePhone) && (
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-secondary)', 
                            background: 'var(--bg-dark, rgba(0,0,0,0.2))', 
                            padding: '0.5rem 0.75rem', 
                            borderRadius: '6px', 
                            marginBottom: '1rem',
                            lineHeight: '1.4',
                            border: '1px solid var(--border)'
                          }}>
                            {p.fatherOrHusbandName && <div><strong style={{ color: 'var(--text-primary)' }}>Father/Husband:</strong> {p.fatherOrHusbandName}</div>}
                            {p.motherOrGuardianName && (
                              <div>
                                {p.motherOrGuardianName.includes(' | Guardian: ') ? (
                                  <>
                                    <div><strong style={{ color: 'var(--text-primary)' }}>Mother:</strong> {p.motherOrGuardianName.split(' | Guardian: ')[0].replace('Mother: ', '')}</div>
                                    <div><strong style={{ color: 'var(--text-primary)' }}>Guardian:</strong> {p.motherOrGuardianName.split(' | Guardian: ')[1]}</div>
                                  </>
                                ) : p.motherOrGuardianName.startsWith('Mother: ') ? (
                                  <div><strong style={{ color: 'var(--text-primary)' }}>Mother:</strong> {p.motherOrGuardianName.replace('Mother: ', '')}</div>
                                ) : p.motherOrGuardianName.startsWith('Guardian: ') ? (
                                  <div><strong style={{ color: 'var(--text-primary)' }}>Guardian:</strong> {p.motherOrGuardianName.replace('Guardian: ', '')}</div>
                                ) : (
                                  <div><strong style={{ color: 'var(--text-primary)' }}>Mother/Guardian:</strong> {p.motherOrGuardianName}</div>
                                )}
                              </div>
                            )}
                            {p.alternatePhone && <div><strong style={{ color: 'var(--text-primary)' }}>Alt Phone:</strong> {p.alternatePhone}</div>}
                          </div>
                        )}

                        {/* Action Buttons Side-by-Side */}
                        <div style={{ display: 'grid', gridTemplateColumns: ((p.history && p.history.length > 0) || p.diagnosis) ? '1fr 1fr' : '1fr', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                          {((p.history && p.history.length > 0) || p.diagnosis) && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                              onClick={() => {
                                if (p.history && p.history.length > 0) {
                                  setSelectedPatientForHistory(p);
                                } else {
                                  const currentVisitMock = {
                                    name: p.name,
                                    age: p.age,
                                    gender: p.gender,
                                    contact: p.contact,
                                    date: p.registrationDate || 'Current Visit',
                                    diagnosis: p.diagnosis,
                                    prescription: p.prescription,
                                    prescriptionImg: p.prescriptionImg || null,
                                    doctorName: p.assignedDoctorName || 'Dr. Vijayan'
                                  };
                                  setViewingPrescription(currentVisitMock);
                                }
                              }}
                            >
                              <FileText size={14} /> History
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                            onClick={() => handleSelectExistingPatient(p)}
                          >
                            <ArrowRight size={14} /> Re-admit
                          </button>
                        </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              Patients List & Payment Collection
            </h3>

            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.04)', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                type="button"
                className={`btn ${tableFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setTableFilter('all')}
              >
                All ({todayPatients.length})
              </button>
              <button
                type="button"
                className={`btn ${tableFilter === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setTableFilter('queue')}
              >
                In Queue ({todayPatients.filter(p => ['Registered', 'In Queue', 'Reviewing'].includes(p.status) || (p.status || '').toLowerCase() === 'review').length})
              </button>
              <button
                type="button"
                className={`btn ${tableFilter === 'skipped' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: tableFilter === 'skipped' ? '#d97706' : '',
                  color: tableFilter === 'skipped' ? '#fff' : '',
                  borderColor: tableFilter === 'skipped' ? '#d97706' : ''
                }}
                onClick={() => setTableFilter('skipped')}
              >
                Skipped ({skippedPatientsCount})
              </button>
            </div>
          </div>

          {todayPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No patients registered today.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Details</th>
                    <th style={{ textAlign: 'center' }}>Token</th>
                    <th>Assigned Doctor</th>
                    <th>Queue Status</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'center' }}>Ward Bed</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPatients
                    .filter(p => {
                      if (tableFilter === 'queue') return ['Registered', 'In Queue', 'Reviewing'].includes(p.status) || (p.status || '').toLowerCase() === 'review';
                      if (tableFilter === 'skipped') return p.status === 'Skipped';
                      return true;
                    })
                    .slice().reverse().map(patient => {
                    const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId);
                    return (
                      <tr key={patient.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          #{patient.id}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600 }}>{patient.name}</span>
                            {!isSameDayStr(patient.registrationDate, todayStr) && (
                              <span style={{
                                fontSize: '0.7rem',
                                background: 'rgba(139, 92, 246, 0.12)',
                                color: '#7c3aed',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                📅 {patient.registrationDate || 'Yesterday'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '0.15rem' }}>
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
                            {patient.email && <div style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>✉️ {patient.email}</div>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="token-badge-cell" style={{
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
                          {(() => {
                            const s = (patient.status || '').toLowerCase().trim();
                            if (s === 'skipped') {
                              return (
                                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  ⏸ Skipped
                                </span>
                              );
                            }

                            let badgeClass = 'badge-pending';
                            let badgeText = patient.status === 'Registered' ? 'In Queue' : patient.status;

                            if (s === 'registered' || s === 'inactive' || s === 'in queue' || !patient.status) {
                              badgeClass = 'badge-pending';
                              badgeText = 'In Queue';
                            } else if (s === 'consulting') {
                              badgeClass = 'badge-consulting';
                              badgeText = 'Consulting';
                            } else if (s === 'at pharmacy' || s === 'pharmacy') {
                              badgeClass = 'badge-pharmacy';
                              badgeText = 'At Pharmacy';
                            } else if (s === 'reviewing' || s === 'review') {
                              badgeClass = 'badge-reviewing';
                              badgeText = 'Review';
                            } else if (s === 'completed' || s === 'paid') {
                              badgeClass = 'badge-completed';
                              badgeText = 'Completed';
                            } else if (s === 'admitted') {
                              badgeClass = 'badge-admitted';
                              badgeText = 'Admitted';
                            }

                            return (
                              <span className={`badge ${badgeClass}`}>
                                {badgeText}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                              className={`payment-status-badge ${(patient.paymentStatus && patient.paymentStatus.startsWith('Paid')) ? 'paid' : 'unpaid'}`}
                              style={{
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.85rem',
                                borderRadius: '4px',
                                width: 'fit-content',
                                background: (patient.paymentStatus && patient.paymentStatus.startsWith('Paid')) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: (patient.paymentStatus && patient.paymentStatus.startsWith('Paid')) ? 'var(--success)' : 'var(--danger)',
                                border: '1px solid ' + ((patient.paymentStatus && patient.paymentStatus.startsWith('Paid')) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'),
                                fontWeight: 700,
                                textAlign: 'center'
                              }}
                              onClick={() => openPaymentModal(patient)}
                              title="Click to Collect Payment / Enter Fees Checklist"
                            >
                              {patient.paymentStatus || 'Unpaid'}
                            </span>
                            {(patient.paidAmount !== undefined && patient.paidAmount > 0) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                                Amount: ₹{patient.paidAmount}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Ward Bed Column */}
                        <td style={{ textAlign: 'center' }}>
                          {onAdmitToWard && !patient.wardBedId && patient.status !== 'Completed' ? (
                            <button
                              className="btn-logout"
                              onClick={() => onAdmitToWard(patient)}
                              title="Admit to Ward Room"
                              style={{
                                cursor: 'pointer',
                                color: '#0f766e',
                                background: 'rgba(15,118,110,0.1)',
                                borderRadius: '6px',
                                padding: '0.3rem 0.55rem',
                                border: '1px solid rgba(15,118,110,0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            >
                              <Bed size={15} /> Ward
                            </button>
                          ) : patient.wardBedId ? (
                            <span style={{
                              fontSize: '0.78rem',
                              color: patient.bedAdmissionPending ? 'var(--warning)' : '#0f766e',
                              fontWeight: 700,
                              background: patient.bedAdmissionPending ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15, 118, 110, 0.1)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              border: '1px solid ' + (patient.bedAdmissionPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(15, 118, 110, 0.3)'),
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              🛏️ {patient.wardBedId} {patient.bedAdmissionPending ? '(Pending)' : ''}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>--</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                            {onUpdatePatientStatus && (patient.status === 'Registered' || patient.status === 'In Queue' || !patient.status) && (
                              <button
                                className="btn-logout"
                                onClick={() => {
                                  onUpdatePatientStatus(patient.id, 'Skipped');
                                }}
                                title="Skip Patient (Patient is temporary absent)"
                                style={{
                                  cursor: 'pointer',
                                  color: '#d97706',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.55rem',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontWeight: 700,
                                  fontSize: '0.78rem'
                                }}
                              >
                                <UserX size={14} /> Skip
                              </button>
                            )}

                            {onUpdatePatientStatus && patient.status === 'Skipped' && (
                              <button
                                className="btn-logout"
                                onClick={() => {
                                  onUpdatePatientStatus(patient.id, 'In Queue');
                                }}
                                title="Unskip Patient (Restore to queue)"
                                style={{
                                  cursor: 'pointer',
                                  color: '#10b981',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.55rem',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontWeight: 700,
                                  fontSize: '0.78rem'
                                }}
                              >
                                <RotateCcw size={14} /> Unskip
                              </button>
                            )}

                            <button
                              className="btn-logout"
                              onClick={() => onDeletePatient(patient.id, patient.name)}
                              title="Delete Patient"
                              style={{ cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
      {selectedPatientForHistory && createPortal(
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
        </div>,
        document.body
      )}

      {/* Patient Already in Queue Warning Modal */}
      {alreadyInQueuePatient && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1.5rem'
          }}
          onClick={() => setAlreadyInQueuePatient(null)}
        >
          <div
            className="card modal-content fade-in"
            style={{
              padding: '2rem',
              width: '100%',
              maxWidth: '460px',
              textAlign: 'center',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)'
            }}>
              <Clock size={34} />
            </div>

            <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Patient Already In Queue!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.4rem', lineHeight: 1.4 }}>
              This patient is already registered and active in today's doctor queue.
            </p>

            <div style={{
              background: 'var(--bg-dark, rgba(255, 255, 255, 0.02))',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.15rem 1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Patient Name:</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{alreadyInQueuePatient.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', borderTop: '1px dashed var(--border)', paddingTop: '0.65rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Register ID (Patient ID):</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>#{alreadyInQueuePatient.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', borderTop: '1px dashed var(--border)', paddingTop: '0.65rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Token Number:</span>
                <strong style={{ fontSize: '1.45rem', color: '#f59e0b', fontWeight: 800 }}>
                  {alreadyInQueuePatient.tokenNumber ? `#${alreadyInQueuePatient.tokenNumber}` : 'In Queue'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', borderTop: '1px dashed var(--border)', paddingTop: '0.65rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Assigned Doctor:</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {doctors.find(d => Number(d.id) === Number(alreadyInQueuePatient.assignedDoctorId))?.name || 'Assigned Doctor'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.65rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Queue Status:</span>
                <span className="badge badge-pending" style={{ fontWeight: 700 }}>
                  {alreadyInQueuePatient.status || 'In Queue'}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                fontWeight: 700,
                padding: '0.75rem',
                fontSize: '0.95rem'
              }}
              onClick={() => {
                setAlreadyInQueuePatient(null);
                setReturningPatientId(null);
                setFormSubmitted(false);
                // Clear Form
                setName('');
                setAge('');
                setGender('Male');
                setContact('');
                setCountryCode('+91');
                setFatherOrHusbandName('');
                setMotherName('');
                setGuardianName('');
                setAlternatePhone('');
                setAltCountryCode('+91');
                setStreet('');
                setCity('');
                setPincode('');
                setHeight('');
                setWeight('');
                setBp('');
                setHr('');
                setSpo2('');
                setGrbs('');
                setTemp('');
                setRespiratoryRate('');
                setPainScale('');
                setHeadCircumference('');
                setAvpu('Alert');
                setDob('');
                setBmi('');
              }}
            >
              Done & Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Registration/Re-queue Success Modal */}
      {successPatient && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1.5rem'
          }}
          onClick={() => setSuccessPatient(null)}
        >
          <div
            className="card modal-content fade-in"
            style={{
              padding: '2rem',
              width: '100%',
              maxWidth: '460px',
              textAlign: 'center',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Patient Queued Successfully!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              The patient has been registered and added to the doctor's queue.
            </p>

            <div style={{
              background: 'var(--bg-dark, rgba(255, 255, 255, 0.02))',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Patient Name:</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{successPatient.name}</strong>
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
              style={{ width: '100%', fontWeight: 700, padding: '0.75rem' }}
              onClick={() => setSuccessPatient(null)}
            >
              Done & Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Checklist & Override Modal */}
      {paymentModalPatient && createPortal(
        <div className="payment-modal-overlay" onClick={() => setPaymentModalPatient(null)}>
          <div className="payment-modal-card" onClick={e => e.stopPropagation()}>
            {/* Popover Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                💳 Billing Checklist: #{paymentModalPatient.id}
              </span>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer', padding: 0 }}
                onClick={() => setPaymentModalPatient(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '0.75rem', background: 'var(--bg-dark)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
              <strong>Patient Name:</strong> {paymentModalPatient.name}
            </div>

            {/* Payment Method Status */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Payment Method Status</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ marginTop: '0.25rem', width: '100%' }}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid - Cash">Paid - Cash</option>
                <option value="Paid - UPI">Paid - UPI</option>
                <option value="Paid - Card">Paid - Card</option>
              </select>
            </div>

            {/* Checklist of Fees */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Fee Breakdown Checklist</label>
              <div className="payment-fee-grid">
                {/* Doctor Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeDoctorChecked} onChange={(e) => setFeeDoctorChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Doctor Fees
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeDoctor}
                      onChange={(e) => setFeeDoctor(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Procedure Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeProcedureChecked} onChange={(e) => setFeeProcedureChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Procedure Fees
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeProcedure}
                      onChange={(e) => setFeeProcedure(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Lab Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeLabChecked} onChange={(e) => setFeeLabChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Lab Invest.
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeLab}
                      onChange={(e) => setFeeLab(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Ward Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeWardChecked} onChange={(e) => setFeeWardChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Ward Room
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeWard}
                      onChange={(e) => setFeeWard(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* O2 Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeO2Checked} onChange={(e) => setFeeO2Checked(e.target.checked)} style={{ flexShrink: 0 }} />
                    O2 Therapy
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeO2}
                      onChange={(e) => setFeeO2(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* GRBS Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeGrbsChecked} onChange={(e) => setFeeGrbsChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    GRBS (Sugar)
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeGrbs}
                      onChange={(e) => setFeeGrbs(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Dressing Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeDressingChecked} onChange={(e) => setFeeDressingChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Dressing
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeDressing}
                      onChange={(e) => setFeeDressing(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Nebuliser Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeNebuliserChecked} onChange={(e) => setFeeNebuliserChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Nebuliser
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeNebuliser}
                      onChange={(e) => setFeeNebuliser(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* ECG Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeEcgChecked} onChange={(e) => setFeeEcgChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    ECG Test
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeEcg}
                      onChange={(e) => setFeeEcg(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Nurse Fees */}
                <div className="payment-fee-item">
                  <label className="payment-fee-label">
                    <input type="checkbox" checked={feeNurseChecked} onChange={(e) => setFeeNurseChecked(e.target.checked)} style={{ flexShrink: 0 }} />
                    Nurse Care
                  </label>
                  <div className="payment-fee-input-wrap">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input payment-fee-input"
                      value={feeNurse}
                      onChange={(e) => setFeeNurse(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Paid Amount Field */}
            <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>Total Paid Amount (INR)</span>
                <span style={{ color: 'var(--text-secondary)' }}>Auto: ₹{calculatedTotal}</span>
              </div>
              <input
                type="number"
                className="form-input"
                value={customPaidAmount}
                onChange={(e) => setCustomPaidAmount(e.target.value)}
                placeholder={calculatedTotal}
                style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem', padding: '0.35rem 0.6rem', height: 'auto', width: '100%' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                onClick={() => setPaymentModalPatient(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem', background: 'var(--primary)', border: 'none', fontWeight: 700 }}
                onClick={handleConfirmPayment}
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Preview Modal */}
      {previewImage && createPortal(
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
            zIndex: 999999,
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
        </div>,
        document.body
      )}

      {hkDeleteTarget && (
        <ConfirmModal
          isOpen={true}
          title="Delete Housekeeping Log"
          message={`Delete housekeeping record for "${hkDeleteTarget.placeName}"?`}
          confirmText="Delete Record"
          type="danger"
          onCancel={() => setHkDeleteTarget(null)}
          onConfirm={() => {
            handleDeleteHkCheck(hkDeleteTarget.id);
            setHkDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default ReceptionistDashboard;
