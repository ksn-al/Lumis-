import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, Heart, MessageCircle, CheckCheck, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TYPE_META = {
  new_follower: { icon: UserPlus,      label: 'started following you',  color: 'purple' },
  new_message:  { icon: MessageCircle, label: 'sent you a message',      color: 'blue'   },
  new_like:     { icon: Heart,         label: 'liked your post',         color: 'pink'   },
  new_post:     { icon: FileText,      label: 'published a new post',    color: 'green'  },
};

function NotifAvatar({ user }) {
  const src = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`)
    : null;
  return src
    ? <img src={src} alt="avatar" className="notif-avatar" />
    : <div className="notif-avatar notif-avatar-placeholder">
        {(user?.displayname || user?.username || '?')[0]?.toUpperCase()}
      </div>;
}

function Notifications() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const navigate  = useNavigate();

  // Load initial notifications
  useEffect(() => {
    apiRequest('/notifications')
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  // Real-time: subscribe via shared socket
  useEffect(() => {
    if (!socket) return;
    const handleNotif = (notif) => {
      setNotifications(prev => {
        if (notif.id && prev.some(n => n.id === notif.id)) return prev;
        return [{
          ...notif,
          id:        notif.id        || `tmp-${Date.now()}`,
          read:      notif.read      ?? false,
          createdAt: notif.createdAt || new Date().toISOString(),
        }, ...prev];
      });
    };
    socket.on('new-notification', handleNotif);
    return () => socket.off('new-notification', handleNotif);
  }, [socket]);

  const markAllRead = async () => {
    await apiRequest('/notifications/read-all', 'PATCH').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await apiRequest(`/notifications/${notif.id}/read`, 'PATCH').catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.type === 'new_follower') navigate(`/profile/${notif.fromUser?.username}`);
    else if (notif.type === 'new_message') navigate('/messages');
    else if (notif.type === 'new_like') navigate(`/profile/${notif.fromUser?.username}`);
    else if (notif.type === 'new_post') navigate(`/profile/${notif.fromUser?.username}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-page">
      <div className="notif-header-row">
        <h2 className="notif-title">
          <Bell size={22} />
          Notifications
          {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
        </h2>
        {unreadCount > 0 && (
          <button className="notif-mark-all-btn" onClick={markAllRead}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="notif-loading">
          <div className="spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <Bell size={48} className="notif-empty-icon" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <ul className="notif-list">
          {notifications.map(notif => {
            const meta = TYPE_META[notif.type] || TYPE_META.new_follower;
            const Icon = meta.icon;
            return (
              <li
                key={notif.id}
                className={`notif-item${notif.read ? '' : ' notif-item--unread'} notif-item--${meta.color}`}
                onClick={() => handleNotifClick(notif)}
              >
                <div className="notif-icon-wrap">
                  <Icon size={16} />
                </div>
                <NotifAvatar user={notif.fromUser} />
                <div className="notif-content">
                  <span className="notif-username">
                    {notif.fromUser?.displayname || notif.fromUser?.username || 'Someone'}
                  </span>
                  <span className="notif-label"> {meta.label}</span>
                  <div className="notif-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
                {!notif.read && <div className="notif-unread-dot" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Notifications;
