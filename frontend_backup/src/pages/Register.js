import React, { useState } from 'react';
import { apiRequest } from '../api';


function Register() {
    const [username, setUsername] = useState('');
    const [displayname, setDisplayname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    function validateEmail(email) {
        // Простая email-валидация
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        if (!validateEmail(email)) {
            setMessage("Некоректний email");
            return;
        }
        setLoading(true);
        try {
            const data = await apiRequest('/auth/register', 'POST', { username, displayname, email, password });
            setMessage(data.message);
            if (data.message && data.message.toLowerCase().includes('успішно')) {
                setUsername("");
                setDisplayname("");
                setEmail("");
                setPassword("");
            }
        } catch (err) {
            setMessage("Помилка реєстрації. Спробуйте ще раз.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="register-title">Реєстрація</h2>
            <input className="register-input"
                type="text"
                placeholder="Ім'я користувача"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input className="register-input"
                type="text"
                placeholder="Відображуване ім'я"
                value={displayname}
                onChange={(e) => setDisplayname(e.target.value)}
                required
            />
            <input className="register-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input className="register-input"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button className="register-button" type="submit" disabled={loading}>{loading ? "Завантаження..." : "Зареєструватися"}</button>
            {message && <div className="register-message">{message}</div>}
        </form>
    );
}

export default Register;
