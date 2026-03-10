const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.io = null;
    this.onlineUsers = new Map();
    this.userSockets = new Map();
  }

  initialize(io) {
    this.io = io;
    this.setupSocketEvents();
    console.log('✓ SocketManager initialized');
  }

  setupSocketEvents() {
    this.io.use(async (socket, next) => {
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

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const { user } = socket;
    console.log(`✓ User connected: ${user.name} (${user.email}) - Socket: ${socket.id}`);

    this.addUser(user, socket.id);
    this.emitOnlineUsers();
    this.emitUserStatus(user.email, true);

    socket.emit('connected', {
      message: 'Connected to VegiX realtime server',
      userId: user._id,
      email: user.email
    });

    socket.on('join_user', (email) => {
      this.addUser(user, socket.id, email);
      this.emitOnlineUsers();
    });

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User ${user.name} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`User ${user.name} left room: ${room}`);
    });

    socket.on('join_market_room', () => {
      socket.join('market_prices');
      console.log(`User ${user.name} joined market prices room`);
    });

    socket.on('join_orders_room', () => {
      socket.join('orders');
      console.log(`User ${user.name} joined orders room`);
    });

    socket.on('join_predictions_room', () => {
      socket.join('predictions');
      console.log(`User ${user.name} joined predictions room`);
    });

    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, data);
    });

    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    socket.on('stop_typing', (data) => {
      this.handleStopTyping(socket, data);
    });

    socket.on('mark_seen', (data) => {
      this.handleMarkSeen(socket, data);
    });

    socket.on('get_online_users', (callback) => {
      if (callback) {
        callback(this.getOnlineUsersList());
      }
    });

    socket.on('get_user_status', (email, callback) => {
      if (callback) {
        callback({ email, online: this.isUserOnline(email) });
      }
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${user.name}:`, error.message);
    });
  }

  addUser(user, socketId, email = null) {
    const userEmail = email || user.email.toLowerCase();

    this.onlineUsers.set(userEmail, {
      socketId,
      userId: user._id.toString(),
      email: userEmail,
      name: user.name,
      role: user.role,
      connectedAt: new Date(),
      lastSeen: new Date()
    });

    const existingSockets = this.userSockets.get(userEmail) || [];
    if (!existingSockets.includes(socketId)) {
      existingSockets.push(socketId);
      this.userSockets.set(userEmail, existingSockets);
    }
  }

  removeUser(socketId) {
    let removedUser = null;

    for (const [email, userData] of this.onlineUsers.entries()) {
      if (userData.socketId === socketId) {
        userData.lastSeen = new Date();
        this.onlineUsers.delete(email);
        removedUser = { email, userId: userData.userId };

        const sockets = this.userSockets.get(email);
        if (sockets) {
          const index = sockets.indexOf(socketId);
          if (index > -1) {
            sockets.splice(index, 1);
            if (sockets.length === 0) {
              this.userSockets.delete(email);
            }
          }
        }
        break;
      }
    }

    return removedUser;
  }

  handleDisconnect(socket) {
    const user = this.removeUser(socket.id);
    if (user) {
      console.log(`✗ User disconnected: ${user.email}`);
      this.emitOnlineUsers();
      this.emitUserStatus(user.email, false, new Date());
    }
  }

  handleSendMessage(socket, data) {
    const { conversationId, message, receiverEmail } = data;
    const senderEmail = socket.user.email.toLowerCase();

    const recipientSocket = this.onlineUsers.get(receiverEmail?.toLowerCase());

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
      this.io.to(recipientSocket.socketId).emit('receive_message', messageData);
      console.log(`[Message] Sent to ${receiverEmail}`);
    }

    socket.emit('message_sent', { ...messageData, delivered: !!recipientSocket });
  }

  handleTyping(socket, data) {
    const { conversationId, receiverEmail } = data;
    const recipientSocket = this.onlineUsers.get(receiverEmail?.toLowerCase());

    if (recipientSocket) {
      this.io.to(recipientSocket.socketId).emit('user_typing', {
        conversationId,
        senderEmail: socket.user.email.toLowerCase(),
        senderName: socket.user.name,
      });
    }
  }

  handleStopTyping(socket, data) {
    const { conversationId, receiverEmail } = data;
    const recipientSocket = this.onlineUsers.get(receiverEmail?.toLowerCase());

    if (recipientSocket) {
      this.io.to(recipientSocket.socketId).emit('user_stopped_typing', {
        conversationId,
        senderEmail: socket.user.email.toLowerCase(),
      });
    }
  }

  handleMarkSeen(socket, data) {
    const { conversationId, receiverEmail } = data;
    const recipientSocket = this.onlineUsers.get(receiverEmail?.toLowerCase());

    if (recipientSocket) {
      this.io.to(recipientSocket.socketId).emit('message_seen', {
        conversationId,
        seenBy: socket.user.email.toLowerCase(),
        seenAt: new Date().toISOString(),
      });
    }
  }

  emitOnlineUsers() {
    this.io.emit('online_users', this.getOnlineUsersList());
  }

  emitUserStatus(email, online, lastSeen = null) {
    this.io.emit('user_status', {
      email: email.toLowerCase(),
      online,
      lastSeen
    });
  }

  getOnlineUsersList() {
    return Array.from(this.onlineUsers.values()).map(u => ({
      userId: u.userId,
      email: u.email,
      name: u.name,
      role: u.role,
      lastSeen: u.lastSeen
    }));
  }

  isUserOnline(email) {
    return this.onlineUsers.has(email?.toLowerCase());
  }

  getUserSocket(email) {
    return this.onlineUsers.get(email?.toLowerCase());
  }

  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  emitToUser(email, event, data) {
    const user = this.onlineUsers.get(email?.toLowerCase());
    if (user && this.io) {
      this.io.to(user.socketId).emit(event, data);
    }
  }

  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  emitOrderCreated(order) {
    this.emitToRoom('orders', 'order_created', order);
    console.log(`[Order] Created: ${order._id}`);
  }

  emitOrderUpdated(order) {
    this.emitToRoom('orders', 'order_updated', order);
    console.log(`[Order] Updated: ${order._id}`);
  }

  emitOrderDeleted(orderId) {
    this.emitToRoom('orders', 'order_deleted', { orderId });
    console.log(`[Order] Deleted: ${orderId}`);
  }

  emitOrderSold(order) {
    this.emitToRoom('orders', 'order_sold', order);
    console.log(`[Order] Sold: ${order._id}`);
  }

  emitMarketPriceUpdated(prices) {
    this.emitToRoom('market_prices', 'market_price_updated', prices);
    console.log(`[Market] Prices updated`);
  }

  emitPredictionUpdated(predictions) {
    this.emitToRoom('predictions', 'prediction_updated', predictions);
    console.log(`[Prediction] Updated`);
  }

  emitNotification(userEmail, notification) {
    this.emitToUser(userEmail, 'notification', notification);
    console.log(`[Notification] Sent to ${userEmail}`);
  }

  emitNewMessage(userEmail, message) {
    this.emitToUser(userEmail, 'receive_message', message);
  }

  emitCallRequest(userEmail, callData) {
    this.emitToUser(userEmail, 'incoming_call', callData);
    console.log(`[Call] Call request sent to ${userEmail}`);
  }

  emitCallAccepted(userEmail, data) {
    this.emitToUser(userEmail, 'call_accepted', data);
    console.log(`[Call] Call accepted notification sent to ${userEmail}`);
  }

  emitCallRejected(userEmail, data) {
    this.emitToUser(userEmail, 'call_rejected', data);
    console.log(`[Call] Call rejected notification sent to ${userEmail}`);
  }

  emitCallEnded(userEmail, data) {
    this.emitToUser(userEmail, 'call_ended', data);
    console.log(`[Call] Call ended notification sent to ${userEmail}`);
  }
}

const socketManager = new SocketManager();

module.exports = socketManager;
