
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import { UserIcon } from "./Icons";



const Header = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			setError("");
			try {
				const data = await apiRequest("/users/me");
				if (data.user) setUser(data.user);
				else setUser(null);
			} catch (e) {
				setUser(null);
				setError(e.message || "Помилка завантаження користувача");
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, []);

	const handleLogout = async () => {
		localStorage.clear();
		try {
			await apiRequest("/auth/logout", "POST");
		} catch {}
		document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		navigate("/login");
	};

	const handleSearch = (e) => {
		e.preventDefault();
		const query = e.target.elements.search.value.trim();
		if (query) {
			navigate(`/search?query=${encodeURIComponent(query)}`);
		}
	};

	return (
		<header className="app-header">
			<nav className="app-nav">
				<Link to="/feed">Лента</Link>
				<Link to="/favorite">Обране</Link>
				<Link to="/messages">Повідомлення</Link>
				<Link to="/profile" title="Профіль" style={{display: 'flex', alignItems: 'center', gap: 6}}>
					<UserIcon style={{width: 22, height: 22}} />
				</Link>
			</nav>
			<form onSubmit={handleSearch} className="search-form">
				<input className="search-input" type="text" name="search" placeholder="Пошук..." />
				<button className="search-button" type="submit">Знайти</button>
			</form>
			{loading && <div className="header-loading">Завантаження...</div>}
			{error && <div className="header-error">{error}</div>}
			{user && !loading && (
				<div className="header-user-info">
					{user.avatar && <img src={user.avatar} alt="avatar" className="header-avatar" />}
					<span className="header-username">{user.displayname || user.username}</span>
				</div>
			)}
			<button onClick={handleLogout} className="logout-button">Вийти</button>
		</header>
	);
};

export default Header;
