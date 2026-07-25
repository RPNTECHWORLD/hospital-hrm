import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Users, DollarSign, Bed, Activity, ClipboardList, Pill, ShieldAlert
} from 'lucide-react';
import './AnalyticsDashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="intro" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, icon, color }) => (
  <div className="kpi-card">
    <div className="kpi-icon-wrapper" style={{ background: `${color}15`, color: color }}>
      {icon}
    </div>
    <div className="kpi-content">
      <span className="kpi-label">{title}</span>
      <span className="kpi-value">{value}</span>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="chart-card">
    <div className="chart-header">
      <h3 className="chart-title">{title}</h3>
    </div>
    <div className="chart-wrapper">
      {children}
    </div>
  </div>
);

const AnalyticsDashboard = ({ patients, user, doctorsList, staffList }) => {
  const [trendFilter, setTrendFilter] = useState('14days'); // 'today', '3days', '14days', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Memoized derived data for performance
  const analyticsData = useMemo(() => {
    const data = {
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status !== 'Inactive').length,
      completedPatients: patients.filter(p => p.status === 'Completed').length,
      totalRevenue: patients.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0),
      patientsByStatus: [],
      patientsByDoctor: [],
      revenueByDay: [],
      bedOccupancy: { total: 20, occupied: 0, available: 20 }, // Assuming 20 beds from App.jsx BEDS_CONFIG length
      prescriptionsIssued: 0,
      prescriptionsPending: 0
    };

    // Calculate Status Distribution
    const statusCounts = {};
    patients.forEach(p => {
      if (p.status !== 'Inactive') {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      }
    });
    data.patientsByStatus = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

    // Calculate Doctor Load
    const docCounts = {};
    patients.forEach(p => {
      if (p.assignedDoctorId && p.status !== 'Inactive') {
        const doc = doctorsList.find(d => d.id === p.assignedDoctorId);
        const docName = doc ? doc.name.replace('Dr. ', '') : 'Unknown';
        docCounts[docName] = (docCounts[docName] || 0) + 1;
      }
    });
    data.patientsByDoctor = Object.keys(docCounts).map(key => ({ name: key, patients: docCounts[key] }));

    // Revenue by Registration Date (Simplified trend)
    const revByDate = {};
    patients.forEach(p => {
      if (p.registrationDate && p.paidAmount > 0) {
        revByDate[p.registrationDate] = (revByDate[p.registrationDate] || 0) + Number(p.paidAmount);
      }
    });
    data.revenueByDay = Object.keys(revByDate)
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(-7) // Last 7 days
      .map(date => ({ date: date.substring(0, 5), amount: revByDate[date] }));

    // Bed Occupancy
    const occupiedBeds = patients.filter(p => p.wardBedId && p.status !== 'Inactive').length;
    data.bedOccupancy = {
      occupied: occupiedBeds,
      available: 20 - occupiedBeds, // Hardcoded max beds to match mock
      total: 20
    };

    // Pharmacy Stats
    patients.forEach(p => {
      if (p.status === 'At Pharmacy') data.prescriptionsPending++;
      if (p.issuedMedication) data.prescriptionsIssued++;
    });

    return data;
  }, [patients, doctorsList]);

  // Determine what to show based on role
  const role = user?.role || 'staff';

  const renderAdminDashboard = () => (
    <>
      <div className="kpi-grid">
        <KPICard title="Total Patients" value={analyticsData.totalPatients} icon={<Users size={28} />} color="#1a2980" />
        <KPICard title="Total Revenue" value={`₹${analyticsData.totalRevenue.toLocaleString()}`} icon={<DollarSign size={28} />} color="#00C49F" />
        <KPICard title="Active Cases" value={analyticsData.activePatients} icon={<Activity size={28} />} color="#FF8042" />
        <KPICard title="Bed Occupancy" value={`${Math.round((analyticsData.bedOccupancy.occupied / analyticsData.bedOccupancy.total) * 100)}%`} icon={<Bed size={28} />} color="#8884d8" />
      </div>

      <div className="charts-grid">
        <ChartCard title="Revenue Trend (Last 7 Days)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.revenueByDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#00C49F" fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Patients by Doctor">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.patientsByDoctor} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="patients" fill="#1a2980" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Patient Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analyticsData.patientsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.patientsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );

  const renderDoctorDashboard = () => {
    // Filter doctor's specific data
    const myDoctorInfo = doctorsList.find(d => d.email === user.email);
    const myPatients = patients.filter(p => p.assignedDoctorId === myDoctorInfo?.id && p.status !== 'Inactive');
    const myCompleted = myPatients.filter(p => p.status === 'Completed').length;
    const myConsulting = myPatients.filter(p => p.status === 'Consulting').length;
    const myWaiting = myPatients.filter(p => p.status === 'Registered').length;
    const myReviewing = myPatients.filter(p => p.status === 'Reviewing').length;

    const myStatusData = [
      { name: 'Completed', value: myCompleted },
      { name: 'Consulting', value: myConsulting },
      { name: 'Waiting', value: myWaiting },
      { name: 'Reviewing', value: myReviewing }
    ];

    // Calculate Doctor Trend (Queue Status over time)
    const trendMap = {}; 
    myPatients.forEach(p => {
      // Helper to safely get MM/DD from a date string (assuming format like MM/DD/YYYY)
      const getDateStr = (dStr) => {
        try {
          // just take first 5 chars if it's MM/DD/YYYY
          return dStr.split(',')[0].substring(0, 5); 
        } catch(e) { return 'Unknown'; }
      };

      // Current visit
      if (p.registrationDate) {
        const dateStr = getDateStr(p.registrationDate);
        if (!trendMap[dateStr]) trendMap[dateStr] = { date: dateStr, completed: 0, consulting: 0, waiting: 0, reviewing: 0 };
        if (p.status === 'Completed' || p.status === 'Prescribed' || p.status === 'Dispensed') {
          trendMap[dateStr].completed++;
        } else if (p.status === 'Consulting') {
          trendMap[dateStr].consulting++;
        } else if (p.status === 'Reviewing') {
          trendMap[dateStr].reviewing++;
        } else {
          trendMap[dateStr].waiting++; // Registered, etc.
        }
      }
      
      // Past visits from history (assume completed since they are in the past)
      if (p.history && Array.isArray(p.history)) {
        p.history.forEach(visit => {
          if (visit.date && (visit.doctorName === myDoctorInfo?.name || visit.doctorName === myDoctorInfo?.name?.replace('Dr. ', ''))) {
            const dateStr = getDateStr(visit.date);
            if (!trendMap[dateStr]) trendMap[dateStr] = { date: dateStr, completed: 0, consulting: 0, waiting: 0, reviewing: 0 };
            trendMap[dateStr].completed++; 
          }
        });
      }
    });

    let allTrendData = Object.values(trendMap)
      .filter(t => t.date !== 'Unkno') // Filter out invalid
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply Filter
    let trendData = [...allTrendData];
    if (trendFilter === 'today') {
      const todayStr = new Date().toLocaleDateString().substring(0, 5);
      trendData = allTrendData.filter(t => t.date === todayStr);
    } else if (trendFilter === '3days') {
      trendData = allTrendData.slice(-3);
    } else if (trendFilter === '14days') {
      trendData = allTrendData.slice(-14);
    } else if (trendFilter === 'custom') {
      if (customStartDate && customEndDate) {
        // Date input is YYYY-MM-DD, convert to MM/DD or simple compare if we convert carefully
        // For simplicity, just convert custom dates to MM/DD
        const startStr = new Date(customStartDate).toLocaleDateString().substring(0, 5);
        const endStr = new Date(customEndDate).toLocaleDateString().substring(0, 5);
        
        // This is a rough filter just checking string values between start and end (assuming within same year for simple MM/DD sort)
        trendData = allTrendData.filter(t => {
          const tDate = new Date(new Date().getFullYear() + '/' + t.date);
          const sDate = new Date(new Date().getFullYear() + '/' + startStr);
          const eDate = new Date(new Date().getFullYear() + '/' + endStr);
          return tDate >= sDate && tDate <= eDate;
        });
      }
    }

    // Ensure we always have at least 2 points to draw a line in Recharts
    if (trendData.length === 0) {
      trendData = [
        { date: 'Start', completed: 0, consulting: 0, waiting: 0, reviewing: 0 },
        { date: new Date().toLocaleDateString().substring(0, 5), completed: 0, consulting: 0, waiting: 0, reviewing: 0 }
      ];
    } else if (trendData.length === 1) {
      if (trendFilter === 'today') {
        trendData = [
          { date: 'Start', completed: 0, consulting: 0, waiting: 0, reviewing: 0 },
          ...trendData
        ];
      } else {
        trendData = [
          { date: 'Prev', completed: 0, consulting: 0, waiting: 0, reviewing: 0 },
          ...trendData
        ];
      }
    }

    return (
      <>
        <div className="kpi-grid">
          <KPICard title="My Active Patients" value={myPatients.length} icon={<Users size={28} />} color="#1a2980" />
          <KPICard title="Completed Today" value={myCompleted} icon={<Activity size={28} />} color="#00C49F" />
          <KPICard title="Waiting" value={myWaiting} icon={<ClipboardList size={28} />} color="#FF8042" />
          <KPICard title="Reviewing" value={myReviewing} icon={<Activity size={28} />} color="#FFBB28" />
        </div>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="chart-title" style={{ margin: 0 }}>Patient Queue Trend</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  className="form-control" 
                  style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                  value={trendFilter}
                  onChange={(e) => setTrendFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="3days">Last 3 Days</option>
                  <option value="14days">Last 14 Days</option>
                  <option value="custom">Custom Date (Calendar)</option>
                </select>

                {trendFilter === 'custom' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" tick={{fill: '#666'}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis tick={{fill: '#666'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#0088FE" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="consulting" name="Consulting" stroke="#00C49F" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="waiting" name="Waiting" stroke="#FF8042" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="reviewing" name="Reviewing" stroke="#FFBB28" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPharmacyDashboard = () => (
    <>
      <div className="kpi-grid">
        <KPICard title="Total Prescriptions Handled" value={analyticsData.prescriptionsIssued + analyticsData.prescriptionsPending} icon={<ClipboardList size={28} />} color="#1a2980" />
        <KPICard title="Pending Dispensation" value={analyticsData.prescriptionsPending} icon={<ShieldAlert size={28} />} color="#FF8042" />
        <KPICard title="Medications Issued" value={analyticsData.prescriptionsIssued} icon={<Pill size={28} />} color="#00C49F" />
      </div>
      <div className="charts-grid">
        <ChartCard title="Pharmacy Workload">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Issued', value: analyticsData.prescriptionsIssued },
                  { name: 'Pending', value: analyticsData.prescriptionsPending }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#00C49F" />
                <Cell fill="#FF8042" />
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );

  const renderWardDashboard = () => {
    const bedData = [
      { name: 'Occupied', value: analyticsData.bedOccupancy.occupied },
      { name: 'Available', value: analyticsData.bedOccupancy.available }
    ];

    return (
      <>
        <div className="kpi-grid">
          <KPICard title="Total Beds" value={analyticsData.bedOccupancy.total} icon={<Bed size={28} />} color="#1a2980" />
          <KPICard title="Occupied Beds" value={analyticsData.bedOccupancy.occupied} icon={<Users size={28} />} color="#FF8042" />
          <KPICard title="Available Beds" value={analyticsData.bedOccupancy.available} icon={<Activity size={28} />} color="#00C49F" />
        </div>
        <div className="charts-grid">
          <ChartCard title="Bed Occupancy Rate">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#FF8042" />
                  <Cell fill="#00C49F" />
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </>
    );
  }

  // Fallback for Receptionist or other roles
  const renderGeneralDashboard = () => (
    <>
       <div className="kpi-grid">
        <KPICard title="Today's Registrations" value={analyticsData.activePatients} icon={<Users size={28} />} color="#1a2980" />
        <KPICard title="Total Revenue" value={`₹${analyticsData.totalRevenue.toLocaleString()}`} icon={<DollarSign size={28} />} color="#00C49F" />
      </div>
       <div className="charts-grid">
        <ChartCard title="Patient Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.patientsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#1a2980" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Analytics Dashboard</h2>
          <p className="analytics-subtitle">Welcome back, {user?.name}. Here is your role-specific overview.</p>
        </div>
      </div>
      
      {role === 'admin' && renderAdminDashboard()}
      {role === 'doctor' && renderDoctorDashboard()}
      {role === 'pharmacy' && renderPharmacyDashboard()}
      {role === 'ward' && renderWardDashboard()}
      {['receptionist', 'injection', 'lab'].includes(role) && renderGeneralDashboard()}
      
    </div>
  );
};

export default AnalyticsDashboard;
