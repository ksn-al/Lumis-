import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

/**
 * Provides a single shared Socket.io connection to the entire authenticated
 * section of the app.  All pages (Feed, Notifications, Messages, Sidebar)
 * call useSocket() to get this one instance instead of each creating their own.
 *
 * The socket authenticates via the httpOnly JWT cookie — it will be rejected
 * if the user is not logged in, which is fine (unauthenticated routes never
 * render this provider).
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

/** Returns the shared socket instance (null until connected). */
export function useSocket() {
  return useContext(SocketContext);
}
