import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api';
import Register from './Register';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [remember, setRemember] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const data = await apiRequest('/auth/login', 'POST', { email, password });
            setMessage(data.message);
            if (data.message && data.message.toLowerCase().includes('success')) {
                navigate('/feed');
            }
            // Remember me: сохраняем email в localStorage если отмечено
            if (remember) {
                localStorage.setItem('rememberEmail', email);
            } else {
                localStorage.removeItem('rememberEmail');
            }
        } catch (err) {
            setMessage("Помилка входу. Спробуйте ще раз.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form onSubmit={handleSubmit} className="login-form"> 
                <h2 className="login-title">Вхід</h2>
                <input className="login-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input className="login-input"
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label className="login-remember">
                    <input className="login-remember-checkbox"
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                    />
                    Запам'ятати мене
                </label>
                <div style={{ margin: "10px 0" }}>
                    <Link to="/forgot-password">Забули пароль?</Link>
                </div>
                <button className="login-button" type="submit" disabled={loading}>{loading ? "Завантаження..." : "Увійти"}</button>
                {!showRegister && (
                    <button className="register-show-button" type="button" onClick={() => setShowRegister(true)}>
                        Зареєструватися
                    </button>
                )}
                {message && <div className="login-message">{message}</div>}
            </form>
            {showRegister && (
                <div className="register-modal">
                    <Register />
                    <button className="register-close-button" type="button" onClick={() => setShowRegister(false)} style={{marginTop:8}}>Скасувати</button>
                </div>
            )}
        </div>
    );
}

export default Login;
