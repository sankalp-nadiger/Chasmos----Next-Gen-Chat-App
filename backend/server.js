import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true})
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error(err));
