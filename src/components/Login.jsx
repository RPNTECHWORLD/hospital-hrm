import React, { useState } from 'react';
import { Stethoscope, User, Lock, Activity, ShieldAlert } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('receptionist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
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

  const handleQuickLogin = async (selectedRole, defaultEmail, customName) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
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
      <div className="card login-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ display: 'inline-flex', marginBottom: '1rem', padding: '0.75rem' }}>
            <Stethoscope size={32} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            eDoc <span className="logo-sub">HMS</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Hospital Management System</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(227, 30, 36, 0.08)',
            border: '1px solid rgba(227, 30, 36, 0.2)',
            color: 'var(--accent)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Role</label>
            <select 
              className="form-input" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="receptionist">Receptionist</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy Staff</option>
              <option value="ward">Ward Room Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Sign In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '2rem 0 1rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ 
            background: 'var(--bg-dark)', 
            padding: '0 0.75rem', 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)',
            zIndex: 1,
            position: 'relative'
          }}>
            OR QUICK TEST LOGIN
          </span>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            right: 0, 
            height: '1px', 
            background: 'var(--border)', 
            zIndex: 0 
          }}/>
        </div>

        <div className="quick-login-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('admin', 'admin@vijayas.com', 'System Admin')}
            style={{ borderColor: 'var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}
          >
            <div className="quick-login-role" style={{ color: 'var(--primary)' }}>Admin</div>
            <div className="quick-login-desc">All Modules</div>
          </button>

          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('receptionist', 'receptionist@vijayas.com', 'Receptionist')}
          >
            <div className="quick-login-role">Receptionist</div>
            <div className="quick-login-desc">1 User</div>
          </button>
          
          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('doctor', 'doctor1@vijayas.com', 'Dr. Vijayan')}
          >
            <div className="quick-login-role">Dr. Vijayan</div>
            <div className="quick-login-desc">Doctor 1</div>
          </button>

          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('doctor', 'doctor2@vijayas.com', 'Dr. Sarah')}
          >
            <div className="quick-login-role">Dr. Sarah</div>
            <div className="quick-login-desc">Doctor 2</div>
          </button>

          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('pharmacy', 'pharmacy1@vijayas.com', 'Pharmacy Staff 1')}
          >
            <div className="quick-login-role">Pharmacy 1</div>
            <div className="quick-login-desc">Staff User</div>
          </button>

          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('pharmacy', 'pharmacy2@vijayas.com', 'Pharmacy Staff 2')}
          >
            <div className="quick-login-role">Pharmacy 2</div>
            <div className="quick-login-desc">Staff User</div>
          </button>

          <button 
            className="quick-login-btn"
            onClick={() => handleQuickLogin('ward', 'ward@vijayas.com', 'Ward Staff')}
          >
            <div className="quick-login-role">Ward Staff</div>
            <div className="quick-login-desc">1 User</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
