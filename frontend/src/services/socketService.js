import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket = null;

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env?.VITE_API_URL || `${API_BASE_URL}`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✓ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('✗ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinUser = (email) => {
  if (socket) {
    socket.emit('join_user', email);
  }
};

export const joinConversation = (conversationId) => {
  if (socket) {
    socket.emit('join_room', conversationId);
  }
};

export const leaveConversation = (conversationId) => {
  if (socket) {
    socket.emit('leave_room', conversationId);
  }
};

export const sendMessageSocket = (conversationId, message, receiverEmail) => {
  if (socket) {
    socket.emit('send_message', { conversationId, message, receiverEmail });
  }
};

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on('receive_message', callback);
  }
  return () => {
    if (socket) {
      socket.off('receive_message', callback);
    }
  };
};

export const onMessageSent = (callback) => {
  if (socket) {
    socket.on('message_sent', callback);
  }
  return () => {
    if (socket) {
      socket.off('message_sent', callback);
    }
  };
};

export const onMessageError = (callback) => {
  if (socket) {
    socket.on('message_error', callback);
  }
  return () => {
    if (socket) {
      socket.off('message_error', callback);
    }
  };
};

export const onOnlineUsers = (callback) => {
  if (socket) {
    socket.on('online_users', callback);
  }
  return () => {
    if (socket) {
      socket.off('online_users', callback);
    }
  };
};

export const onUserOffline = (callback) => {
  if (socket) {
    socket.on('user_offline', callback);
  }
  return () => {
    if (socket) {
      socket.off('user_offline', callback);
    }
  };
};

export const onNotification = (callback) => {
  if (socket) {
    socket.on('notification', callback);
  }
  return () => {
    if (socket) {
      socket.off('notification', callback);
    }
  };
};

export const getOnlineUsers = (callback) => {
  if (socket) {
    socket.emit('get_online_users');
    socket.on('online_users', callback);
  }
};

export const getUserOnlineStatus = (email, callback) => {
  if (socket) {
    socket.emit('get_user_status', email, callback);
  }
};

export const sendTyping = (conversationId, receiverEmail) => {
  if (socket) {
    socket.emit('typing', { conversationId, receiverEmail });
  }
};

export const stopTyping = (conversationId, receiverEmail) => {
  if (socket) {
    socket.emit('stop_typing', { conversationId, receiverEmail });
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user_typing', callback);
  }
  return () => {
    if (socket) {
      socket.off('user_typing', callback);
    }
  };
};

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.on('user_stopped_typing', callback);
  }
  return () => {
    if (socket) {
      socket.off('user_stopped_typing', callback);
    }
  };
};

export const markAsSeen = (conversationId, receiverEmail) => {
  if (socket) {
    socket.emit('mark_seen', { conversationId, receiverEmail });
  }
};

export const onMessageSeen = (callback) => {
  if (socket) {
    socket.on('message_seen', callback);
  }
  return () => {
    if (socket) {
      socket.off('message_seen', callback);
    }
  };
};

export const onUserConnected = (callback) => {
  if (socket) {
    socket.on('connected', callback);
  }
  return () => {
    if (socket) {
      socket.off('connected', callback);
    }
  };
};

export const onMarketPriceUpdate = (callback) => {
  if (socket) {
    socket.emit('join_market_room');
    socket.on('market_price_updated', callback);
  }
  return () => {
    if (socket) {
      socket.off('market_price_update', callback);
    }
  };
};

export const onIncomingCall = (callback) => {
  if (socket) {
    socket.on('incoming_call', callback);
  }
  return () => {
    if (socket) {
      socket.off('incoming_call', callback);
    }
  };
};

export const onCallAccepted = (callback) => {
  if (socket) {
    socket.on('call_accepted', callback);
  }
  return () => {
    if (socket) {
      socket.off('call_accepted', callback);
    }
  };
};

export const onCallRejected = (callback) => {
  if (socket) {
    socket.on('call_rejected', callback);
  }
  return () => {
    if (socket) {
      socket.off('call_rejected', callback);
    }
  };
};

export const onCallEnded = (callback) => {
  if (socket) {
    socket.on('call_ended', callback);
  }
  return () => {
    if (socket) {
      socket.off('call_ended', callback);
    }
  };
};

export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};
