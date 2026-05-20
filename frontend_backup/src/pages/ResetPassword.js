import React, { useState } from "react";
import { apiRequest } from "../api";  

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = await apiRequest('/auth/forgot-password', 'POST', { email });
    setMessage(data.message || "Якщо email існує, лист надіслано");
    setLoading(false);
  };

 return (
  <div className="forgot-password-page">
    <div className="forgot-password-card">
      <div className="forgot-password-header">
        <div className="forgot-password-icon">🔒</div>

        <h2 className="forgot-password-title">
          Відновлення пароля
        </h2>

        <p className="forgot-password-subtitle">
          Введіть email, і ми надішлемо інструкції
        </p>
      </div>

      <form onSubmit={handleSubmit} className="forgot-password-form">
        <input
          className="forgot-password-input"
          type="email"
          placeholder="Введіть email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <button
          className="forgot-password-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Надсилання..." : "Надіслати інструкції"}
        </button>
      </form>

      {message && (
        <div className="forgot-password-message">
          {message}
        </div>
      )}
    </div>
  </div>
);
}

export default ResetPassword;
