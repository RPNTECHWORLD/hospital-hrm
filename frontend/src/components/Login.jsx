import React, { useState } from 'react';
import loginPageLogo from '../assets/login page logo.png';
import { 
  Stethoscope, 
  User, 
  Lock, 
  ShieldAlert, 
  Mail, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Building2, 
  Pill, 
  Bed, 
  Syringe, 
  Microscope,
  ArrowRight
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('receptionist');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const quickRoles = [
    { role: 'admin', email: 'admin@vijayas.com', label: 'Admin', icon: Building2, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', desc: 'All Modules' },
    { role: 'receptionist', email: 'receptionist@vijayas.com', label: 'Reception', icon: UserCheck, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', desc: 'Registration' },
    { role: 'doctor', email: 'doctor1@vijayas.com', label: 'Dr. Vijayan', icon: Stethoscope, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', desc: 'OPD Doctor' },
    { role: 'doctor', email: 'doctor2@vijayas.com', label: 'Dr. Sarah', icon: Stethoscope, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', desc: 'Pediatrics' },
    { role: 'pharmacy', email: 'pharmacy1@vijayas.com', label: 'Pharmacy 1', icon: Pill, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', desc: 'Meds & Stock' },
    { role: 'pharmacy', email: 'pharmacy2@vijayas.com', label: 'Pharmacy 2', icon: Pill, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', desc: 'Billing' },
    { role: 'ward', email: 'ward@vijayas.com', label: 'Ward Staff', icon: Bed, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', desc: 'Bed Admission' },
    { role: 'injection', email: 'injection@vijayas.com', label: 'Injection Desk', icon: Syringe, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', desc: 'Nurse Station' },
    { role: 'lab', email: 'lab@vijayas.com', label: 'Lab Staff', icon: Microscope, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)', desc: 'Investigations' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Invalid email, password or role selection.');
      }
    } catch (err) {
      setError('Connection error. Please check if the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (selectedRole, defaultEmail) => {
    setRole(selectedRole);
    setEmail(defaultEmail);
    setPassword('password123');
    
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: defaultEmail,
          password: 'password123',
          role: selectedRole
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        setError('Quick login failed to authenticate with the server.');
      }
    } catch (err) {
      setError('Connection error. Please check if the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Dynamic Ambient Glow Effects */}
      <div className="login-glow-bg login-glow-1"></div>
      <div className="login-glow-bg login-glow-2"></div>

      <div className="login-wrapper fade-in">
        {/* Single Centered Login Card */}
        <div className="login-card" style={{ position: 'relative' }}>
          {/* Top Left Corner Logo */}
          <img 
            src="/vijayas-logo.png" 
            alt="Vijaya's Health Care Logo" 
            className="login-top-left-logo"
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '1.5rem',
              maxHeight: '42px',
              maxWidth: '130px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))'
            }} 
          />

          <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingTop: '0.5rem' }}>
            <img 
              src={loginPageLogo} 
              alt="Hospital Management System Logo" 
              className="login-logo-img"
              style={{
                maxHeight: '115px',
                maxWidth: '100%',
                objectFit: 'contain',
                margin: '0 auto 0 auto',
                display: 'block',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
              }} 
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.15rem 0 0 0' }}>
              Hospital Management System Portal
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(227, 30, 36, 0.08)',
              border: '1px solid rgba(227, 30, 36, 0.25)',
              color: 'var(--accent)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.88rem',
              textAlign: 'left'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Select Role</label>
              <div className="login-input-group">
                <UserCheck className="login-input-icon" size={18} />
                <select 
                  className="form-input login-input-with-icon" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  style={{ fontWeight: 600 }}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacy">Pharmacy Staff</option>
                  <option value="ward">Ward Room Staff</option>
                  <option value="injection">Injection Room Staff</option>
                  <option value="lab">Lab / Investigation Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Address</label>
              <div className="login-input-group">
                <Mail className="login-input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-input login-input-with-icon" 
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
              <div className="login-input-group">
                <Lock className="login-input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input login-input-with-icon" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button 
                  type="button" 
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.85rem', 
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 16px rgba(227, 30, 36, 0.25)'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : <>Sign In to Portal <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="login-footer-credit">
            Developed by <span>RPN Tech World</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
