import 'dotenv/config';
import express from "express";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Chat from "./models/chat.model.js";
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
//import { notFound, errorHandler } from "./middleware/auth.middleware.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js"; 
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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
app.use("/api/contacts", contactRoutes); // contact routes
app.use("/api/document", documentRoutes);
app.use("/api/upload", uploadRoutes);
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
              .select("users participants")
              .lean();
          } catch (e) {
            console.error("Failed to load chat from DB in socket handler", e);
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

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED", socket.id);
  });
});