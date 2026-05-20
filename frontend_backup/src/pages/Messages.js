
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api"; 
import { useLocation } from "react-router-dom";


function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Для автооткрытия чата по параметру ?to=username
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const toUsername = params.get("to");

  // Получить список чатов
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/messages/conversations");
        setConversations(data);
      } catch (e) {
        setConversations([]);
        setError(e.message || "Помилка завантаження чатів");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Если toUsername есть — сразу открываем чат с этим пользователем
  useEffect(() => {
    if (toUsername && conversations.length) {
      const conv = conversations.find(c =>
        c.participants.some(u => u.username === toUsername)
      );
      if (conv) {
        setSelectedConversation(conv.id);
      } else {
        setSelectedConversation(null);
      }
    }
  }, [toUsername, conversations]);

  // Получить сообщения выбранного чата
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        setLoading(true);
        setError("");
        try {
          const data = await apiRequest(`/messages/conversations/${selectedConversation}/messages`);
          setMessages(data);
        } catch (e) {
          setMessages([]);
          setError(e.message || "Помилка завантаження повідомлень");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/messages/conversations/${selectedConversation}/messages`, "POST", { text: newMessage });
      setNewMessage("");
      const data = await apiRequest(`/messages/conversations/${selectedConversation}/messages`);
      setMessages(data);
    } catch (e) {
      setError(e.message || "Помилка надсилання повідомлення");
    } finally {
      setLoading(false);
    }
  };
return (
  <div className="messages-page">
    <div className="conversations-list">
      <div className="conversations-header">Повідомлення</div>
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Завантаження...</div>}
      <ul className="conversations-items">
        {conversations.map(conv => (
          <li
            key={conv.id}
            className={`conversation-item ${
              selectedConversation === conv.id ? "active" : ""
            }`}
            onClick={() => setSelectedConversation(conv.id)}
          >
            <div className="conversation-avatar">
              {conv.participants?.[0]?.displayname?.[0] ||
                conv.participants?.[0]?.username?.[0] ||
                "?"}
            </div>
            <div className="conversation-info">
              <div className="conversation-name">
                {conv.participants
                  ?.map(u => u.displayname || u.username)
                  .join(", ")}
              </div>

              <div className="conversation-last-message">
                {conv.messages?.[0]?.text || "Немає повідомлень"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div className="conversation-messages">
      {selectedConversation ? (
        <>
          <div className="messages-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-item ${
                  msg.isMe ? "message-item-me" : ""
                }`}
              >
                <div className="message-author">
                  {msg.sender?.displayname || msg.sender?.username}
                </div>

                <div className="message-text">{msg.text}</div>

                <div className="message-date">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="message-input-form">
            <input
              className="message-input"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Введіть повідомлення..."
            />

            <button className="message-send-button" type="submit">
              Відправити
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

          <div className="new-conversation-empty">
            Почніть нову розмову
          </div>

          <form
            className="message-input-form"
            onSubmit={async e => {
              e.preventDefault();

              if (!newMessage.trim()) return;

              try {
                await apiRequest(`/messages/new`, "POST", {
                  to: toUsername,
                  text: newMessage,
                });

                setNewMessage("");

                const updated = await apiRequest("/messages/conversations");
                setConversations(updated);

                const conv = updated.find(c =>
                  c.participants.some(u => u.username === toUsername)
                );

                if (conv) setSelectedConversation(conv.id);
              } catch {}
            }}
          >
            <input
              className="message-input"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Повідомлення для @${toUsername}`}
            />

            <button className="message-send-button" type="submit">
              Відправити
            </button>
          </form>
        </div>
      ) : (
        <div className="messages-empty">
          Оберіть чат, щоб почати переписку
        </div>
      )}
    </div>
  </div>
);
}

export default Messages;
