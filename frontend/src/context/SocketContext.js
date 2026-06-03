import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let destroyed = false;

    const connect = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/auth/socket-token`, {
          credentials: 'include',
        });
        if (!res.ok || destroyed) return;
        const { token } = await res.json();

        const s = io(SOCKET_URL, {
          withCredentials: true,
          auth: { token },
          transports: ['websocket', 'polling'],
        });

        s.on('connect_error', async (err) => {
          if (err.message === 'Invalid or expired token') {
            try {
              const r = await fetch(`${SOCKET_URL}/auth/socket-token`, { credentials: 'include' });
              if (!r.ok) return;
              const { token: newToken } = await r.json();
              s.auth = { token: newToken };
              s.connect();
            } catch {}
          }
        });

        socketRef.current = s;
        setSocket(s);
      } catch {}
    };

    connect();

    return () => {
      destroyed = true;
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
