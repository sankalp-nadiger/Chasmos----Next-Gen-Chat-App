import 'dotenv/config';
import express from "express";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Chat from "./models/chat.model.js";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import colors from "colors";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";
import cors from 'cors';
import https from 'https';

// Import routes
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import taskRoutes from "./routes/task.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import documentRoutes from "./routes/document.route.js";
import archiveRoutes from "./routes/archive.routes.js"; 
import blockRoutes from "./routes/block.routes.js";
import userProfileRoutes from "./routes/userProfile.routes.js"; 
import screenshotRoutes from "./routes/screenshot.routes.js";
import groupRoutes from "./routes/group.route.js";
import pollRoutes from "./routes/poll.routes.js";
import encryptionRoutes from "./routes/encryption.routes.js"; 

// Import middleware
import { notFound, errorHandler } from "./middleware/error.middleware.js"; 
import { encryptOutgoingMessages, verifyEncryptedMessage } from "./middleware/encryption.middleware.js"; 

// Import services
import { setSocketIOInstance } from "./services/scheduledMessageCron.js";
import { initScheduledMessageCron } from "./services/scheduledMessageCron.js";
import {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineList,
  getConnectionCount,
} from "./services/onlineUsers.js";

// Import encryption service
import encryptionService from "./services/encryption.service.js"; 
import { ChatKey } from "./models/encryption.model.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://chasmos.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/message", verifyEncryptedMessage, messageRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes); 
app.use("/api/contacts", contactRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/archive", archiveRoutes); 
app.use("/api/block", blockRoutes);
app.use("/api/users", userProfileRoutes); 
app.use("/api/screenshot", screenshotRoutes);
app.use("/api/poll", pollRoutes);
app.use("/api/encryption", encryptionRoutes); 

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// SSL/TLS Configuration for HTTPS
const createSecureServer = () => {
  try {
    // Check if SSL certificates exist
    const sslKeyPath = process.env.SSL_KEY_PATH || './ssl/private.key';
    const sslCertPath = process.env.SSL_CERT_PATH || './ssl/certificate.crt';
    
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      const sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
        // Enable strong cipher suites
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-GCM-SHA256',
          'DHE-RSA-AES256-GCM-SHA384'
        ].join(':'),
        honorCipherOrder: true,
        secureProtocol: 'TLSv1_2_method'
      };
      
      console.log('🔒 SSL/TLS certificates found. Creating HTTPS server...'.green);
      return https.createServer(sslOptions, app);
    } else {
      console.log('⚠️ SSL certificates not found. Using HTTP server (NOT FOR PRODUCTION)'.yellow);
      return require('http').createServer(app);
    }
  } catch (error) {
    console.error('❌ SSL configuration error:', error.message);
    console.log('⚠️ Falling back to HTTP server'.yellow);
    return require('http').createServer(app);
  }
};

const server = createSecureServer();

// Initialize Socket.IO with encryption support
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  // Enable secure WebSocket in production
  secure: process.env.NODE_ENV === 'production'
});

// Initialize scheduled message cron job
setSocketIOInstance(io);
initScheduledMessageCron();

// Online users tracking
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  
  // User setup with encryption support
  socket.on("setup", async (userData) => {
    try {
      const uid = userData?._id || userData?.id || userData;
      if (!uid) {
        socket.emit('connected');
        return;
      }
      
      socket.join(uid);
      socket.userId = String(uid);
      
      // Track user connection
      const prev = getConnectionCount(socket.userId) || 0;
      const newCount = addConnection(socket.userId);
      
      console.log(`👤 User ${socket.userId} connected (connections: ${newCount})`);
      
      // Emit online status only for first connection
      if (prev === 0) {
        try {
          io.emit('user online', { userId: socket.userId });
          console.log(`📢 Broadcast: user online -> ${socket.userId}`);
        } catch (e) {
          console.error('Error broadcasting user online:', e);
        }
      }
      
      // Send online users list
      try {
        const onlineList = getOnlineList();
        socket.emit('online users', onlineList);
        console.log(`📋 Sent online users list to ${socket.userId}`);
      } catch (e) {
        console.error('Error emitting online users list:', e);
      }
      
      // Broadcast user's online status to their chat participants
      try {
        const uid = socket.userId;
        const chatDocs = await Chat.find({ 
          $or: [{ users: uid }, { participants: uid }] 
        }).select('users participants').lean();
        
        if (chatDocs?.length > 0) {
          const onlineListForBroadcast = getOnlineList();
          const otherUserIds = new Set();
          
          chatDocs.forEach(cd => {
            const members = (cd.users || cd.participants || []);
            members.forEach(m => {
              const id = m && (m._id || m.id || m);
              if (!id) return;
              const sid = String(id);
              if (sid === String(uid)) return;
              otherUserIds.add(sid);
            });
          });
          
          otherUserIds.forEach(ou => {
            try {
              io.to(ou).emit('online users', onlineListForBroadcast);
            } catch (e) {
              console.error(`Error emitting online users to ${ou}:`, e);
            }
          });
          
          // Compute and emit per-chat online counts
          chatDocs.forEach(cd => {
            try {
              const members = (cd.users || cd.participants || []);
              const memberIds = members
                .map(m => String(m && (m._id || m.id || m)))
                .filter(Boolean);
              
              const onlineCount = memberIds.reduce((acc, id) => 
                acc + (isOnline(id) ? 1 : 0), 0);
              const chatId = String(cd._id);
              
              // Emit to chat room
              try {
                io.to(chatId).emit('group online count', { chatId, onlineCount });
              } catch (e) {
                console.error(`Error emitting group online count to chat room ${chatId}:`, e);
              }
              
              // Emit to each member's personal room
              memberIds.forEach(mid => {
                try {
                  io.to(mid).emit('group online count', { chatId, onlineCount });
                } catch (e) {
                  console.error(`Error emitting group online count to user ${mid}:`, e);
                }
              });
            } catch (e2) {
              console.error('Error computing group online count for a chat:', e2);
            }
          });
        }
      } catch (e) {
        console.error('Error finding chats to broadcast online users list:', e);
      }
      
      socket.emit("connected");
    } catch (error) {
      console.error('Error in socket setup:', error);
    }
  });
  
  // Join chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`🚪 User joined room: ${room}`);
  });
  
  // Typing indicators
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
  // NEW: Handle encrypted messages
  socket.on("encrypted message", async (data) => {
    try {
      const { chatId, encryptedData, encryptionMetadata, signature } = data;
      const userId = socket.userId;
      
      if (!userId || !chatId || !encryptedData) {
        socket.emit("encryption error", { message: "Missing required fields" });
        return;
      }
      
      // Verify user is in chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("encryption error", { message: "Chat not found" });
        return;
      }
      
      const isUserInChat = chat.users.some(user => 
        user.toString() === userId.toString()
      ) || chat.participants.some(participant => 
        participant.toString() === userId.toString()
      );
      
      if (!isUserInChat) {
        socket.emit("encryption error", { message: "Not authorized" });
        return;
      }
      
      // Check if chat is encrypted
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      if (!chatKey) {
        socket.emit("encryption error", { message: "Chat is not encrypted" });
        return;
      }
      
      // Verify message signature (if provided)
      if (signature) {
        const isValid = await encryptionService.verifyMessageIntegrity(
          encryptedData, 
          signature
        );
        
        if (!isValid) {
          socket.emit("encryption error", { message: "Invalid message signature" });
          return;
        }
      }
      
      // Create message in database
      const message = await Message.create({
        sender: userId,
        encryptedContent: encryptedData.encrypted,
        chat: chatId,
        type: 'text',
        encryption: encryptionMetadata,
        isEncrypted: true
      });
      
      // Populate message
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name avatar email")
        .lean();
      
      // Broadcast encrypted message to chat room (server never decrypts)
      const messagePayload = {
        ...populatedMessage,
        content: '[ENCRYPTED]', // Don't send actual content
        isEncrypted: true,
        encryption: encryptionMetadata
      };
      
      socket.to(chatId).emit('encrypted message received', messagePayload);
      
      // Also emit to each user's personal room
      const users = chat.users || chat.participants || [];
      users.forEach(user => {
        const userIdStr = user.toString();
        if (userIdStr !== socket.userId) {
          io.to(userIdStr).emit('encrypted message received', messagePayload);
        }
      });
      
      console.log(`🔐 Encrypted message broadcast for chat ${chatId}`);
      
    } catch (error) {
      console.error("Error in encrypted message handler:", error);
      socket.emit("encryption error", { message: error.message });
    }
  });
  
  // Handle new message (legacy support)
  socket.on("new message", (newMessageReceived) => {
    (async () => {
      try {
        let chat = newMessageReceived.chat;
        
        if (!chat || typeof chat === "string" || (!chat.users && !chat.participants)) {
          try {
            chat = await Chat.findById(newMessageReceived.chat || chat)
              .populate("users", "blockedUsers") 
              .populate("participants", "blockedUsers") 
              .select("users participants isGroupChat")
              .lean();
          } catch (e) {
            console.error("Failed to load chat from DB in socket handler", e);
            return;
          }
        }
        
        if (!chat) {
          console.warn("[SOCKET] new message received with null/undefined chat", newMessageReceived);
          return;
        }
        
        // Check if chat is encrypted
        const chatKey = await ChatKey.findOne({ chat: chat._id, isActive: true });
        const isEncrypted = !!chatKey;
        
        // Handle blocked users for non-encrypted chats
        if (!chat.isGroupChat && !isEncrypted) {
          const senderId = newMessageReceived.sender?._id
            ? String(newMessageReceived.sender._id)
            : String(newMessageReceived.sender);
          const otherUser = chat.users.find(user => 
            String(user._id) !== senderId
          );
          
          if (otherUser && otherUser.blockedUsers && 
              otherUser.blockedUsers.includes(senderId)) {
            socket.emit("message blocked", { 
              chatId: chat._id, 
              reason: "You are blocked by this user" 
            });
            return;
          }
        }
        
        const users = chat.users || chat.participants || [];
        
        if (!users || users.length === 0) {
          return console.log("Chat has no participants to notify");
        }
        
        // Try to fetch populated message from DB
        let payload = newMessageReceived;
        try {
          const messageId = newMessageReceived._id || newMessageReceived.id;
          if (messageId) {
            const populated = await Message.findById(messageId)
              .populate('sender', 'name avatar _id')
              .populate({
                path: 'repliedTo',
                populate: { path: 'sender', select: 'name avatar _id' }
              })
              .lean();
            
            if (populated) {
              payload = populated;
              // If message is encrypted, mask content
              if (populated.isEncrypted) {
                payload.content = '[ENCRYPTED]';
              }
            }
          }
        } catch (e) {
          console.warn('Could not populate message before broadcast', e);
        }
        
        // Add encryption flag
        payload.isEncrypted = isEncrypted;
        
        // Broadcast to chat room
        try {
          const roomId = chat._id ? String(chat._id) : (typeof chat === 'string' ? chat : null);
          if (roomId) {
            socket.to(roomId).emit('message received', payload);
          }
        } catch (e) {
          console.warn('Error emitting to chat room', e);
        }
        
        // Also emit to each user's personal room
        users.forEach((user) => {
          const userId = user._id ? String(user._id) : String(user);
          const senderId = newMessageReceived.sender?._id
            ? String(newMessageReceived.sender._id)
            : String(newMessageReceived.sender);
          
          if (userId === senderId) return;
          
          try {
            io.to(userId).emit('message received', payload);
          } catch (e) {
            console.warn(`Failed to emit to user room ${userId}`, e);
          }
        });
      } catch (err) {
        console.error("Error in socket 'new message' handler:", err);
      }
    })();
  });
  
  // Chat creation with encryption support
  socket.on('chat created', ({ tempId, chat }) => {
    try {
      if (!chat) return;
      console.log(`[SOCKET] chat created: tempId=${tempId} chatId=${chat._id || chat.id || ''}`);
      const newId = String(chat._id || chat.id || '');
      
      // Emit to participants' personal rooms if present
      const participants = chat.users || chat.participants || [];
      (participants || []).forEach(p => {
        const uid = p && (p._id ? String(p._id) : String(p));
        if (uid) {
          try { io.to(uid).emit('chat created', { tempId, chat }); } catch (e) {}
        }
      });
      
      // Also broadcast to everyone else
      socket.broadcast.emit('chat created', { tempId, chat });
    } catch (e) {
      console.error('[SOCKET] error re-broadcasting chat created', e);
    }
  });
  
  // Delete message
  socket.on("delete message", async (data) => {
    try {
      const { messageId, chatId, deleteForEveryone } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("delete message error", { message: "User not authenticated" });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("delete message error", { message: "Message not found" });
        return;
      }
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("delete message error", { message: "Chat not found" });
        return;
      }
      
      const isSender = message.sender.toString() === userId.toString();
      const isGroupAdmin = chat.isGroupChat && chat.admins.includes(userId);
      const isChatAdmin = chat.admins.includes(userId);
      
      if (!isSender && !isGroupAdmin && !isChatAdmin) {
        socket.emit("delete message error", { message: "Not authorized to delete this message" });
        return;
      }
      
      if (deleteForEveryone) {
        await Message.findByIdAndDelete(messageId);
        socket.to(chatId).emit("message deleted", { messageId, chatId, deletedForEveryone: true });
      } else {
        if (!message.deletedFor) {
          message.deletedFor = [];
        }
        if (!message.deletedFor.includes(userId)) {
          message.deletedFor.push(userId);
          await message.save();
        }
      }
      
      socket.emit("message deleted", { messageId, chatId, deletedForEveryone: deleteForEveryone });
      
    } catch (error) {
      console.error("Error in delete message socket event:", error);
      socket.emit("delete message error", { message: error.message });
    }
  });
  
  // Delete chat
  socket.on("delete chat", async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("delete chat error", { message: "User not authenticated" });
        return;
      }
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("delete chat error", { message: "Chat not found" });
        return;
      }
      
      if (chat.isGroupChat) {
        if (!chat.admins.includes(userId)) {
          socket.emit("delete chat error", { message: "Only admins can delete group chats" });
          return;
        }
        
        await Message.deleteMany({ chat: chatId });
        await Chat.findByIdAndDelete(chatId);
        
        // Also delete encryption keys for this chat
        await ChatKey.deleteMany({ chat: chatId });
        
        socket.to(chatId).emit("chat deleted", { chatId, deletedBy: userId });
      } else {
        if (!chat.users.includes(userId)) {
          socket.emit("delete chat error", { message: "Not authorized to delete this chat" });
          return;
        }
        
        await Message.deleteMany({ chat: chatId });
        await Chat.findByIdAndDelete(chatId);
        
        // Delete encryption keys
        await ChatKey.deleteMany({ chat: chatId });
        
        const otherUser = chat.users.find(user => user.toString() !== userId.toString());
        if (otherUser) {
          socket.to(otherUser.toString()).emit("chat deleted", { chatId, deletedBy: userId });
        }
      }
      
      socket.emit("chat deleted", { chatId });
      
    } catch (error) {
      console.error("Error in delete chat socket event:", error);
      socket.emit("delete chat error", { message: error.message });
    }
  });
  
  // Leave group
  socket.on("leave group", async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("leave group error", { message: "User not authenticated" });
        return;
      }
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("leave group error", { message: "Chat not found" });
        return;
      }
      
      if (!chat.isGroupChat) {
        socket.emit("leave group error", { message: "This is not a group chat" });
        return;
      }
      
      if (!chat.users.includes(userId)) {
        socket.emit("leave group error", { message: "You are not a member of this group" });
        return;
      }
      
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: userId, participants: userId, admins: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("admins", "name email avatar");
      
      if (updatedChat.users.length === 0) {
        await Message.deleteMany({ chat: chatId });
        await Chat.findByIdAndDelete(chatId);
        
        // Delete encryption keys
        await ChatKey.deleteMany({ chat: chatId });
        
        socket.emit("group left", { chatId, groupDeleted: true });
      } else {
        if (updatedChat.admins.length === 0 && updatedChat.users.length > 0) {
          updatedChat.admins = [updatedChat.users[0]._id];
          updatedChat.groupAdmin = updatedChat.users[0]._id;
          await updatedChat.save();
        }
        
        socket.to(chatId).emit("user left group", { chatId, userId, updatedChat });
        socket.emit("group left", { chatId, groupDeleted: false });
      }
      
    } catch (error) {
      console.error("Error in leave group socket event:", error);
      socket.emit("leave group error", { message: error.message });
    }
  });
  
  // Block user
  socket.on("block user", async (data) => {
    try {
      const { userId } = data;
      const currentUserId = socket.userId;
      
      if (!currentUserId) {
        socket.emit("block error", { message: "User not authenticated" });
        return;
      }
      
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: userId }
      });
      
      socket.to(userId).emit("user blocked you", { blockedBy: currentUserId });
      socket.emit("user blocked", { blockedUserId: userId });
      
    } catch (error) {
      console.error("Error in block user socket event:", error);
      socket.emit("block error", { message: error.message });
    }
  });
  
  // Unblock user
  socket.on("unblock user", async (data) => {
    try {
      const { userId } = data;
      const currentUserId = socket.userId;
      
      if (!currentUserId) {
        socket.emit("unblock error", { message: "User not authenticated" });
        return;
      }
      
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: userId }
      });
      
      socket.emit("user unblocked", { unblockedUserId: userId });
      
    } catch (error) {
      console.error("Error in unblock user socket event:", error);
      socket.emit("unblock error", { message: error.message });
    }
  });
  
  // Archive chat
  socket.on("archive chat", async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("archive error", { message: "User not authenticated" });
        return;
      }
      
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          archivedChats: {
            chat: chatId,
            archivedAt: new Date()
          }
        }
      });
      
      socket.emit("chat archived", { chatId });
      
    } catch (error) {
      console.error("Error in archive chat socket event:", error);
      socket.emit("archive error", { message: error.message });
    }
  });
  
  // Star message
  socket.on("star message", async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("star error", { message: "User not authenticated" });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("star error", { message: "Message not found" });
        return;
      }
      
      // Check if already starred
      const alreadyStarred = message.starredBy.some(star => 
        star.user.toString() === userId.toString()
      );
      
      if (alreadyStarred) {
        socket.emit("star error", { message: "Message already starred" });
        return;
      }
      
      message.starredBy.push({
        user: userId,
        starredAt: new Date()
      });
      
      await message.save();
      await message.populate("starredBy.user", "name avatar");
      
      socket.to(message.chat.toString()).emit("message starred", {
        messageId: message._id,
        starredBy: message.starredBy
      });
      
      socket.emit("message starred", {
        messageId: message._id,
        starredBy: message.starredBy
      });
      
    } catch (error) {
      console.error("Error in star message socket event:", error);
      socket.emit("star error", { message: error.message });
    }
  });
  
  // Unstar message
  socket.on("unstar message", async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("unstar error", { message: "User not authenticated" });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("unstar error", { message: "Message not found" });
        return;
      }
      
      message.starredBy = message.starredBy.filter(star => 
        star.user.toString() !== userId.toString()
      );
      
      await message.save();
      
      socket.to(message.chat.toString()).emit("message unstarred", {
        messageId: message._id,
        starredBy: message.starredBy
      });
      
      socket.emit("message unstarred", {
        messageId: message._id,
        starredBy: message.starredBy
      });
      
    } catch (error) {
      console.error("Error in unstar message socket event:", error);
      socket.emit("unstar error", { message: error.message });
    }
  });
  
  // Add reaction
  socket.on("add reaction", async (data) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("reaction error", { message: "User not authenticated" });
        return;
      }
      
      if (!emoji) {
        socket.emit("reaction error", { message: "Emoji is required" });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("reaction error", { message: "Message not found" });
        return;
      }
      
      // Remove existing reaction from same user
      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
      );
      
      // Add new reaction
      message.reactions.push({
        user: userId,
        emoji: emoji,
        reactedAt: new Date()
      });
      
      await message.save();
      await message.populate("reactions.user", "name avatar");
      
      socket.to(message.chat.toString()).emit("reaction added", {
        messageId: message._id,
        reactions: message.reactions
      });
      
      socket.emit("reaction added", {
        messageId: message._id,
        reactions: message.reactions
      });
      
    } catch (error) {
      console.error("Error in add reaction socket event:", error);
      socket.emit("reaction error", { message: error.message });
    }
  });
  
  // Remove reaction
  socket.on("remove reaction", async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("reaction error", { message: "User not authenticated" });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("reaction error", { message: "Message not found" });
        return;
      }
      
      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
      );
      
      await message.save();
      
      socket.to(message.chat.toString()).emit("reaction removed", {
        messageId: message._id,
        reactions: message.reactions
      });
      
      socket.emit("reaction removed", {
        messageId: message._id,
        reactions: message.reactions
      });
      
    } catch (error) {
      console.error("Error in remove reaction socket event:", error);
      socket.emit("reaction error", { message: error.message });
    }
  });
  
  // Unarchive chat
  socket.on("unarchive chat", async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("unarchive error", { message: "User not authenticated" });
        return;
      }
      
      await User.findByIdAndUpdate(userId, {
        $pull: {
          archivedChats: { chat: chatId }
        }
      });
      
      socket.emit("chat unarchived", { chatId });
      
    } catch (error) {
      console.error("Error in unarchive chat socket event:", error);
      socket.emit("unarchive error", { message: error.message });
    }
  });
  
  // Poll events
  socket.on("poll voted", async (data) => {
    try {
      const { pollId, poll, chatId } = data;
      
      if (!pollId || !poll) {
        socket.emit("poll error", { message: "Missing poll data" });
        return;
      }
      
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        // Broadcast the updated poll to all users in the chat
        socket.to(actualChatId).emit("poll voted", { 
          pollId, 
          poll,
          chatId: actualChatId 
        });
        
        try {
          const chatDoc = await Chat.findById(actualChatId).select('users participants').lean();
          const users = (chatDoc && (chatDoc.users || chatDoc.participants)) || [];
          users.forEach(user => {
            const uid = user._id ? String(user._id) : String(user);
            if (uid === socket.userId) return;
            io.to(uid).emit('poll voted', { pollId, poll, chatId: actualChatId });
          });
        } catch (e) {
          console.error('Error broadcasting poll voted to user rooms', e);
        }
        console.log(`📊 Poll vote broadcast for poll ${pollId} in chat ${actualChatId}`);
      }
    } catch (error) {
      console.error("Error in poll voted socket event:", error);
      socket.emit("poll error", { message: error.message });
    }
  });
  
  socket.on("poll remove vote", async (data) => {
    try {
      const { pollId, poll, chatId } = data;
      
      if (!pollId || !poll) {
        socket.emit("poll error", { message: "Missing poll data" });
        return;
      }
      
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        socket.to(actualChatId).emit("poll remove vote", { 
          pollId, 
          poll,
          chatId: actualChatId 
        });
        try {
          const chatDoc = await Chat.findById(actualChatId).select('users participants').lean();
          const users = (chatDoc && (chatDoc.users || chatDoc.participants)) || [];
          users.forEach(user => {
            const uid = user._id ? String(user._id) : String(user);
            if (uid === socket.userId) return;
            io.to(uid).emit('poll remove vote', { pollId, poll, chatId: actualChatId });
          });
        } catch (e) {
          console.error('Error broadcasting poll remove vote to user rooms', e);
        }
        console.log(`📊 Poll vote removed broadcast for poll ${pollId} in chat ${actualChatId}`);
      }
    } catch (error) {
      console.error("Error in poll remove vote socket event:", error);
      socket.emit("poll error", { message: error.message });
    }
  });
  
  socket.on("poll closed", async (data) => {
    try {
      const { pollId, poll, chatId } = data;
      
      if (!pollId || !poll) {
        socket.emit("poll error", { message: "Missing poll data" });
        return;
      }
      
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        socket.to(actualChatId).emit("poll closed", { 
          pollId, 
          poll,
          chatId: actualChatId 
        });
        try {
          const chatDoc = await Chat.findById(actualChatId).select('users participants').lean();
          const users = (chatDoc && (chatDoc.users || chatDoc.participants)) || [];
          users.forEach(user => {
            const uid = user._id ? String(user._id) : String(user);
            if (uid === socket.userId) return;
            io.to(uid).emit('poll closed', { pollId, poll, chatId: actualChatId });
          });
        } catch (e) {
          console.error('Error broadcasting poll closed to user rooms', e);
        }
        console.log(`📊 Poll closed broadcast for poll ${pollId} in chat ${actualChatId}`);
      }
    } catch (error) {
      console.error("Error in poll closed socket event:", error);
      socket.emit("poll error", { message: error.message });
    }
  });
  
  // Group socket events
  socket.on("join-group", ({ groupId }) => {
    socket.join(`group_${groupId}`);
  });
  
  socket.on("leave-group", ({ groupId }) => {
    socket.leave(`group_${groupId}`);
  });
  
  socket.on("member-added", ({ groupId, userId }) => {
    io.to(`group_${groupId}`).emit("member-added", { userId });
  });
  
  socket.on("member-removed", ({ groupId, userId }) => {
    io.to(`group_${groupId}`).emit("member-removed", { userId });
  });
  
  socket.on("admin-changed", ({ groupId, newAdminId }) => {
    io.to(`group_${groupId}`).emit("admin-changed", { newAdminId });
  });
  
  // NEW: Encryption key events
  socket.on("encryption setup", async (data) => {
    try {
      const { chatId, participants } = data;
      const userId = socket.userId;
      
      if (!userId) {
        socket.emit("encryption error", { message: "User not authenticated" });
        return;
      }
      
      // Setup encryption for chat
      const result = await encryptionService.setupChatEncryption(
        chatId,
        participants
      );
      
      // Broadcast to all participants
      const chat = await Chat.findById(chatId);
      const users = chat.users || chat.participants || [];
      
      users.forEach(user => {
        const uid = user.toString();
        io.to(uid).emit('encryption enabled', {
          chatId,
          message: 'End-to-end encryption enabled for this chat'
        });
      });
      
      socket.emit("encryption setup complete", result);
      
    } catch (error) {
      console.error("Encryption setup error:", error);
      socket.emit("encryption error", { message: error.message });
    }
  });
  
  // Disconnect handler
  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
    try {
      const uid = socket.userId;
      if (uid) {
        const prev = getConnectionCount(uid) || 0;
        const next = removeConnection(uid);
        console.log(`📊 User ${uid} disconnected (connections: ${next})`);
        
        if (next <= 0) {
          try {
            io.emit('user offline', { userId: uid });
            console.log(`📢 Broadcast: user offline -> ${uid}`);
          } catch (e) {
            console.error('Error broadcasting user offline:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error handling disconnect online map:', e);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}...`.yellow.bold);
  console.log(`🔐 Encryption: ${process.env.ENCRYPTION_MASTER_KEY ? 'Enabled' : 'Not configured'}`);
  console.log(`🌐 Protocol: ${server instanceof https.Server ? 'HTTPS' : 'HTTP'}`);
});