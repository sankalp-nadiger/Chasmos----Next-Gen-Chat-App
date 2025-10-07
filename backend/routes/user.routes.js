import express from "express";
import {
 registerUser,
 authUser,
 allUsers,
 } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(protect, allUsers).post(registerUser);
router.post("/login", authUser);

export default router;