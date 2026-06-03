import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiRequest } from '../api';
import { useSocket } from '../context/SocketContext';
import {
  Home,
  User,
  MessageCircle,
  Bookmark,
  Search,
  Bell,
  LogOut,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const socket = useSocket();
  const [user, setUser]                   = useState(null);
  const [unreadNotifs,   setUnreadNotifs]   = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    apiRequest('/users/me')
      .then(data => {
        if (!data.user) return;
        setUser(data.user);
        apiRequest('/notifications/unread-count')
          .then(d => setUnreadNotifs(d.count || 0))
          .catch(() => {});
        apiRequest('/messages/unread-count')
          .then(d => setUnreadMessages(d.count || 0))
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNotif = (notif) => {
      if (notif?.type !== 'new_message') {
        setUnreadNotifs(prev => prev + 1);
        if (notif?.type === 'new_follower') {
          toast(`🔔 ${notif.fromUser?.name || 'Кто-то'} подписался на тебя`);
        } else if (notif?.type === 'new_like') {
          toast(`❤️ ${notif.fromUser?.name || 'Кто-то'} лайкнул твой пост`);
        } else if (notif?.type === 'new_post') {
          toast(`📝 ${notif.fromUser?.name || 'Кто-то'} опубликовал новый пост`);
        }
      }
    };
    const handleMessage = (msg) => {
      setUnreadMessages(prev => prev + 1);
      toast(`💬 ${msg.sender?.name || 'Новое сообщение'}`);
    };
    const handleReconnect = () => {
      apiRequest('/notifications/unread-count').then(d => setUnreadNotifs(d.count || 0)).catch(() => {});
      apiRequest('/messages/unread-count').then(d => setUnreadMessages(d.count || 0)).catch(() => {});
    };
    socket.on('new-notification', handleNotif);
    socket.on('new-message',      handleMessage);
    socket.on('connect',          handleReconnect);
    return () => {
      socket.off('new-notification', handleNotif);
      socket.off('new-message',      handleMessage);
      socket.off('connect',          handleReconnect);
    };
  }, [socket]);

  const handleLogout = async () => {
    try { await apiRequest('/auth/logout', 'POST'); } catch {}
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadNotifs(0);
    }
    if (location.pathname === '/messages' || location.pathname.startsWith('/messages/')) {
      setUnreadMessages(0);
    }
  }, [location.pathname]);

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`)
    : null;

  const isActive = (to) => {
    if (to === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
    }
    return location.pathname === to;
  };

  const NAV_ITEMS = [
    { to: '/feed',          label: 'Feed',          Icon: Home },
    { to: '/profile',       label: 'Profile',       Icon: User },
    { to: '/messages',      label: 'Messages',      Icon: MessageCircle, badge: unreadMessages },
    { to: '/notifications', label: 'Notifications', Icon: Bell,          badge: unreadNotifs },
    { to: '/favorite',      label: 'Favorites',     Icon: Bookmark },
    { to: '/search',        label: 'Search',        Icon: Search },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">✦ Lumis</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, Icon, badge }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link${isActive(to) ? ' active' : ''}`}
          >
            <Icon size={20} className="sidebar-icon" />
            <span className="sidebar-label">{label}</span>
            {badge > 0 && (
              <span className="sidebar-notif-badge">{badge > 99 ? '99+' : badge}</span>
            )}
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <Link to="/profile" className="sidebar-user">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="sidebar-avatar" />
          ) : (
            <div className="sidebar-avatar-placeholder">
              {(user?.displayname || user?.username || '?')[0]?.toUpperCase()}
            </div>
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-displayname">
              {user?.displayname || user?.username || 'User'}
            </span>
            <span className="sidebar-username">@{user?.username || '…'}</span>
          </div>
        </Link>

        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
