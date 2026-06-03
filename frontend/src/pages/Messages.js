import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiRequest } from '../api';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';
import { Send, ChevronUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Messages() {
  const [conversations, setConversations]             = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages]                       = useState([]);
  const [newMessage, setNewMessage]                   = useState('');
  const [loading, setLoading]                         = useState(false);
  const [loadingOlder, setLoadingOlder]               = useState(false);
  const [error, setError]                             = useState('');
  const [currentUserId, setCurrentUserId]             = useState(null);
  const [nextCursor, setNextCursor]                   = useState(null);  

  const socket             = useSocket();
  const selectedConvRef    = useRef(null);   
  const messagesEndRef     = useRef(null);   
  const messagesListRef    = useRef(null);   
  const suppressScrollRef  = useRef(false); 

  const location = useLocation();
  const params   = new URLSearchParams(location.search);
  const toUsername = params.get('to');

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (!suppressScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    apiRequest('/users/me')
      .then(data => { if (data.user) setCurrentUserId(data.user.id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (msg.conversationId === selectedConvRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations(prev =>
        prev.map(c =>
          c.id === msg.conversationId ? { ...c, messages: [msg] } : c
        )
      );
    };
    socket.on('new-message', handleNewMessage);
    const handleReconnect = () => {
      apiRequest('/messages/conversations')
        .then(data => setConversations(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('connect', handleReconnect);
    };
  }, [socket]);

  
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/messages/conversations');
        setConversations(data);
      } catch (e) {
        setConversations([]);
        setError(e.message || 'Помилка завантаження чатів');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (toUsername && conversations.length) {
      const conv = conversations.find(c =>
        c.participants.some(u => u.username === toUsername)
      );
      if (conv) setSelectedConversation(conv.id);
    }
  }, [toUsername, conversations]);

  useEffect(() => {
    if (!selectedConversation) return;
    const fetchMessages = async () => {
      setLoading(true);
      setError('');
      setNextCursor(null);
      try {
        const data = await apiRequest(
          `/messages/conversations/${selectedConversation}/messages`
        );
        setMessages(data.messages ?? data);          
        setNextCursor(data.nextCursor ?? null);

        apiRequest(`/messages/conversations/${selectedConversation}/read`, 'POST')
          .catch(() => {});
      } catch (e) {
        setMessages([]);
        setError(e.message || 'Помилка завантаження повідомлень');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

 
  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder || !selectedConversation) return;
    setLoadingOlder(true);

    const container    = messagesListRef.current;
    const scrollBefore = container ? container.scrollHeight : 0;

    try {
      const data = await apiRequest(
        `/messages/conversations/${selectedConversation}/messages?before=${encodeURIComponent(nextCursor)}`
      );
      const older = data.messages ?? data;

      suppressScrollRef.current = true;
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        return [...older.filter(m => !existingIds.has(m.id)), ...prev];
      });
      setNextCursor(data.nextCursor ?? null);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - scrollBefore;
        }
        suppressScrollRef.current = false;
      });
    } catch (e) {
      setError(e.message || 'Помилка завантаження старих повідомлень');
    } finally {
      setLoadingOlder(false);
    }
  }, [nextCursor, loadingOlder, selectedConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    setError('');
    try {
      const msg = await apiRequest(
        `/messages/conversations/${selectedConversation}/messages`,
        'POST',
        { text: newMessage }
      );
      setMessages(prev => [...prev, msg]);
      setConversations(prev =>
        prev.map(c => c.id === selectedConversation ? { ...c, messages: [msg] } : c)
      );
      setNewMessage('');
    } catch (e) {
      setError(e.message || 'Помилка надсилання повідомлення');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversationSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const { conversation, message } = await apiRequest('/messages/new', 'POST', {
        to: toUsername,
        text: newMessage,
      });
      setNewMessage('');
      if (message) setMessages([message]);

      const updated = await apiRequest('/messages/conversations');
      setConversations(updated);
      if (conversation?.id) setSelectedConversation(conversation.id);
    } catch (e) {
      setError(e.message || 'Помилка надсилання');
    }
  };

  const getOtherParticipant = (conv) =>
    conv.participants.find(u => u.id !== currentUserId) || conv.participants[0];

  const getAvatarSrc = (user) => {
    if (!user?.avatar) return null;
    return user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`;
  };

  return (
    <div className="messages-page">
      <div className="conversations-list">
        <div className="conversations-header">Messages</div>
        {error && <div className="error-message">{error}</div>}
        {loading && !selectedConversation && (
          <div className="loading-message">Loading...</div>
        )}
        <ul className="conversations-items">
          {conversations.map(conv => {
            const other     = getOtherParticipant(conv);
            const avatarSrc = getAvatarSrc(other);
            return (
              <li
                key={conv.id}
                className={`conversation-item${selectedConversation === conv.id ? ' active' : ''}`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="conversation-avatar">
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" />
                    : (other?.displayname?.[0] || other?.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {other?.displayname || other?.username}
                  </div>
                  <div className="conversation-last-message">
                    {conv.messages?.[0]?.text || 'No messages'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="conversation-messages">
        {selectedConversation ? (
          <>
            <div className="messages-list" ref={messagesListRef}>
              {nextCursor && (
                <div className="messages-load-older">
                  <button
                    className="messages-load-older-btn"
                    onClick={loadOlderMessages}
                    disabled={loadingOlder}
                  >
                    <ChevronUp size={14} style={{ marginRight: 4 }} />
                    {loadingOlder ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.map(msg => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`message-item${isMe ? ' message-item-me' : ''}`}>
                    {!isMe && (
                      <div className="message-author">
                        {msg.sender?.displayname || msg.sender?.username}
                      </div>
                    )}
                    <div className="message-text">{msg.text}</div>
                    <div className="message-date">
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="message-input-form">
              <input
                className="message-input"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                autoComplete="off"
              />
              <button className="message-send-button" type="submit" disabled={loading}>
                <Send size={16} style={{ marginRight: 6 }} />
                Send
              </button>
            </form>
          </>
        ) : toUsername ? (
          <div className="new-conversation-wrapper">
            <div className="new-conversation-header">
              <div className="conversation-avatar">
                {toUsername?.[0]?.toUpperCase()}
              </div>
              <div className="new-conversation-user">@{toUsername}</div>
            </div>
            <div className="new-conversation-empty">Start a new conversation</div>
            <form className="message-input-form" onSubmit={handleNewConversationSend}>
              <input
                className="message-input"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={`Message @${toUsername}`}
                autoComplete="off"
              />
              <button className="message-send-button" type="submit">
                <Send size={16} style={{ marginRight: 6 }} />
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className="messages-empty">Select a chat to start messaging</div>
        )}
      </div>
    </div>
  );
}

export default Messages;
