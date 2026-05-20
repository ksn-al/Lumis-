import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await apiRequest("/auth/forgot-password", "POST", { email });
      setMessage(res.message || "Інструкції надіслано на email, якщо він зареєстрований.");
    } catch (err) {
      setMessage(err.message || "Помилка відправки листа");
    }
    setLoading(false);
  };

  return (
  <div className="forgot-password-page">
    <form onSubmit={handleSubmit} className="forgot-password-form">
      <h2 className="forgot-password-title">Відновлення пароля</h2>

      <input
        className="forgot-password-input"
        type="email"
        placeholder="Введіть email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      <button className="forgot-password-button" type="submit" disabled={loading}>
        {loading ? "Надсилання..." : "Надіслати інструкції"}
      </button>

      {message && <div className="forgot-password-message">{message}</div>}
        <button className="forgot-password-back" type="button" onClick={() => navigate(-1)}>
          Назад
        </button>
      </form>
  </div>
);
}

export default ForgotPassword;
