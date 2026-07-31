import React, { useState } from 'react';
import { UserPlus, Users, DollarSign, Calendar, CheckCircle, Clock, Search, History, Check, X, Trash2, Bed, Baby, Microscope } from 'lucide-react';

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
  const [contact, setContact] = useState('');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
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

  const handleSubmit = async (e) => {
    if (!name || (receptionistTab !== 'child' && !age) || !contact || !assignedDoctorId) return;

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

    const registered = await onRegisterPatient({
      name,
      age: calculatedAge,
      gender,
      contact,
      fatherOrHusbandName,
      motherOrGuardianName: motherOrGuardianValue,
      alternatePhone,
      address: [street.trim(), city.trim(), pincode.trim()].filter(Boolean).join(' | '),
      assignedDoctorId: parseInt(assignedDoctorId),
      height,
      weight,
      bp,
      hr,
      spo2,
      grbs,
      temp,
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

  // Filter patients for Today's Active Reception Queue & Payment Collection (24-hour daily reset)
  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const todayPatients = patients.filter(p => 
    p.status !== 'Inactive' && 
    (p.registrationDate === todayStr || p.wardBedId)
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
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                {receptionistTab === 'child' ? (
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

                {/* Address Fields */}
                <div style={{ margin: '0.25rem 0 0' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Address</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Street / Area"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City / Town"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
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
                          placeholder="e.g. 38 weeks"
                          value={childGa}
                          onChange={(e) => setChildGa(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Birth Date</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={childBirthDate}
                          onChange={(e) => setChildBirthDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
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
                      <div className="form-group">
                        <label className="form-label">History of NICU Admission</label>
                        <select 
                          className="form-input"
                          value={childNicuHistory}
                          onChange={(e) => setChildNicuHistory(e.target.value)}
                        >
                          <option value="No">No History</option>
                          <option value="Yes">Yes (Admitted to NICU)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

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
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {onAdmitToWard && !patient.wardBedId && patient.status !== 'Completed' && (
                              <button
                                className="btn-logout"
                                onClick={() => onAdmitToWard(patient)}
                                title="Admit to Ward Room"
                                style={{ cursor: 'pointer', color: '#0f766e', background: 'rgba(15,118,110,0.08)', borderRadius: '6px', padding: '0.3rem 0.5rem', border: '1px solid rgba(15,118,110,0.2)' }}
                              >
                                <Bed size={16} />
                              </button>
                            )}
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



      {/* Payment Checklist & Override Modal */}
      {paymentModalPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1.5rem'
        }} onClick={() => setPaymentModalPatient(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.15)',
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
