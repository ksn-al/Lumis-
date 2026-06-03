import React, { useState } from 'react';
import { apiRequest } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

function Register() {
  const [username,    setUsername]    = useState('');
  const [displayname, setDisplayname] = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [message,     setMessage]     = useState('');
  const [isSuccess,   setIsSuccess]   = useState(false);
  const [loading,     setLoading]     = useState(false);

  const pwStrength = password.length === 0 ? '' :
    password.length < 6 ? 'weak' :
    password.length < 10 ? 'medium' : 'strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMessage('Invalid email');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/register', 'POST', { username, displayname, email, password });
      setMessage(data.message);
      if (data.message?.toLowerCase().includes('зареєстровано') || data.message?.toLowerCase().includes('success')) {
        setIsSuccess(true);
        setUsername(''); setDisplayname(''); setEmail(''); setPassword('');
      }
    } catch (err) {
      setMessage(err.message || 'Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2 className="register-title">Create Account</h2>
      <button type="button" className="google-oauth-btn" onClick={handleGoogleLogin}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="oauth-divider">or</div>

      <input className="register-input" type="text"     placeholder="Username"
        value={username}    onChange={e => setUsername(e.target.value)}    required />
      <input className="register-input" type="text"     placeholder="Display Name"
        value={displayname} onChange={e => setDisplayname(e.target.value)} required />
      <input className="register-input" type="email"    placeholder="Email"
        value={email}       onChange={e => setEmail(e.target.value)}       required />
      <input className="register-input" type="password" placeholder="Password"
        value={password}    onChange={e => setPassword(e.target.value)}    required />

      {pwStrength && (
        <div className="password-strength">
          <div className={`password-strength__bar password-strength__bar--${pwStrength}`} />
        </div>
      )}

      <button className="register-button" type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Account'}
      </button>

      {message && (
        <div className={`register-message${isSuccess ? ' success' : ''}`}>{message}</div>
      )}
    </form>
  );
}

export default Register;
