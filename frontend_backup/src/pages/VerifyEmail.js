import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function VerifyEmail() {
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/verify?token=${token}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.message && data.message.toLowerCase().includes('verified')) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [navigate]);

  return (
    <div className="auth-bg">
      <div className="auth-container">
        <div className="login-page">
          {status === 'loading' && <p>Verifying your email...</p>}
          {status === 'success' && (
            <p>Email verified successfully! Redirecting to login...</p>
          )}
          {status === 'error' && (
            <p>Invalid or expired verification link.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
