import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, UserPlus, Users, DollarSign, Calendar, CheckCircle, Clock, Search, History, Check, X, Trash2, Bed, Baby, Microscope, Sparkles, Sprout } from 'lucide-react';
const API_BASE = import.meta.env.VITE_API_URL || '';

// Tamil Nadu locations dataset with focus on Kollidam & surrounding areas
const TN_LOCATIONS = [
  // Kollidam & Surrounding Areas (Main Focus)
  { area: 'Kollidam', city: 'Kollidam', pincode: '609102' },
  { area: 'Kollidam Bazaar', city: 'Kollidam', pincode: '609102' },
  { area: 'Anaikaranchatram', city: 'Kollidam', pincode: '609102' },
  { area: 'Kollidam Dam', city: 'Kollidam', pincode: '609102' },
  { area: 'Kollidam Old Bus Stand', city: 'Kollidam', pincode: '609102' },
  { area: 'Achalpuram', city: 'Sirkazhi', pincode: '609101' },
  { area: 'Sirkazhi / Sirkali', city: 'Sirkazhi', pincode: '609110' },
  { area: 'Sirkazhi Town', city: 'Sirkazhi', pincode: '609110' },
  { area: 'Thirunagari', city: 'Sirkazhi', pincode: '609106' },
  { area: 'Thirumullaivasal', city: 'Sirkazhi', pincode: '609113' },
  { area: 'Poompuhar', city: 'Sirkazhi', pincode: '609105' },
  { area: 'Vaitheeswarankoil', city: 'Vaitheeswarankoil', pincode: '609117' },
  { area: 'Chidambaram', city: 'Chidambaram', pincode: '608001' },
  { area: 'Annamalai Nagar', city: 'Chidambaram', pincode: '608002' },
  { area: 'Bhuvanagiri', city: 'Chidambaram', pincode: '608601' },
  { area: 'Kattumannarkoil', city: 'Kattumannarkoil', pincode: '608301' },
  { area: 'Mayiladuthurai', city: 'Mayiladuthurai', pincode: '609001' },
  { area: 'Kuttalam', city: 'Mayiladuthurai', pincode: '609801' },
  { area: 'Tharangambadi (Tranquebar)', city: 'Mayiladuthurai', pincode: '609313' },
  { area: 'Semenar Koil', city: 'Mayiladuthurai', pincode: '609309' },
  { area: 'Kumbakonam', city: 'Kumbakonam', pincode: '612001' },
  { area: 'Swamimalai', city: 'Kumbakonam', pincode: '612302' },
  { area: 'Papanasam', city: 'Kumbakonam', pincode: '614205' },
  { area: 'Thanjavur', city: 'Thanjavur', pincode: '613001' },
  { area: 'Vallam', city: 'Thanjavur', pincode: '613403' },
  { area: 'Cuddalore', city: 'Cuddalore', pincode: '607001' },
  { area: 'Cuddalore OT', city: 'Cuddalore', pincode: '607003' },
  { area: 'Neyveli', city: 'Neyveli', pincode: '607801' },
  { area: 'Panruti', city: 'Cuddalore', pincode: '607106' },
  { area: 'Virudhachalam', city: 'Virudhachalam', pincode: '606001' },
  { area: 'Nagapattinam', city: 'Nagapattinam', pincode: '611001' },
  { area: 'Velankanni', city: 'Nagapattinam', pincode: '611111' },
  { area: 'Nagore', city: 'Nagapattinam', pincode: '611002' },
  { area: 'Vedaranyam', city: 'Nagapattinam', pincode: '614810' },
  { area: 'Tiruvarur', city: 'Tiruvarur', pincode: '610001' },
  { area: 'Mannargudi', city: 'Tiruvarur', pincode: '614001' },

  // Major Tamil Nadu Cities & Districts
  { area: 'Trichy / Tiruchirappalli', city: 'Trichy', pincode: '620001' },
  { area: 'Srirangam', city: 'Trichy', pincode: '620006' },
  { area: 'Thillai Nagar', city: 'Trichy', pincode: '620018' },
  { area: 'Chennai Central', city: 'Chennai', pincode: '600001' },
  { area: 'Chennai - T. Nagar', city: 'Chennai', pincode: '600017' },
  { area: 'Chennai - Guindy', city: 'Chennai', pincode: '600032' },
  { area: 'Chennai - Anna Nagar', city: 'Chennai', pincode: '600040' },
  { area: 'Chennai - Tambaram', city: 'Chennai', pincode: '600045' },
  { area: 'Madurai', city: 'Madurai', pincode: '625001' },
  { area: 'Madurai - KK Nagar', city: 'Madurai', pincode: '625020' },
  { area: 'Coimbatore', city: 'Coimbatore', pincode: '641001' },
  { area: 'Coimbatore - Gandhipuram', city: 'Coimbatore', pincode: '641012' },
  { area: 'Salem', city: 'Salem', pincode: '636001' },
  { area: 'Tirunelveli', city: 'Tirunelveli', pincode: '627001' },
  { area: 'Erode', city: 'Erode', pincode: '638001' },
  { area: 'Vellore', city: 'Vellore', pincode: '632001' },
  { area: 'Tiruppur', city: 'Tiruppur', pincode: '641601' },
  { area: 'Dindigul', city: 'Dindigul', pincode: '624001' },
  { area: 'Karur', city: 'Karur', pincode: '639001' },
  { area: 'Kanchipuram', city: 'Kanchipuram', pincode: '631501' },
  { area: 'Villupuram', city: 'Villupuram', pincode: '605602' },
  { area: 'Ramanathapuram', city: 'Ramanathapuram', pincode: '623501' },
  { area: 'Pudukkottai', city: 'Pudukkottai', pincode: '622001' },
  { area: 'Tiruvannamalai', city: 'Tiruvannamalai', pincode: '606601' },
  { area: 'Thoothukudi (Tuticorin)', city: 'Thoothukudi', pincode: '628001' },
  { area: 'Nagercoil', city: 'Kanyakumari', pincode: '629001' },
  { area: 'Ariyalur', city: 'Ariyalur', pincode: '621701' },
  { area: 'Perambalur', city: 'Perambalur', pincode: '621212' },
  { area: 'Namakkal', city: 'Namakkal', pincode: '637001' },
  { area: 'Dharmapuri', city: 'Dharmapuri', pincode: '636701' },
  { area: 'Krishnagiri', city: 'Krishnagiri', pincode: '635001' },
  { area: 'Theni', city: 'Theni', pincode: '625531' },
  { area: 'Virudhunagar', city: 'Virudhunagar', pincode: '626001' },
  { area: 'Tenkasi', city: 'Tenkasi', pincode: '627811' }
];

const ReceptionistDashboard = ({
  patients,
  doctors,
  onRegisterPatient,
  onUpdatePaymentStatus,
  onReRegisterPatient,
  isAdmin = false,
  onDeletePatient,
  onAdmitToWard
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [countryCode, setCountryCode] = useState('+91');
  const [contact, setContact] = useState('');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [altCountryCode, setAltCountryCode] = useState('+91');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [dob, setDob] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [returningPatientId, setReturningPatientId] = useState(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(true);

  // Housekeeping Modal & Form States
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [hkLogs, setHkLogs] = useState([]);
  const [hkPlaceName, setHkPlaceName] = useState('');
  const [hkDate, setHkDate] = useState(new Date().toISOString().split('T')[0]);
  const [hkCleaned, setHkCleaned] = useState(false);
  const [hkWatered, setHkWatered] = useState(false);
  const [hkNotes, setHkNotes] = useState('');
  const [hkLoading, setHkLoading] = useState(false);

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
    if (!window.confirm("Are you sure you want to delete this housekeeping record?")) return;
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
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [assignedDoctorId, setAssignedDoctorId] = useState(doctors[0]?.id || '');
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
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [grbs, setGrbs] = useState('');
  const [temp, setTemp] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [painScale, setPainScale] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [avpu, setAvpu] = useState('Alert');
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
  const [receptionistTab, setReceptionistTab] = useState('new'); // 'new', 'returning' or 'child'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [reRegisterDoctorId, setReRegisterDoctorId] = useState(doctors[0]?.id || '');
  const [successPatient, setSuccessPatient] = useState(null);

  // Child Register specific states
  const [childGa, setChildGa] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childBirthWeight, setChildBirthWeight] = useState('');
  const [childPlaceOfBirth, setChildPlaceOfBirth] = useState('');
  const [childDeliveryType, setChildDeliveryType] = useState('NVD');
  const [childNicuHistory, setChildNicuHistory] = useState('No');

  // Special Investigation
  const [specialInvestigation, setSpecialInvestigation] = useState(false);
  const [specialInvestigationNotes, setSpecialInvestigationNotes] = useState('');

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

    const isNameValid = !!name.trim();
    const isDoctorValid = !!assignedDoctorId;

    if (!isNameValid || !isDoctorValid) {
      return;
    }

    if (alternatePhone) {
      const cleanAlt = alternatePhone.replace(/\D/g, '');
      if (cleanAlt.length !== 10) {
        return;
      }
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
    if (returningPatientId) {
      registered = await onReRegisterPatient(returningPatientId, parseInt(assignedDoctorId), patientPayload);
    } else {
      registered = await onRegisterPatient(patientPayload);
    }

    if (registered) {
      setSuccessPatient(registered);
      setFormSubmitted(false);
      setReturningPatientId(null);
      // Reset Form
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
      // Child Fields Reset
      setChildGa('');
      setChildBirthDate('');
      setChildBirthWeight('');
      setChildPlaceOfBirth('');
      setChildDeliveryType('NVD');
      setChildNicuHistory('No');
      setSpecialInvestigation(false);
      setSpecialInvestigationNotes('');
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

  // Helper to compare dates robustly across different string formats
  const isSameDayStr = (d1, d2) => {
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    const dateA = new Date(d1);
    const dateB = new Date(d2);
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getFullYear() === dateB.getFullYear() &&
             dateA.getMonth() === dateB.getMonth() &&
             dateA.getDate() === dateB.getDate();
    }
    return false;
  };

  // Filter patients for Today's Active Reception Queue & Payment Collection (24-hour daily reset)
  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const todayPatients = patients.filter(p =>
    p.status !== 'Inactive' &&
    isSameDayStr(p.registrationDate, todayStr)
  );

  // Stats for Today
  const totalPatients = todayPatients.length;
  const activeQueue = todayPatients.filter(p => ['Registered', 'Consulting', 'At Pharmacy', 'Reviewing'].includes(p.status)).length;
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
                      setReturningPatientId(null);
                      setName('');
                      setAge('');
                      setContact('');
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

              <form onSubmit={handleSubmit}>
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

                  {/* Existing Patient Auto-suggest Dropdown */}
                  {nameMatches.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'var(--card-bg, #ffffff)',
                      border: '1.5px solid var(--primary, #157388)',
                      borderRadius: '10px',
                      boxShadow: '0 12px 30px -5px rgba(0,0,0,0.3)',
                      zIndex: 99999,
                      maxHeight: '260px',
                      overflowY: 'auto',
                      padding: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.6rem',
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary, #157388)'
                      }}>
                        <span>💡 Existing Patient(s) Found in Database ({nameMatches.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowNameSuggestions(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          ✕ Close
                        </button>
                      </div>

                      {nameMatches.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            handleSelectReturningPatient(p);
                            setShowNameSuggestions(false);
                          }}
                          style={{
                            padding: '0.65rem 0.75rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                            transition: 'background 0.15s',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            marginTop: '0.25rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(21, 115, 136, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #1e293b)' }}>
                              {p.name} <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>(#{p.id})</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                {/* Address Fields with Location Auto-suggest */}
                <div style={{ margin: '0.25rem 0 0' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Address</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
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
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                          background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border)',
                          borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          maxHeight: '220px', overflowY: 'auto', marginTop: '4px'
                        }}>
                          {TN_LOCATIONS.filter(loc =>
                            loc.area.toLowerCase().includes(street.toLowerCase()) ||
                            loc.city.toLowerCase().includes(street.toLowerCase()) ||
                            loc.pincode.includes(street.trim())
                          ).slice(0, 10).map((loc, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '0.6rem 0.85rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.85rem'
                              }}
                              onMouseDown={() => {
                                setStreet(loc.area);
                                setCity(loc.city);
                                setPincode(loc.pincode);
                                setShowStreetSuggestions(false);
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📍 {loc.area}</span>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem', fontSize: '0.78rem' }}>({loc.city})</span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.78rem' }}>{loc.pincode}</span>
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
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                          background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border)',
                          borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          maxHeight: '220px', overflowY: 'auto', marginTop: '4px'
                        }}>
                          {TN_LOCATIONS.filter(loc =>
                            loc.city.toLowerCase().includes(city.toLowerCase()) ||
                            loc.area.toLowerCase().includes(city.toLowerCase())
                          ).slice(0, 10).map((loc, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '0.6rem 0.85rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.85rem'
                              }}
                              onMouseDown={() => {
                                setCity(loc.city);
                                if (!street) setStreet(loc.area);
                                setPincode(loc.pincode);
                                setShowCitySuggestions(false);
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🏙️ {loc.city}</span>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem', fontSize: '0.78rem' }}>({loc.area})</span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.78rem' }}>{loc.pincode}</span>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
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
                    <div style={{ textStyle: 'center', padding: '2rem 1rem', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No matching patient record found for "<strong>{searchQuery}</strong>".</p>
                    </div>
                  ) : (
                    filteredPatients.map(p => (
                      <div 
                        key={p.id} 
                        style={{ 
                          border: '1px solid rgba(99, 102, 241, 0.2)', 
                          padding: '1.15rem', 
                          borderRadius: '12px', 
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
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
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                                Last Visit: <span style={{ fontWeight: 600, color: '#334155' }}>{p.registrationDate || 'Previous Visit'}</span>
                              </div>
                            </div>
                          </div>

                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            background: 'rgba(99, 102, 241, 0.12)', 
                            color: '#4f46e5', 
                            padding: '0.3rem 0.65rem', 
                            borderRadius: '20px',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            letterSpacing: '0.02em',
                            flexShrink: 0
                          }}>
                            ID: #{p.id}
                          </span>
                        </div>

                        {/* Demographic Info Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                            {p.age} Yrs
                          </span>
                          <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                            {p.gender}
                          </span>
                          <span style={{ fontSize: '0.78rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                            📞 {p.contact}
                          </span>
                        </div>

                        {/* Family Details if present */}
                        {(p.fatherOrHusbandName || p.motherOrGuardianName || p.alternatePhone) && (
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#475569', 
                            background: 'rgba(241, 245, 249, 0.7)', 
                            padding: '0.5rem 0.75rem', 
                            borderRadius: '6px', 
                            marginBottom: '1rem',
                            lineHeight: '1.4' 
                          }}>
                            {p.fatherOrHusbandName && <div><strong>Father/Husband:</strong> {p.fatherOrHusbandName}</div>}
                            {p.motherOrGuardianName && (
                              <div>
                                {p.motherOrGuardianName.includes(' | Guardian: ') ? (
                                  <>
                                    <div><strong>Mother:</strong> {p.motherOrGuardianName.split(' | Guardian: ')[0].replace('Mother: ', '')}</div>
                                    <div><strong>Guardian:</strong> {p.motherOrGuardianName.split(' | Guardian: ')[1]}</div>
                                  </>
                                ) : p.motherOrGuardianName.startsWith('Mother: ') ? (
                                  <div><strong>Mother:</strong> {p.motherOrGuardianName.replace('Mother: ', '')}</div>
                                ) : p.motherOrGuardianName.startsWith('Guardian: ') ? (
                                  <div><strong>Guardian:</strong> {p.motherOrGuardianName.replace('Guardian: ', '')}</div>
                                ) : (
                                  <div><strong>Mother/Guardian:</strong> {p.motherOrGuardianName}</div>
                                )}
                              </div>
                            )}
                            {p.alternatePhone && <div><strong>Alt Phone:</strong> {p.alternatePhone}</div>}
                          </div>
                        )}

                        {/* Action Buttons Side-by-Side */}
                        <div style={{ display: 'grid', gridTemplateColumns: ((p.history && p.history.length > 0) || p.diagnosis) ? '1fr 1fr' : '1fr', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
                              <History size={14} /> Clinical History
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ 
                              padding: '0.5rem 0.85rem', 
                              fontSize: '0.82rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '0.4rem'
                            }}
                            onClick={() => handleSelectReturningPatient(p)}
                          >
                            <UserPlus size={15} /> Re-Register Patient
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
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
            Patients List & Payment Collection
          </h3>

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
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPatients.slice().reverse().map(patient => {
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
                              badgeText = 'Reviewing';
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
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          padding: '1.5rem'
        }} onClick={() => setPaymentModalPatient(null)}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            color: 'var(--text-primary)',
            textAlign: 'left'
          }} onClick={e => e.stopPropagation()}>
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
                style={{ marginTop: '0.25rem' }}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid - Cash">Paid - Cash</option>
                <option value="Paid - UPI">Paid - UPI</option>
              </select>
            </div>

            {/* Checklist of Fees - 2 Column Grid */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Fee Breakdown Checklist</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 0.75rem' }}>
                {/* Doctor Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeDoctorChecked} onChange={(e) => setFeeDoctorChecked(e.target.checked)} />
                    Doctor Fees
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeDoctor}
                      onChange={(e) => setFeeDoctor(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Procedure Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeProcedureChecked} onChange={(e) => setFeeProcedureChecked(e.target.checked)} />
                    Procedure Fees
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeProcedure}
                      onChange={(e) => setFeeProcedure(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Lab Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeLabChecked} onChange={(e) => setFeeLabChecked(e.target.checked)} />
                    Lab Invest.
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeLab}
                      onChange={(e) => setFeeLab(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Ward Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeWardChecked} onChange={(e) => setFeeWardChecked(e.target.checked)} />
                    Ward Room
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeWard}
                      onChange={(e) => setFeeWard(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* O2 Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeO2Checked} onChange={(e) => setFeeO2Checked(e.target.checked)} />
                    O2 Therapy
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeO2}
                      onChange={(e) => setFeeO2(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* GRBS Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeGrbsChecked} onChange={(e) => setFeeGrbsChecked(e.target.checked)} />
                    GRBS (Sugar)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeGrbs}
                      onChange={(e) => setFeeGrbs(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Dressing Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeDressingChecked} onChange={(e) => setFeeDressingChecked(e.target.checked)} />
                    Dressing
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeDressing}
                      onChange={(e) => setFeeDressing(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Nebuliser Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeNebuliserChecked} onChange={(e) => setFeeNebuliserChecked(e.target.checked)} />
                    Nebuliser
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeNebuliser}
                      onChange={(e) => setFeeNebuliser(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* ECG Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeEcgChecked} onChange={(e) => setFeeEcgChecked(e.target.checked)} />
                    ECG Test
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeEcg}
                      onChange={(e) => setFeeEcg(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Nurse Fees */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-dark)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    <input type="checkbox" checked={feeNurseChecked} onChange={(e) => setFeeNurseChecked(e.target.checked)} />
                    Nurse Care
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '55px', padding: '0.15rem 0.25rem', fontSize: '0.8rem', height: 'auto', textAlign: 'right' }}
                      value={feeNurse}
                      onChange={(e) => setFeeNurse(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Paid Amount Field (Enter by their self) */}
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
                style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem', padding: '0.25rem 0.5rem', height: 'auto' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => setPaymentModalPatient(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem', background: 'var(--primary)', border: 'none', fontWeight: 700 }}
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
    </div>
  );
};

export default ReceptionistDashboard;
