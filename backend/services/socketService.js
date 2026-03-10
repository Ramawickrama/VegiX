const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map();
let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('_id name email role');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.user.name} (${socket.user.email}) - Socket: ${socket.id}`);

    onlineUsers.set(socket.user.email.toLowerCase(), {
      socketId: socket.id,
      email: socket.user.email.toLowerCase(),
      userId: socket.user._id,
      name: socket.user.name,
      role: socket.user.role,
      connectedAt: new Date(),
    });

    io.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({
      email: u.email,
      userId: u.userId,
      name: u.name,
      role: u.role,
    })));

    socket.emit('userConnected', { email: socket.user.email.toLowerCase() });

    socket.on('join_user', (email) => {
      const userEmail = email || socket.user.email.toLowerCase();
      onlineUsers.set(userEmail, {
        socketId: socket.id,
        email: userEmail,
        userId: socket.user._id,
        name: socket.user.name,
        role: socket.user.role,
        connectedAt: new Date(),
      });
      io.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({
        email: u.email,
        userId: u.userId,
        name: u.name,
        role: u.role,
      })));
      console.log(`User joined: ${userEmail}`);
    });

    socket.on('joinRoom', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.user.name} joined conversation: ${conversationId}`);
    });

    socket.on('leaveRoom', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.user.name} left conversation: ${conversationId}`);
    });

    socket.on('send_message', (data) => {
      try {
        const { conversationId, message, receiverEmail } = data;
        const senderEmail = socket.user.email.toLowerCase();

        const recipientSocket = onlineUsers.get(receiverEmail?.toLowerCase());

        const messageData = {
          _id: Date.now().toString(),
          conversationId,
          senderEmail,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          message,
          createdAt: new Date().toISOString(),
          readStatus: false,
        };

        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit('receive_message', messageData);
          console.log(`Real-time message sent to ${receiverEmail}`);
        }

        socket.emit('message_sent', { ...messageData, delivered: !!recipientSocket });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const { conversationId, receiverEmail } = data;
      const recipientSocket = onlineUsers.get(receiverEmail?.toLowerCase());
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('user_typing', {
          conversationId,
          senderEmail: socket.user.email.toLowerCase(),
          senderName: socket.user.name,
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { conversationId, receiverEmail } = data;
      const recipientSocket = onlineUsers.get(receiverEmail?.toLowerCase());
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('user_stopped_typing', {
          conversationId,
          senderEmail: socket.user.email.toLowerCase(),
        });
      }
    });

    socket.on('mark_seen', (data) => {
      const { conversationId, receiverEmail } = data;
      const recipientSocket = onlineUsers.get(receiverEmail?.toLowerCase());
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('message_seen', {
          conversationId,
          seenBy: socket.user.email.toLowerCase(),
          seenAt: new Date().toISOString(),
        });
      }
    });

    socket.on('get_online_users', () => {
      socket.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({
        email: u.email,
        userId: u.userId,
        name: u.name,
        role: u.role,
      })));
    });

    socket.on('get_user_online_status', (email, callback) => {
      const isOnline = onlineUsers.has(email?.toLowerCase());
      callback({ email: email?.toLowerCase(), isOnline });
    });

    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.user.name} (${socket.user.email})`);
      onlineUsers.delete(socket.user.email.toLowerCase());

      io.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({
        email: u.email,
        userId: u.userId,
        name: u.name,
        role: u.role,
      })));

      io.emit('user_offline', { email: socket.user.email.toLowerCase() });
    });
  });

  return io;
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.values()).map(u => ({
    email: u.email,
    userId: u.userId,
    name: u.name,
    role: u.role,
  }));
};

const getIO = () => ioInstance;

const isUserOnline = (email) => {
  return onlineUsers.has(email?.toLowerCase());
};

const getUserSocket = (email) => {
  return onlineUsers.get(email?.toLowerCase());
};

const sendNotificationToUser = (email, notification) => {
  const user = onlineUsers.get(email?.toLowerCase());
  if (user && ioInstance) {
    ioInstance.to(user.socketId).emit('notification', notification);
  }
};

const emitToUser = (email, event, data) => {
  const user = onlineUsers.get(email?.toLowerCase());
  if (user && ioInstance) {
    ioInstance.to(user.socketId).emit(event, data);
  }
};

const emitNewMessage = (receiverEmail, messageData) => {
  const user = onlineUsers.get(receiverEmail?.toLowerCase());
  if (user && ioInstance) {
    ioInstance.to(user.socketId).emit('receive_message', messageData);
  }
};

module.exports = { initializeSocket, getOnlineUsers, isUserOnline, getUserSocket, sendNotificationToUser, emitToUser, emitNewMessage, getIO };
