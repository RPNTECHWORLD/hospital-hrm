import React, { useState } from 'react';
import loginPageLogo from '../assets/login page logo.png';
import { 
  User, 
  Lock, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowRight
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) return;
    
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId.trim(),
          email: userId.trim(), 
          password 
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Invalid User ID or Password.');
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

          <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
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
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>User ID</label>
              <div className="login-input-group">
                <User className="login-input-icon" size={18} />
                <input 
                  type="text" 
                  className="form-input login-input-with-icon" 
                  placeholder="Enter user ID or email"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
