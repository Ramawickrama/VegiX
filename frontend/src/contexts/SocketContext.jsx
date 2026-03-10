import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

const SocketContext = createContext(null);

const playNotificationSound = () => {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio play failed:', err));
  } catch (err) {
    console.log('Audio error:', err);
  }
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [connectionError, setConnectionError] = useState(null);
  const listenersRef = useRef(new Map());
  const userRef = useRef(null);

  useEffect(() => {
    let user = null;
    let token = null;

    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        user = JSON.parse(savedUser);
      }
      token = localStorage.getItem('token');
    } catch (e) {
      console.log('No user logged in');
    }

    if (!user || !token) {
      return;
    }

    userRef.current = user;

    try {
      const socketUrl = API_BASE_URL;

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        console.log('✓ Socket connected:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        newSocket.emit('join_user', user.email);
        newSocket.emit('join_orders_room');
        if (user._id) {
          newSocket.emit('join_room', `broker:${user._id}`);
        }

        // Fetch initial unread message count
        fetch(`${API_BASE_URL}/api/chat/unread`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setUnreadCount(data.unreadCount || 0);
              setUnreadMessageCount(data.unreadCount || 0);
            }
          })
          .catch(err => console.log('Error fetching unread count:', err));
      });

      newSocket.on('disconnect', (reason) => {
        console.log('✗ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnectionError(error.message);
      });

      newSocket.on('online_users', (users) => {
        setOnlineUsers(users || []);
      });

      newSocket.on('user_status', ({ email, online, lastSeen }) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.email === email);
          if (exists) {
            return prev.map(u => u.email === email ? { ...u, online, lastSeen } : u);
          }
          if (online) {
            return [...prev, { email, online, lastSeen }];
          }
          return prev;
        });
      });

      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
      });

      newSocket.on('new_message', (message) => {
        setNotifications(prev => [message, ...prev]);
        setUnreadCount(prev => prev + 1);
        setUnreadMessageCount(prev => prev + 1);
        playNotificationSound();
      });

      newSocket.on('receive_message', (message) => {
        setNotifications(prev => [message, ...prev]);
        setUnreadCount(prev => prev + 1);
        setUnreadMessageCount(prev => prev + 1);
        playNotificationSound();
      });

      newSocket.on('connected', (data) => {
        console.log('✓ Server confirmed connection:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Socket initialization error:', err);
    }
  }, []);

  const subscribe = useCallback((event, callback) => {
    if (!socket) return () => { };

    socket.on(event, callback);

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    return () => {
      socket.off(event, callback);
      listenersRef.current.get(event)?.delete(callback);
    };
  }, [socket]);

  const unsubscribe = useCallback((event, callback) => {
    if (!socket) return;
    socket.off(event, callback);
    listenersRef.current.get(event)?.delete(callback);
  }, [socket]);

  const emit = useCallback((event, data, callback) => {
    if (!socket) {
      console.warn('Socket not connected');
      return;
    }
    socket.emit(event, data, callback);
  }, [socket]);

  const joinRoom = useCallback((room) => {
    emit('join_room', room);
  }, [emit]);

  const leaveRoom = useCallback((room) => {
    emit('leave_room', room);
  }, [emit]);

  const joinMarketRoom = useCallback(() => {
    emit('join_market_room');
  }, [emit]);

  const joinPredictionsRoom = useCallback(() => {
    emit('join_predictions_room');
  }, [emit]);

  const sendMessage = useCallback((conversationId, message, receiverEmail) => {
    emit('send_message', { conversationId, message, receiverEmail });
  }, [emit]);

  const sendTyping = useCallback((conversationId, receiverEmail) => {
    emit('typing', { conversationId, receiverEmail });
  }, [emit]);

  const stopTyping = useCallback((conversationId, receiverEmail) => {
    emit('stop_typing', { conversationId, receiverEmail });
  }, [emit]);

  const markSeen = useCallback((conversationId, receiverEmail) => {
    emit('mark_seen', { conversationId, receiverEmail });
  }, [emit]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const resetUnreadMessages = useCallback(() => {
    setUnreadMessageCount(0);
  }, []);

  const refreshUnreadMessageCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/chat/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadMessageCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.log('[SocketContext] Error refreshing unread count:', err);
    }
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const isUserOnline = useCallback((email) => {
    return onlineUsers.some(u => u.email?.toLowerCase() === email?.toLowerCase());
  }, [onlineUsers]);

  const value = {
    socket,
    isConnected,
    connectionError,
    onlineUsers,
    notifications,
    unreadCount,
    unreadMessageCount,
    resetUnreadMessages,
    refreshUnreadMessageCount,
    subscribe,
    unsubscribe,
    emit,
    joinRoom,
    leaveRoom,
    joinMarketRoom,
    joinPredictionsRoom,
    sendMessage,
    sendTyping,
    stopTyping,
    markSeen,
    clearNotifications,
    removeNotification,
    isUserOnline,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
