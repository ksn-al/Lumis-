import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Favorite from './pages/Favorite';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Search from './pages/Search';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import VerifyEmail from './pages/VerifyEmail';
import { apiRequest } from './api';

function PrivateRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    apiRequest('/users/me')
      .then(() => setAuth(true))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return null;
  if (auth === false) return <Navigate to="/login" replace />;
  return children;
}

const AUTH_PAGES = ['/login', '/register', '/reset-password', '/forgot-password', '/auth/verify'];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/`, { credentials: 'include' }).catch(() => {});
    ping(); // wake up immediately on app load
    const id = setInterval(ping, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(id);
  }, []);
}

function App() {
  const location = useLocation();
  const isAuthPage = AUTH_PAGES.some(p => location.pathname.startsWith(p));
  useKeepAlive();

  return (
    <>
     
      {isAuthPage ? (
        <Routes>
          <Route path="/login"          element={<div className="auth-bg"><div className="auth-container"><Login /></div></div>} />
          <Route path="/register"       element={<div className="auth-bg"><div className="auth-container"><Register /></div></div>} />
          <Route path="/forgot-password" element={<div className="auth-bg"><div className="auth-container"><ForgotPassword /></div></div>} />
          <Route path="/reset-password"  element={<div className="auth-bg"><div className="auth-container"><ResetPassword /></div></div>} />
          <Route path="/auth/verify"    element={<VerifyEmail />} />
          <Route path="*"               element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
      
        <SocketProvider>
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="dark"
          />
          <Header />
          <div className="app-layout">
            <Sidebar />
            <main className="app-main">
              <Routes>
                <Route path="/feed"             element={<PrivateRoute><Feed /></PrivateRoute>} />
                <Route path="/favorite"         element={<PrivateRoute><Favorite /></PrivateRoute>} />
                <Route path="/profile"          element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/profile/:username" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/search"           element={<PrivateRoute><Search /></PrivateRoute>} />
                <Route path="/messages"       element={<PrivateRoute><Messages /></PrivateRoute>} />
                <Route path="/notifications"  element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="*"               element={<Navigate to="/feed" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      )}
    </>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
