import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api';
import Register from './Register';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Login() {
  const [email,            setEmail]           = useState('');
  const [password,         setPassword]        = useState('');
  const [message,          setMessage]         = useState('');
  const [remember,         setRemember]        = useState(false);
  const [showRegister,     setShowRegister]    = useState(false);
  const [loading,          setLoading]         = useState(false);
  const [unverified,       setUnverified]      = useState(false);
  const [resendMsg,        setResendMsg]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('rememberEmail');
    if (saved) { setEmail(saved); setRemember(true); }

    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth_failed') {
      setMessage('Google login failed. Please try again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setUnverified(false);
    setResendMsg('');
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password, rememberMe: remember });
      if (remember) localStorage.setItem('rememberEmail', email);
      else          localStorage.removeItem('rememberEmail');

      if (data.message?.toLowerCase().includes('success')) {
        navigate('/feed');
      } else {
        setMessage(data.message || 'Помилка входу');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('verify')) {
        setUnverified(true);
      }
      setMessage(msg || 'Помилка входу. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMsg('Sending...');
    try {
      await apiRequest('/auth/resend-verification', 'POST', { email });
      setResendMsg('Verification email sent! Check your inbox.');
    } catch {
      setResendMsg('Failed to resend. Try again later.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Login</h2>

        <button type="button" className="google-oauth-btn" onClick={handleGoogleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="oauth-divider">or</div>

        <input className="login-input" type="email"    placeholder="Email"
          value={email}    onChange={e => setEmail(e.target.value)}    required />
        <input className="login-input" type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} required />

        <label className="login-remember">
          <input
            className="login-remember-checkbox"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        <div style={{ margin: '4px 0' }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        <button className="login-button" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>

        {!showRegister && (
          <button className="register-show-button" type="button" onClick={() => setShowRegister(true)}>
            Register
          </button>
        )}

        {message && <div className="login-message">{message}</div>}
        {unverified && (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="login-button" onClick={handleResendVerification}>
              Resend verification email
            </button>
            {resendMsg && <div className="login-message">{resendMsg}</div>}
          </div>
        )}
      </form>

      {showRegister && (
        <div className="register-modal">
          <Register />
          <button className="register-close-button" type="button"
            onClick={() => setShowRegister(false)} style={{ marginTop: 8 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default Login;
