const jwt = require('jsonwebtoken');
const User = require('./models/User');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's room for private notifications
    socket.join(`user:${socket.userId}`);
    
    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle real-time chat
    socket.on('sendMessage', async (data) => {
      const { receiverId, message, type = 'text' } = data;
      
      // Save message to database
      // Emit to receiver
      io.to(`user:${receiverId}`).emit('newMessage', {
        senderId: socket.userId,
        message,
        type,
        timestamp: new Date(),
      });
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('userTyping', {
        userId: socket.userId,
        isTyping: true,
      });
    });

    // Handle notification updates
    socket.on('markNotificationRead', async (data) => {
      const { notificationId } = data;
      // Update notification in database
      // Emit updated notification count
      io.to(`user:${socket.userId}`).emit('notificationUpdated', {
        notificationId,
        read: true,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      io.to(`user:${socket.userId}`).emit('userOffline', {
        userId: socket.userId,
      });
    });
  });
};
