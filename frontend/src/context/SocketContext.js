import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    let retryTimeout = null;

    const connect = async (attempt = 0) => {
      if (destroyed || socketRef.current) return;

      let token = null;
      try {
        const res = await fetch(`${SOCKET_URL}/auth/socket-token`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
        } else if (res.status === 401 || res.status === 403) {
          return; // not authenticated, don't retry
        } else if (!destroyed && attempt < 5) {
          retryTimeout = setTimeout(() => connect(attempt + 1), Math.min(2000 * (attempt + 1), 15000));
          return;
        }
      } catch {
        if (!destroyed && attempt < 5) {
          retryTimeout = setTimeout(() => connect(attempt + 1), Math.min(2000 * (attempt + 1), 15000));
        }
        return;
      }

      if (destroyed) return;

      const s = io(SOCKET_URL, {
        withCredentials: true,
        ...(token ? { auth: { token } } : {}),
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
      });

      s.on('connect_error', async () => {
        try {
          const r = await fetch(`${SOCKET_URL}/auth/socket-token`, { credentials: 'include' });
          if (r.ok) {
            const { token: newToken } = await r.json();
            s.auth = { token: newToken };
          }
        } catch {}
      });

      socketRef.current = s;
      setSocket(s);
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
