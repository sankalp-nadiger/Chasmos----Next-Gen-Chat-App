import 'dotenv/config';
import express from "express";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Chat from "./models/chat.model.js";
import User from "./models/user.model.js"; 
import colors from "colors";
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
import { notFound, errorHandler } from "./middleware/error.middleware.js"; 
import cors from 'cors';

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

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes); 
app.use("/api/contacts", contactRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/archive", archiveRoutes); 
app.use("/api/block", blockRoutes); 

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

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.userId = userData._id;
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

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

        users.forEach((user) => {
          const userId = user._id ? String(user._id) : String(user);
          const senderId = newMessageRecieved.sender?._id
            ? String(newMessageRecieved.sender._id)
            : String(newMessageRecieved.sender);

          if (userId === senderId) return;

          socket.in(userId).emit("message recieved", newMessageRecieved);
        });
      } catch (err) {
        console.error("Error in socket 'new message' handler:", err);
      }
    })();
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
        
        socket.to(chatId).emit("chat deleted", { chatId, deletedBy: userId });
      } else {
        if (!chat.users.includes(userId)) {
          socket.emit("delete chat error", { message: "Not authorized to delete this chat" });
          return;
        }

        await Message.deleteMany({ chat: chatId });
        await Chat.findByIdAndDelete(chatId);
        
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

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED", socket.id);
  });
});