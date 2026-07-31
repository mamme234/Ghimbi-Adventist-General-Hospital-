const Message = require('../models/Message');
const User = require('../models/User');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);

      // Handle user online status
      socket.on('user-online', (userId) => {
        this.onlineUsers.set(userId, socket.id);
        this.io.emit('user-status', { userId, status: 'online' });
      });

      // Handle private messages
      socket.on('private-message', async (data) => {
        try {
          const { receiverId, message, type = 'text' } = data;

          // Save message to database
          const newMessage = new Message({
            sender: socket.userId,
            receiver: receiverId,
            message,
            type,
            timestamp: new Date(),
          });
          await newMessage.save();

          // Check if receiver is online
          const receiverSocketId = this.onlineUsers.get(receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new-message', {
              message: newMessage,
              sender: socket.userId,
            });
          }

          // Send confirmation to sender
          socket.emit('message-sent', {
            success: true,
            message: newMessage,
          });
        } catch (error) {
          socket.emit('message-error', {
            success: false,
            message: 'Error sending message',
          });
        }
      });

      // Handle group messages (department/role based)
      socket.on('group-message', async (data) => {
        try {
          const { group, message, type = 'text' } = data;

          // Save group message
          const newMessage = new Message({
            sender: socket.userId,
            group,
            message,
            type,
            timestamp: new Date(),
          });
          await newMessage.save();

          // Broadcast to group members
          this.io.to(`group:${group}`).emit('group-message', {
            message: newMessage,
            sender: socket.userId,
          });
        } catch (error) {
          socket.emit('message-error', {
            success: false,
            message: 'Error sending group message',
          });
        }
      });

      // Handle typing indicator
      socket.on('typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = this.onlineUsers.get(receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user-typing', {
            userId: socket.userId,
            isTyping: true,
          });
        }
      });

      // Handle stop typing
      socket.on('stop-typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = this.onlineUsers.get(receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user-typing', {
            userId: socket.userId,
            isTyping: false,
          });
        }
      });

      // Handle seen status
      socket.on('message-seen', async (data) => {
        const { messageId } = data;
        await Message.findByIdAndUpdate(messageId, {
          seen: true,
          seenAt: new Date(),
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.onlineUsers.delete(socket.userId);
        this.io.emit('user-status', {
          userId: socket.userId,
          status: 'offline',
        });
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Send notification to all users in a role
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Send notification to all users
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = ChatHandler;
