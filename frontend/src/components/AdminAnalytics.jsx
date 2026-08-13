import React from 'react';
import { BarChart2, Users, Activity, CheckCircle, DollarSign, Stethoscope, TrendingUp, PieChart, MapPin } from 'lucide-react';

/* ── SVG Donut Chart ─────────────────────────────────────────────── */
const DonutChart = ({ segments, size = 150, strokeWidth = 28, label, sublabel }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
          {total === 0
            ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
            : segments.map((seg, i) => {
                if (!seg.value) return null;
                const pct = seg.value / total;
                const el = (
                  <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={seg.color} strokeWidth={strokeWidth}
                    strokeDasharray={`${pct * circ} ${circ}`}
                    strokeDashoffset={-offset * circ}
                    strokeLinecap="butt" />
                );
                offset += pct;
                return el;
              })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{label}</span>
          {sublabel && <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sublabel}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.6rem', justifyContent: 'center' }}>
        {segments.map((s, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Vertical Bar Chart ──────────────────────────────────────────── */
const VBar = ({ bars, height = 140 }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.3rem', height }}>
      {bars.map((b, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 2 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{b.value || ''}</span>
          <div style={{
            width: '100%',
            height: `${(b.value / max) * (height - 30)}px`,
            minHeight: b.value ? 4 : 0,
            background: b.color || 'var(--primary)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease'
          }} />
          <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Horizontal Bar Chart ────────────────────────────────────────── */
const HBar = ({ bars }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {bars.map((b, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{b.value}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', height: 10 }}>
            <div style={{ width: `${(b.value / max) * 100}%`, height: '100%', background: b.color || 'var(--primary)', borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ────────────────────────────────────────────────────── */
const Kpi = ({ icon: Icon, value, label, sub, color, bg }) => (
  <div className="kpi-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease' }}>
    <div className="kpi-icon-box" style={{
      background: bg,
      color: color,
      width: 48,
      height: 48,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 4px 15px ${color}35`,
      border: `1px solid ${color}55`
    }}>
      <Icon size={22} strokeWidth={2.2} />
    </div>
    <div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Chart Card ──────────────────────────────────────────────────── */
const ChCard = ({ title, Icon, children, style }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)' }}>
      {Icon && <Icon size={15} style={{ color: 'var(--primary)' }} />}
      <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
    </div>
    {children}
  </div>
);

/* ── Main Analytics Dashboard ────────────────────────────────────── */
const AdminAnalytics = ({ patients = [], doctors = [], staffList = [] }) => {
  const todayStr    = new Date().toLocaleDateString('en-GB');
  const activeP     = patients.filter(p => p.status !== 'Inactive' && p.status !== 'Completed');
  const completed   = patients.filter(p => p.status === 'Completed');
  const todayP      = patients.filter(p => p.registrationDate && new Date(p.registrationDate).toLocaleDateString('en-GB') === todayStr);
  const paid        = patients.filter(p => p.paymentStatus && p.paymentStatus.startsWith('Paid'));
  const unpaid      = patients.filter(p => !p.paymentStatus || !p.paymentStatus.startsWith('Paid'));
  const totalActive = patients.filter(p => p.status !== 'Inactive').length;
  const compRate    = patients.length ? Math.round((completed.length / patients.length) * 100) : 0;

  /* Status donut */
  const STATUS_CLR = { Registered: '#6366f1', Consulting: '#0ea5e9', 'At Pharmacy': '#f59e0b', Reviewing: '#8b5cf6', Completed: '#10b981', Inactive: '#475569' };
  const statusMap  = {};
  patients.forEach(p => { const s = p.status || 'Unknown'; statusMap[s] = (statusMap[s] || 0) + 1; });
  const statusSeg  = Object.entries(statusMap).map(([s, v]) => ({ label: s, value: v, color: STATUS_CLR[s] || '#94a3b8' }));

  /* Gender donut */
  const GEN_CLR  = { Male: '#6366f1', Female: '#ec4899', Other: '#f59e0b', Unknown: '#94a3b8' };
  const genMap   = {};
  patients.forEach(p => { const g = p.gender || 'Unknown'; genMap[g] = (genMap[g] || 0) + 1; });
  const genSeg   = Object.entries(genMap).map(([g, v]) => ({ label: g, value: v, color: GEN_CLR[g] || '#94a3b8' }));

  /* Age bars */
  const ageMap = { '0-12': 0, '13-25': 0, '26-45': 0, '46-60': 0, '60+': 0 };
  patients.forEach(p => {
    const a = parseInt(p.age);
    if (!a) return;
    if (a <= 12) ageMap['0-12']++;
    else if (a <= 25) ageMap['13-25']++;
    else if (a <= 45) ageMap['26-45']++;
    else if (a <= 60) ageMap['46-60']++;
    else ageMap['60+']++;
  });
  const AGE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'];
  const ageBars = Object.entries(ageMap).map(([label, value], i) => ({
    label,
    value,
    color: AGE_COLORS[i % AGE_COLORS.length]
  }));

  /* Daily flow bars (last 7 days) */
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const DAILY_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fbbf24', '#34d399', '#f87171'];
  const dailyBars = last7.map((d, index) => {
    const dateStr = d.toLocaleDateString('en-GB');
    const count = patients.filter(p => p.registrationDate && new Date(p.registrationDate).toLocaleDateString('en-GB') === dateStr).length;
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      value: count,
      color: DAILY_COLORS[index % DAILY_COLORS.length]
    };
  });

  /* Doctor workload */
  const docBars = doctors.map((doc, i) => ({
    label: doc.name,
    value: patients.filter(p => p.assignedDoctorId === doc.id && p.status !== 'Inactive').length,
    color: ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'][i % 5]
  }));

  /* Staff roles donut */
  const ROLE_CLR = { doctor: '#6366f1', receptionist: '#10b981', pharmacy: '#f59e0b', ward: '#0ea5e9', lab: '#8b5cf6' };
  const roleMap  = {};
  doctors.forEach(() => { roleMap['doctor'] = (roleMap['doctor'] || 0) + 1; });
  staffList.forEach(s => { roleMap[s.role] = (roleMap[s.role] || 0) + 1; });
  const roleSeg = Object.entries(roleMap).map(([r, v]) => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: v, color: ROLE_CLR[r] || '#94a3b8' }));

  /* Geographic / Pincode Distribution (Calculated strictly from registered patient records) */
  const locationGroupMap = {};

  const extractCityName = (addr) => {
    if (!addr) return '';
    if (addr.includes(' | ')) {
      const parts = addr.split(' | ').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2 && parts[1] && !/^\d+$/.test(parts[1])) {
        return parts[1];
      }
      if (parts[0] && !/street|st\b|road|rd\b|nagar|lane|door|no\b|3rd|2nd|1st|4th|^\d+$/i.test(parts[0])) {
        return parts[0];
      }
      return '';
    }
    const clean = addr.replace(/,\s*/g, ' ').trim();
    if (/street|st\b|road|rd\b|nagar|door|no\b|3rd|2nd|1st|4th/i.test(clean)) return '';
    const words = clean.split(/\s+/).filter(w => !/^\d+$/.test(w));
    return words.length > 0 ? words.slice(-2).join(' ') : '';
  };

  const extractPincodeVal = (addr) => {
    if (!addr) return '';
    const match = addr.match(/\b(6\d{5})\b/);
    return match ? match[1] : '';
  };

  patients.forEach(p => {
    const addr = (p.address || '').trim();
    if (!addr) {
      const key = 'Not Specified';
      locationGroupMap[key] = (locationGroupMap[key] || 0) + 1;
      return;
    }

    const cityRaw = extractCityName(addr);
    const pin = extractPincodeVal(addr);

    let city = cityRaw.replace(/town|city/gi, '').trim();
    if (city && !/street|st\b|road|rd\b|3rd/i.test(city)) {
      city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else {
      city = '';
    }

    let key = '';
    if (city && pin) {
      key = city.includes(pin) ? city : `${city} (${pin})`;
    } else if (city) {
      key = city;
    } else if (pin) {
      key = `Pincode ${pin}`;
    } else {
      key = 'Not Specified';
    }

    locationGroupMap[key] = (locationGroupMap[key] || 0) + 1;
  });

  const LOC_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];

  const sortedLocations = Object.entries(locationGroupMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const totalPatientsCount = patients.length || 1;
  const locationSegments = sortedLocations.slice(0, 6).map((loc, i) => ({
    label: loc.label,
    value: loc.value,
    color: LOC_COLORS[i % LOC_COLORS.length],
    pct: Math.round((loc.value / totalPatientsCount) * 100)
  }));

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={22} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Hospital Analytics</h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Live data · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
            ● Live
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <Kpi icon={Users}       value={totalActive}        label="Total Patients"         sub={`${todayP.length} registered today`}  color="#818cf8" bg="rgba(129, 140, 248, 0.18)" />
        <Kpi icon={Activity}    value={activeP.length}     label="Currently Active"       sub="In care right now"                    color="#38bdf8" bg="rgba(56, 189, 248, 0.18)" />
        <Kpi icon={CheckCircle} value={`${compRate}%`}     label="Completion Rate"        sub={`${completed.length} completed`}      color="#34d399" bg="rgba(52, 211, 153, 0.18)" />
        <Kpi icon={DollarSign}  value={paid.length}        label="Paid Consultations"     sub={`${unpaid.length} unpaid`}            color="#fbbf24" bg="rgba(251, 191, 36, 0.18)" />
        <Kpi icon={Stethoscope} value={doctors.length}     label="Active Doctors"         sub={`${staffList.length} other staff`}    color="#c084fc" bg="rgba(192, 132, 252, 0.18)" />
        <Kpi icon={TrendingUp}  value={todayP.length}      label="Today's Registrations"  sub={new Date().toLocaleDateString('en-GB', { weekday: 'long' })} color="#f472b6" bg="rgba(244, 114, 182, 0.18)" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <ChCard title="Patient Status Distribution" Icon={PieChart}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DonutChart segments={statusSeg} size={152} strokeWidth={26} label={totalActive} sublabel="Patients" />
          </div>
        </ChCard>

        <ChCard title="Daily Patient Flow — Last 7 Days" Icon={BarChart2}>
          <VBar bars={dailyBars} height={152} />
        </ChCard>

        <ChCard title="Gender Distribution" Icon={PieChart}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DonutChart segments={genSeg} size={152} strokeWidth={26} label={totalActive} sublabel="Total" />
          </div>
        </ChCard>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <ChCard title="Doctor Workload (Active Patients)" Icon={Stethoscope}>
          <HBar bars={docBars} />
          <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            Total active across all doctors: <strong style={{ color: 'var(--text-primary)' }}>{activeP.length}</strong>
          </div>
        </ChCard>

        <ChCard title="Patient Age Group Distribution" Icon={BarChart2}>
          <VBar bars={ageBars} height={152} />
        </ChCard>

        <ChCard title="Staff and Doctor Roles" Icon={PieChart}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DonutChart segments={roleSeg} size={152} strokeWidth={26} label={staffList.length + doctors.length} sublabel="Total Staff" />
          </div>
        </ChCard>
      </div>

      {/* Geographic / Pincode Distribution Chart Card - Donut Wheel + Location Heat Cards Model */}
      <div style={{ marginBottom: '1.2rem' }}>
        <ChCard title="Patient Geographic & Pincode Heatmap Analytics" Icon={MapPin}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', alignItems: 'center' }}>

            {/* Left: Donut Share Wheel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={18} /> Regional Patient Share (%)
              </div>
              <DonutChart segments={locationSegments} size={165} strokeWidth={26} label={patients.length} sublabel="Total Patients" />
            </div>

            {/* Right: Interactive Location Heat Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📍 TOP PATIENT LOCATIONS & PINCODES</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>● Normalized & Grouped</span>
              </div>

              {locationSegments.map((loc, idx) => {
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${loc.color}35`,
                      borderRadius: '12px',
                      padding: '0.85rem 1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      boxShadow: `0 4px 15px ${loc.color}10`,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: loc.color, display: 'inline-block', flexShrink: 0
                        }} />
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {loc.label}
                        </span>
                      </div>
                      <div>
                        <span style={{
                          background: loc.color, color: '#ffffff',
                          fontWeight: 900, fontSize: '0.82rem',
                          padding: '0.2rem 0.65rem', borderRadius: '12px'
                        }}>
                          {loc.value} Patients ({loc.pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${loc.pct}%`, minWidth: '8px', height: '100%',
                        background: `linear-gradient(90deg, ${loc.color}, ${loc.color}dd)`,
                        borderRadius: '6px', transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChCard>
      </div>

      {/* Payment Status — Full Width */}
      <ChCard title="Payment Collection Status" Icon={DollarSign}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
                <span style={{ fontWeight: 700, color: '#10b981' }}>✓ Paid Consultations</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{paid.length} / {patients.length}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 16, overflow: 'hidden' }}>
                <div style={{
                  width: patients.length ? `${(paid.length / patients.length) * 100}%` : '0%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: 8,
                  transition: 'width 0.7s ease'
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>✕ Unpaid / Pending</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{unpaid.length} / {patients.length}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 16, overflow: 'hidden' }}>
                <div style={{
                  width: patients.length ? `${(unpaid.length / patients.length) * 100}%` : '0%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444, #f87171)',
                  borderRadius: 8,
                  transition: 'width 0.7s ease'
                }} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
              {patients.length ? Math.round((paid.length / patients.length) * 100) : 0}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Collection Rate</div>
          </div>
        </div>
      </ChCard>
    </div>
  );
};

export default AdminAnalytics;
