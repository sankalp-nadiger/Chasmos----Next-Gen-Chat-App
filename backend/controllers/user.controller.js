import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Protected
export const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("-password"); // Don't send password field

  res.status(200).json(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber, avatar } = req.body;

  // Validate required fields
  if (!name || !email || !password || !phoneNumber) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  // Check if user already exists (by email or phone)
  const userExists = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { phoneNumber: phoneNumber }
    ]
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email or phone number");
  }

  // Create new user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phoneNumber,
    avatar: avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});

//@description     Auth the user
//@route           POST /api/user/login
//@access          Public
export const authUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, password } = req.body;
  // Validate required fields
  if (!emailOrPhone || !password) {
    res.status(400);
    throw new Error("Please provide email/phone and password");
  }

  // Find user by email or phone (case insensitive for email)
  let user = null;
  if (emailOrPhone.includes("@")) {
    user = await User.findOne({ email: emailOrPhone.toLowerCase().trim() });
  } else {
    user = await User.findOne({ phoneNumber: emailOrPhone.trim() });
  }

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email/phone or password");
  }
});

//@description     Get user profile
//@route           GET /api/user/profile
//@access          Protected
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//@description     Update user profile
//@route           PUT /api/user/profile
//@access          Protected
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.pic = req.body.pic || user.pic;

    // Only update password if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters long");
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      pic: updatedUser.pic,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});