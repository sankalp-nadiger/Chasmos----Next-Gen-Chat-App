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
import documentRoutes from "./routes/document.route.js";
import archiveRoutes from "./routes/archive.routes.js"; 
import blockRoutes from "./routes/block.routes.js"; 
import { notFound, errorHandler } from "./middleware/error.middleware.js"; 
import cors from 'cors';

// dotenv is loaded via the top-level import 'dotenv/config'
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

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes); 
app.use("/api/contacts", contactRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/archive", archiveRoutes); 
app.use("/api/block", blockRoutes); 

// Error Handling middlewares
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
    socket.userId = userData._id; // Store userId for later use
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

        // If chat is an id (string) or not populated, try fetching it from DB
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

        // NEW: Check block status for one-on-one chats
        if (!chat.isGroupChat) {
          const senderId = newMessageRecieved.sender?._id
            ? String(newMessageRecieved.sender._id)
            : String(newMessageRecieved.sender);
            
          const otherUser = chat.users.find(user => 
            String(user._id) !== senderId
          );
          
          if (otherUser && otherUser.blockedUsers && 
              otherUser.blockedUsers.includes(senderId)) {
            // Don't deliver message if sender is blocked
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

  // NEW: Socket events for block and archive
  socket.on("block user", async (data) => {
    try {
      const { userId } = data;
      const currentUserId = socket.userId;
      
      if (!currentUserId) {
        socket.emit("block error", { message: "User not authenticated" });
        return;
      }
      
      // Update user's blocked list
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: userId }
      });
      
      // Archive any existing one-on-one chats
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: currentUserId } } },
          { users: { $elemMatch: { $eq: userId } } }
        ]
      });

      if (existingChat) {
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: {
            archivedChats: {
              chat: existingChat._id,
              archivedAt: new Date()
            }
          }
        });
      }
      
      // Notify both users about the block
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