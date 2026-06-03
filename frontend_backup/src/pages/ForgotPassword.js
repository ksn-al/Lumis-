import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiRequest('/auth/forgot-password', 'POST', { email });
      setMessage(res.message || 'Instructions sent to your email.');
      setSent(true);
    } catch (err) {
      setMessage(err.message || 'Error sending email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="forgot-password-icon">🔑</div>
          <h2 className="forgot-password-title">Forgot Password</h2>
          <p className="forgot-password-subtitle">
            Enter your email and we'll send reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="forgot-password-success">
            <span className="success-icon">✉️</span>
            <div className="forgot-password-message">{message}</div>
            <button className="forgot-password-back" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <input
              className="forgot-password-input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button className="forgot-password-button" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Instructions'}
            </button>
            {message && <div className="forgot-password-message error">{message}</div>}
            <button className="forgot-password-back" type="button" onClick={() => navigate(-1)}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
