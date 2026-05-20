
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Favorite from "./pages/Favorite";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Search from "./pages/Search";
import Header from "./components/Header";
import Messages from "./pages/Messages"; 

// ...внутри <Routes>:


function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation();
  // Скрываем Header на страницах логина и регистрации 
  const authPages = ["/login", "/register", "/reset-password", "/forgot-password"];
  const hideHeader = authPages.includes(location.pathname);
  const isAuthPage = authPages.includes(location.pathname);
  return (
    <>
      {!hideHeader && <Header />}
      {isAuthPage ? (
        <div className="auth-bg">
          <div className="auth-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Login />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </>
  );
}

export default AppWrapper;

