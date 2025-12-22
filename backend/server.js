import 'dotenv/config';
import express from "express";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Chat from "./models/chat.model.js";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import Screenshot from "./models/screenshot.model.js";
import colors from "colors";
import path from "path";
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
//import groupRoutes from "./routes/group.route.js";
import { fileURLToPath } from "url";
import pollRoutes from "./routes/poll.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js"; 
import cors from 'cors';
import { setSocketIOInstance } from "./services/scheduledMessageCron.js";
import { initScheduledMessageCron } from "./services/scheduledMessageCron.js";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineList,
  getConnectionCount,
} from "./services/onlineUsers.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();
const app = express();

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

// In your server setup
app.use(express.json({ limit: '5mb' })); // default is 100kb
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
 app.use("/api/group", groupRoutes);
app.use("/api/message", messageRoutes);
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: ['http://localhost:5173','https://chasmos.netlify.app'],
    methods: ["GET", "POST"]
  },
});

// Online users are tracked in ./services/onlineUsers.js

// Initialize scheduled message cron job
// Pass io to cron job
setSocketIOInstance(io);
initScheduledMessageCron();



io.on("connection", (socket) => {
  //console.log("Connected to socket.io");
  
  socket.on("setup", async (userData) => {
    let uid = userData?._id || userData?.id || userData;
    // If no uid in payload, try to decode token provided in socket handshake auth
    if (!uid) {
      try {
        const token = socket.handshake?.auth?.token || (socket.handshake?.headers && (socket.handshake.headers.authorization || '').split(' ')[1]);
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          uid = decoded?.id || decoded?._id || decoded?.userId || decoded?.id;
        }
      } catch (e) {
        // token invalid or missing
      }
    }

    if (!uid) {
      console.log('[SOCKET] setup called with no uid, sending connected ack');
      socket.emit('connected');
      return;
    }

    socket.join(uid);
    socket.userId = String(uid);

    // increment connection count for this user
    const prev = getConnectionCount(socket.userId) || 0;
    const newCount = addConnection(socket.userId);
    //console.log(`[SOCKET] setup: user=${socket.userId} prevConnections=${prev} newConnections=${newCount} totalOnlineUsers=${getOnlineList().length}`);

    // emit to others that this user is online only when first connection
    if (prev === 0) {
      try {
        io.emit('user online', { userId: socket.userId });
        
      } catch (e) {
        console.error('[SOCKET] error broadcasting user online', e);
      }
    }

    // send current online users list to the connecting socket
    try {
      const onlineList = getOnlineList();
      socket.emit('online users', onlineList);
      //console.log(`[SOCKET] sent online users list (${onlineList.length}) to ${socket.userId}`);
    } catch (e) {
      console.error('[SOCKET] error emitting online users list', e);
    }

    // Also send the online users list and per-chat online counts to each other participant
    // in chats this user is in. This emits both the general `online users` list to personal
    // rooms and a `group online count` event to each chat room and each member's personal room.
    try {
      const uid = socket.userId;
      const chatDocs = await Chat.find({ $or: [{ users: uid }, { participants: uid }] }).select('users participants').lean();
      if ((chatDocs || []).length === 0) {
        // nothing to broadcast
      } else {
        // Prepare full online list for personal-room broadcasts
        const onlineListForBroadcast = getOnlineList();

        // Collect unique personal user IDs (excluding current) to continue sending the
        // existing `online users` list as before for compatibility with clients.
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
            console.error(`[SOCKET] error emitting online users to ${ou}`, e);
          }
        });

        // Now compute and emit per-chat online counts. For each chat, count how many
        // of its members are currently connected (based on onlineUserConnections map),
        // then emit `group online count` to the chat room and to each member's personal room.
        chatDocs.forEach(cd => {
          try {
            const members = (cd.users || cd.participants || []);
            const memberIds = members
              .map(m => String(m && (m._id || m.id || m)))
              .filter(Boolean);

            const onlineCount = memberIds.reduce((acc, id) => acc + (isOnline(id) ? 1 : 0), 0);
            const chatId = String(cd._id);

            // Emit to the chat room (sockets that have joined the chat room)
            try {
              io.to(chatId).emit('group online count', { chatId, onlineCount });
            } catch (e) {
              console.error(`[SOCKET] error emitting group online count to chat room ${chatId}`, e);
            }

            // Also emit to each member's personal room as a fallback for sockets not
            // currently in the chat room.
            memberIds.forEach(mid => {
              try {
                io.to(mid).emit('group online count', { chatId, onlineCount });
              } catch (e) {
                console.error(`[SOCKET] error emitting group online count to user ${mid}`, e);
              }
            });
          } catch (e2) {
            console.error('[SOCKET] error computing group online count for a chat', e2);
          }
        });

        //console.log(`[SOCKET] broadcasted online users list to ${otherUserIds.size} other chat participant(s) for user ${uid}`);
      }
    } catch (e) {
      console.error('[SOCKET] error finding chats to broadcast online users list', e);
    }

    // Mark undelivered messages as delivered for this returning connection
    try {
      const userIdStr = String(socket.userId);
      const chatIds = (await Chat.find({ $or: [{ users: userIdStr }, { participants: userIdStr }] }).select('_id').lean()).map(c => String(c._id));
      if (chatIds.length > 0) {
        const undelivered = await Message.find({ chat: { $in: chatIds }, sender: { $ne: userIdStr }, deliveredBy: { $ne: userIdStr } });
        const notifyMap = new Map();
        for (const msg of undelivered) {
          msg.deliveredBy = msg.deliveredBy || [];
          try {
            msg.deliveredBy.push(mongoose.Types.ObjectId(userIdStr));
          } catch (e) {
            msg.deliveredBy.push(userIdStr);
          }
          // If all non-sender participants have delivered, set status to delivered
          try {
            const chatDoc = await Chat.findById(msg.chat).select('users participants').lean();
            const members = (chatDoc?.users || chatDoc?.participants || []).map(m => String(m && (m._id || m.id || m))).filter(Boolean).filter(id => id !== String(msg.sender));
            const allDelivered = members.every(m => msg.deliveredBy.map(String).includes(String(m)));
            if (allDelivered) msg.status = 'delivered';
          } catch (e) {}
          try {
            const before = (msg.deliveredBy || []).map(d => String(d));
            await msg.save();
            const after = (msg.deliveredBy || []).map(d => String(d));
            console.log('[SOCKET] marked undelivered->delivered persisted', { messageId: msg._id, before, after, status: msg.status });
          } catch (saveErr) {
            console.error('[SOCKET] error saving undelivered message', saveErr);
          }
          notifyMap.set(String(msg.sender), (notifyMap.get(String(msg.sender)) || []).concat(msg));
        }
        // Emit delivered updates to senders' personal rooms
        for (const [senderId, msgs] of notifyMap.entries()) {
          const payload = msgs.map(m => ({ messageId: m._id, chatId: m.chat, deliveredBy: (m.deliveredBy || []).map(d => String(d)) }));
          try {
            io.to(senderId).emit('message-delivered', { delivered: payload });
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('[SOCKET] error marking undelivered messages as delivered on setup', e);
    }

    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  
  socket.on("typing", async (data) => {
    try {
      // Accept either a room string or an object { chatId, user }
      let room = null;
      let payload = {};
      if (!data) {
        return;
      }
      if (typeof data === 'string') {
        room = data;
        payload = { chatId: room };
      } else if (typeof data === 'object') {
        room = data.chatId || data.room || null;
        payload = { ...(data || {}) };
      }

      if (!room) return;

      // If caller didn't include user info, try to attach minimal info from socket
      if (!payload.user && socket.userId) {
        try {
          const user = await User.findById(socket.userId).select('_id name avatar');
          if (user) payload.user = { _id: user._id, name: user.name, avatar: user.avatar };
          else payload.user = { _id: socket.userId };
        } catch (e) {
          payload.user = { _id: socket.userId };
        }
      }

      // Emit to sockets that joined the chat room
      socket.in(String(room)).emit('typing', payload);

      // Also emit to each participant's personal room (fallback)
      try {
        const chatDoc = await Chat.findById(String(room)).select('users participants').lean();
        const members = (chatDoc?.participants && chatDoc.participants.length) ? chatDoc.participants : (chatDoc?.users || []);
        (members || []).forEach((m) => {
          try {
            const uid = String(m._id || m.id || m);
            if (!uid) return;
            // don't redundantly emit to the same socket origin
            if (socket.userId && String(socket.userId) === uid) return;
            io.to(uid).emit('typing', payload);
          } catch (e) {
            console.error('[SOCKET] error emitting typing to personal room', e);
          }
        });
      } catch (e) {
        console.error('[SOCKET] error finding chat members for typing emit', e);
      }
    } catch (e) {
      console.error('[SOCKET] error broadcasting typing', e);
    }
  });

  socket.on("stop typing", async (data) => {
    try {
      let room = null;
      let payload = {};
      if (!data) return;
      if (typeof data === 'string') {
        room = data;
        payload = { chatId: room };
      } else if (typeof data === 'object') {
        room = data.chatId || data.room || null;
        payload = { ...(data || {}) };
      }

      if (!room) return;

      if (!payload.user && socket.userId) {
        try {
          const user = await User.findById(socket.userId).select('_id name avatar');
          if (user) payload.user = { _id: user._id, name: user.name, avatar: user.avatar };
          else payload.user = { _id: socket.userId };
        } catch (e) {
          payload.user = { _id: socket.userId };
        }
      }

      // Emit to sockets that joined the chat room
      socket.in(String(room)).emit('stop typing', payload);

      // Also emit to each participant's personal room (fallback)
      try {
        const chatDoc = await Chat.findById(String(room)).select('users participants').lean();
        const members = (chatDoc?.participants && chatDoc.participants.length) ? chatDoc.participants : (chatDoc?.users || []);
        (members || []).forEach((m) => {
          try {
            const uid = String(m._id || m.id || m);
            if (!uid) return;
            if (socket.userId && String(socket.userId) === uid) return;
            io.to(uid).emit('stop typing', payload);
          } catch (e) {
            console.error('[SOCKET] error emitting stop typing to personal room', e);
          }
        });
      } catch (e) {
        console.error('[SOCKET] error finding chat members for stop typing emit', e);
      }
    } catch (e) {
      console.error('[SOCKET] error broadcasting stop typing', e);
    }
  });

  socket.on("new message", (newMessageRecieved) => {
    (async () => {
      try {
        let chat = newMessageRecieved.chat;

        if (!chat || typeof chat === "string" || (!chat.users && !chat.participants)) {
          try {
            chat = await Chat.findById(newMessageRecieved.chat || chat)
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
          console.warn("[SOCKET] new message received with null/undefined chat", newMessageRecieved);
          return;
        }

        if (!Object.prototype.hasOwnProperty.call(chat, 'isGroupChat')) {
          // Defensive: fallback to false if missing
          chat.isGroupChat = false;
        }

        if (!chat.isGroupChat) {
          const senderId = newMessageRecieved.sender?._id
            ? String(newMessageRecieved.sender._id)
            : String(newMessageRecieved.sender);
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
          return console.log("chat has no participants to notify");
        }

        // Try to fetch populated message from DB so repliedTo and sender fields are present for all clients
        let payload = newMessageRecieved;
        try {
          const messageId = newMessageRecieved._id || newMessageRecieved.id;
          if (messageId) {
            const populated = await Message.findById(messageId)
              .populate('sender', 'name avatar _id')
              .populate({
                path: 'repliedTo',
                populate: { path: 'sender', select: 'name avatar _id' }
              })
              .lean();
            if (populated) payload = populated;
          } else if (newMessageRecieved.repliedTo && newMessageRecieved.repliedTo.length) {
            // If message has no ID yet (not saved or not returned), try to fetch the repliedTo messages
            const ids = (newMessageRecieved.repliedTo || []).map(r => r._id || r.id || r).filter(Boolean);
            if (ids.length) {
              try {
                const repliedDocs = await Message.find({ _id: { $in: ids } })
                  .populate('sender', 'name avatar _id')
                  .lean();
                const map = {};
                repliedDocs.forEach(d => { map[String(d._id)] = d; });
                payload = {
                  ...newMessageRecieved,
                  repliedTo: ids.map(id => map[String(id)] || { _id: id })
                };
              } catch (e2) {
                console.warn('Could not fetch repliedTo messages for broadcast', e2);
              }
            }
          }

          // Ensure top-level sender is populated if possible (best-effort).
          // Normalize sender id whether payload.sender is string or object.
          if (payload) {
            try {
              let senderId = null;
              if (payload.sender) {
                if (typeof payload.sender === 'string') {
                  senderId = payload.sender;
                } else if (payload.sender._id) {
                  senderId = String(payload.sender._id);
                } else if (payload.sender.id) {
                  senderId = String(payload.sender.id);
                }
              }
              // fallback to original incoming object if payload lacks sender
              if (!senderId && newMessageRecieved && newMessageRecieved.sender) {
                if (typeof newMessageRecieved.sender === 'string') senderId = newMessageRecieved.sender;
                else if (newMessageRecieved.sender._id) senderId = String(newMessageRecieved.sender._id);
                else if (newMessageRecieved.sender.id) senderId = String(newMessageRecieved.sender.id);
              }

              if (senderId) {
                const u = await User.findById(senderId).select('name avatar _id').lean();
                if (u) payload.sender = u;
              }
            } catch (e3) {
              // ignore population errors - best-effort only
            }
          }
        } catch (e) {
          console.warn('Could not populate message before broadcast', e);
        }

        // Broadcast to the chat room (connected sockets in the chat)
        try {
          const roomId = chat._id ? String(chat._id) : (typeof chat === 'string' ? chat : null);
          if (roomId) {
            socket.to(roomId).emit('message recieved', payload);
          }
        } catch (e) {
          console.warn('Error emitting to chat room', e);
        }

        // Also emit to each user's personal room (fallback for users not joined to chat room)
        users.forEach((user) => {
          const userId = user._id ? String(user._id) : String(user);
          const senderId = newMessageRecieved.sender?._id
            ? String(newMessageRecieved.sender._id)
            : String(newMessageRecieved.sender);

          if (userId === senderId) return;

          try {
            io.to(userId).emit('message recieved', payload);
          } catch (e) {
            console.warn(`Failed to emit to user room ${userId}`, e);
          }
        });
      } catch (err) {
        console.error("Error in socket 'new message' handler:", err);
      }
    })();
  });

  // When a client emits 'chat created' (mapping a tempId -> real chat), re-broadcast
  // to other participants and connected clients so they can migrate pending state.
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
      // Also broadcast to everyone else as a fallback
      socket.broadcast.emit('chat created', { tempId, chat });
    } catch (e) {
      console.error('[SOCKET] error re-broadcasting chat created', e);
    }
  });

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

  socket.on("delete chat", async (data) => {
    try {
      const { chatId } = data || {};
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
        
        socket.to(chatId).emit("chat deleted", { chatId, deletedBy: userId });
      } else {
        if (!chat.users.includes(userId)) {
          socket.emit("delete chat error", { message: "Not authorized to delete this chat" });
          return;
        }

        // Soft-delete for 1-on-1 chats: mark messages as deleted for this user
        // and add this user to chat.deletedBy so the chat is hidden for them only.
        // Support `keepMedia` flag from the client: when true, also add the user
        // to `keepFor` on messages/screenshots that contain media so they remain visible.
        try {
          const keepMedia = (data && (data.keepMedia === true || String(data.keepMedia).toLowerCase() === 'true'));

          // Always mark all messages as deletedFor this user
          try {
            await Message.updateMany(
              { chat: chatId },
              { $addToSet: { deletedFor: userId } }
            );
          } catch (mErr) {
            console.warn('[socket delete chat] Failed to mark messages deletedFor user:', mErr && mErr.message);
          }

          // If keepMedia requested, add user to keepFor for messages that have attachments
          if (keepMedia) {
            try {
              await Message.updateMany(
                { chat: chatId, attachments: { $exists: true, $ne: [] } },
                { $addToSet: { keepFor: userId } }
              );
            } catch (kErr) {
              console.warn('[socket delete chat] Failed to add user to keepFor for messages with attachments:', kErr && kErr.message);
            }
          }

          // Always mark screenshots as deletedFor this user
          try {
            await Screenshot.updateMany(
              { chat: chatId },
              { $addToSet: { deletedFor: userId } }
            );
          } catch (sErr) {
            console.warn('[socket delete chat] Failed to mark screenshots deletedFor user:', sErr && sErr.message);
          }

          // If keepMedia requested, also add user to keepFor for screenshots
          if (keepMedia) {
            try {
              await Screenshot.updateMany(
                { chat: chatId },
                { $addToSet: { keepFor: userId } }
              );
            } catch (kSErr) {
              console.warn('[socket delete chat] Failed to add user to keepFor for screenshots:', kSErr && kSErr.message);
            }
          }

          await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { deletedBy: userId }, $set: { deletedAt: new Date() } },
            { new: true }
          );

          // Notify the other participant that this user cleared the chat (optional)
          const otherUser = chat.users.find(user => user.toString() !== userId.toString());
          if (otherUser) {
            try { socket.to(otherUser.toString()).emit("chat cleared", { chatId, clearedBy: userId }); } catch (e) { /* ignore */ }
          }

        } catch (err) {
          console.error('Error while soft-deleting chat via socket:', err);
          socket.emit('delete chat error', { message: 'Failed to clear chat' });
          return;
        }
      }

      socket.emit("chat deleted", { chatId });
      
    } catch (error) {
      console.error("Error in delete chat socket event:", error);
      socket.emit("delete chat error", { message: error.message });
    }
  });

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

  // Poll socket events
  socket.on("poll voted", async (data) => {
    try {
      const { pollId, poll, chatId } = data;
      
      if (!pollId || !poll) {
        socket.emit("poll error", { message: "Missing poll data" });
        return;
      }

      // Get the chat ID if not provided
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        // Broadcast the updated poll to all users in the chat (except sender)
        socket.to(actualChatId).emit("poll voted", { 
          pollId, 
          poll,
          chatId: actualChatId 
        });
        // Also emit directly to each user's personal room (fallback for users not joined to chat room)
        try {
          const chatDoc = await Chat.findById(actualChatId).select('users participants').lean();
          const users = (chatDoc && (chatDoc.users || chatDoc.participants)) || [];
          users.forEach(user => {
            const uid = user._id ? String(user._id) : String(user);
            if (uid === socket.userId) return; // skip sender
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

      // Get the chat ID if not provided
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        // Broadcast the updated poll to all users in the chat (except sender)
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

      // Get the chat ID if not provided
      const actualChatId = chatId || poll.chat;
      
      if (actualChatId) {
        // Broadcast the closed poll to all users in the chat
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

  //group-socket-events
  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED", socket.id);
    try {
      const uid = socket.userId;
      if (uid) {
        const prev = getConnectionCount(uid) || 0;
        const next = removeConnection(uid);
        //console.log(`[SOCKET] disconnect: user=${uid} prevConnections=${prev} nextConnections=${next}`);
        if (next <= 0) {
          try {
            io.emit('user offline', { userId: uid });
            console.log(`[SOCKET] broadcast: user offline -> ${uid}`);
          } catch (e) {
            console.error('[SOCKET] error broadcasting user offline', e);
          }
        }
      }
    } catch (e) {
      console.error('Error handling disconnect online map', e);
    }
  });

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


  // Message delivered: recipient client acknowledges receipt (1-on-1 delivered)
  socket.on("message-delivered", async (data) => {
    try {
      const { messageId } = data || {};
      let userId = socket.userId;
      // if socket.userId not set (e.g., setup not received yet), try to decode token from handshake
      if (!userId) {
        try {
          const token = socket.handshake?.auth?.token || (socket.handshake?.headers && (socket.handshake.headers.authorization || '').split(' ')[1]);
          if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded?.id || decoded?._id || decoded?.userId || decoded?.id;
            if (userId) socket.userId = String(userId);
          }
        } catch (e) {}
      }
      console.log('[SOCKET IN] message-delivered received from', userId, 'payload:', data);
      if (!userId) return socket.emit('message-delivered-error', { message: 'Not authenticated' });
      if (!messageId) return socket.emit('message-delivered-error', { message: 'messageId required' });

      const message = await Message.findById(messageId);
      if (!message) return socket.emit('message-delivered-error', { message: 'Message not found' });

      const chat = await Chat.findById(message.chat);
      if (!chat) return socket.emit('message-delivered-error', { message: 'Chat not found' });

      // For both 1:1 and group chats: persist per-user delivery using `deliveredBy`.
      try {
        if (!message.deliveredBy) message.deliveredBy = [];
        const alreadyDelivered = message.deliveredBy.map(d => String(d)).includes(String(userId));
        if (!alreadyDelivered) {
          try {
            message.deliveredBy.push(mongoose.Types.ObjectId(String(userId)));
          } catch (e) {
            // fallback to pushing raw value
            message.deliveredBy.push(userId);
          }
        }

        // Determine participant IDs for this chat
        let participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
        // Exclude sender from participant list when computing delivered/read-all
        participantIds = participantIds.filter(pid => pid !== String(message.sender));
        const uniqueDeliverers = (message.deliveredBy || []).map(d => String(d));

        // If everyone has delivered (or for 1:1 the recipient delivered), mark delivered
        if (participantIds.length > 0 && participantIds.every(pid => uniqueDeliverers.includes(pid))) {
          if (message.status !== 'delivered' && message.status !== 'read') {
            message.status = 'delivered';
          }
        }

        try {
          const before = message.deliveredBy.map(d => String(d));
          await message.save();
          const after = message.deliveredBy.map(d => String(d));
          console.log('[SOCKET] message-delivered persisted', { messageId: message._id, before, after, status: message.status });

          // Notify senders/personal rooms so their UI can show double tick
          try {
            const payload = { messageId: message._id, chatId: message.chat, deliveredBy: String(userId), updatedDeliveredBy: after };
            console.log('[SOCKET OUT] emitting message-delivered to sender', String(message.sender), payload);
            io.to(String(message.sender)).emit('message-delivered', payload);
          } catch (e) { console.error('Error emitting message-delivered to sender', e); }
        } catch (saveErr) {
          console.error('Error saving message after marking deliveredBy:', saveErr);
        }
      } catch (e) {
        console.error('Error persisting deliveredBy for message', e);
      }

      socket.emit('message-delivered-ack', { messageId });
    } catch (e) {
      console.error('Error in message-delivered socket handler', e);
      socket.emit('message-delivered-error', { message: e.message });
    }
  });

  // Message read: when a user opens a chat or reads messages
  socket.on('message-read', async (data) => {
    try {
      const { chatId } = data || {};
      let userId = socket.userId;
      // if socket.userId not set (e.g., setup not received yet), try to decode token from handshake
      if (!userId) {
        try {
          const token = socket.handshake?.auth?.token || (socket.handshake?.headers && (socket.handshake.headers.authorization || '').split(' ')[1]);
          if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded?.id || decoded?._id || decoded?.userId || decoded?.id;
            if (userId) socket.userId = String(userId);
          }
        } catch (e) {}
      }
      //console.log('[SOCKET IN] message-read received from', userId, 'payload:', data);
      if (!userId) return socket.emit('message-read-error', { message: 'Not authenticated' });
      if (!chatId) return socket.emit('message-read-error', { message: 'chatId required' });

      const chat = await Chat.findById(chatId).lean();
      if (!chat) return socket.emit('message-read-error', { message: 'Chat not found' });

      if (chat.isGroupChat) {
        // Add user to readBy for unread messages; set status to 'read' if everyone has read
        const msgs = await Message.find({ chat: chatId, $or: [ { readBy: { $exists: false } }, { readBy: { $nin: [userId] } } ] });
        const updatedIds = [];
        for (const m of msgs) {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.map(r => String(r)).includes(String(userId))) {
            m.readBy.push(userId);
          }
          let participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
          participantIds = participantIds.filter(pid => pid !== String(m.sender));
          const uniqueReaders = (m.readBy || []).map(r => String(r));
          if (participantIds.every(pid => uniqueReaders.includes(pid))) {
            m.status = 'read';
          }
          await m.save();
          updatedIds.push(m._id);
        }

        // notify participants so UI can show blue ticks where appropriate
        try {
          //console.log('[SOCKET OUT] emitting message-read to chat room', chatId, { reader: userId, updatedIds });
          socket.to(chatId).emit('message-read', { chatId, reader: userId, updatedIds });
        } catch (e) { console.error('emit chat room message-read error', e); }
        try {
          const participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
          participantIds.forEach(pid => {
            if (pid === String(userId)) return;
            try {
              console.log('[SOCKET OUT] emitting message-read to personal room', pid, { chatId, reader: userId, updatedIds });
              io.to(pid).emit('message-read', { chatId, reader: userId, updatedIds });
            } catch (e) { console.error('Error emitting message-read to personal room', e); }
          });
        } catch (e) {
          console.error('Error broadcasting message-read to personal rooms', e);
        }
      } else {
        // 1-on-1: use readBy array for consistency with group logic
        const msgs = await Message.find({ chat: chatId, $or: [ { readBy: { $exists: false } }, { readBy: { $nin: [userId] } } ] });
        const updatedIds = [];
        for (const m of msgs) {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.map(r => String(r)).includes(String(userId))) {
            m.readBy.push(userId);
            let participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
            participantIds = participantIds.filter(pid => pid !== String(m.sender));
            const uniqueReaders = (m.readBy || []).map(r => String(r));
            if (participantIds.every(pid => uniqueReaders.includes(pid))) {
              m.status = 'read';
            }
            await m.save();
            updatedIds.push(m._id);
          }
        }

        // notify participants so UI can show blue ticks where appropriate (for 1:1, this will notify the other user)
        try {
          console.log('[SOCKET OUT] emitting message-read to chat room (1:1)', chatId, { reader: userId, updatedIds });
          socket.to(chatId).emit('message-read', { chatId, reader: userId, updatedIds });
        } catch (e) { console.error('emit chat room message-read error (1:1)', e); }
        try {
          const participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
          participantIds.forEach(pid => {
            if (pid === String(userId)) return;
            try {
              console.log('[SOCKET OUT] emitting message-read to personal room (1:1)', pid, { chatId, reader: userId, updatedIds });
              io.to(pid).emit('message-read', { chatId, reader: userId, updatedIds });
            } catch (e) { console.error('Error emitting message-read to personal room (1:1)', e); }
          });
        } catch (e) {
          console.error('Error broadcasting message-read to personal rooms (1:1)', e);
        }
      }

      socket.emit('message-read-ack', { chatId });
    } catch (e) {
      console.error('Error in message-read socket handler', e);
      socket.emit('message-read-error', { message: e.message });
    }
  });

});