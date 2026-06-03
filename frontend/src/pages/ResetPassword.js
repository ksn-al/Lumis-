import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
    setEmail(params.get('email') || '');
  }, []);

  const pwStrength = password.length === 0 ? '' : password.length < 6 ? 'weak' : password.length < 10 ? 'medium' : 'strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (password !== confirm) {
      setMessage("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/reset-password', 'POST', { email, token, newPassword: password });
      setMessage(data.message || 'Password updated!');
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setMessage(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="forgot-password-icon">🔒</div>
          <h2 className="forgot-password-title">New Password</h2>
          <p className="forgot-password-subtitle">
            Create a strong new password for your account.
          </p>
        </div>

        {isSuccess ? (
          <div className="forgot-password-success">
            <span className="success-icon">✅</span>
            <div className="forgot-password-message">{message}</div>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <input
              className="forgot-password-input"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="forgot-password-input"
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {pwStrength && (
              <div className="password-strength">
                <div className={`password-strength__bar password-strength__bar--${pwStrength}`} />
              </div>
            )}
            <input
              className="forgot-password-input"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button className="forgot-password-button" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
            {message && (
              <div className={`forgot-password-message${isSuccess ? '' : ' error'}`}>
                {message}
              </div>
            )}
            <button className="forgot-password-back" type="button" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
