import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";
import { isOnline, getOnlineList } from "../services/onlineUsers.js";
import { uploadBase64ImageToSupabase } from "../utils/uploadToSupabase.js";

// export const allUsers = asyncHandler(async (req, res) => {
//   const keyword = req.query.search
//     ? {
//         $or: [
//           { name: { $regex: req.query.search, $options: "i" } },
//           { email: { $regex: req.query.search, $options: "i" } },
//         ],
//       }
//     : {};

//   const users = await User.find(keyword)
//     .find({ _id: { $ne: req.user._id } })
//     .select("-password"); // Don't send password field

//   res.status(200).json(users);
// });
export const allUsers = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();

  let users = [];

  if (!search) {
    users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password -__v"
    );
    const onlineIds = getOnlineList();
    const usersWithStatus = users.map((u) => ({
      ...(typeof u.toObject === "function" ? u.toObject() : u),
      online: onlineIds.includes(String(u._id)),
    }));
    return res.status(200).json(usersWithStatus);
  }

  if (search.includes("@")) {
    const user = await User.findOne({ email: search.toLowerCase() }).select(
      "-password -__v"
    );
    if (user && user._id.toString() !== req.user._id.toString()) {
      const onlineIds = getOnlineList();
      const userObj = typeof user.toObject === "function" ? user.toObject() : user;
      userObj.online = onlineIds.includes(String(user._id));
      return res.status(200).json([userObj]); // return array for compatibility
    }
  }

  users = await User.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
    _id: { $ne: req.user._id },
  }).select("-password -__v");

  const onlineIds = getOnlineList();
  const usersWithStatus = users.map((u) => ({
    ...(typeof u.toObject === "function" ? u.toObject() : u),
    online: onlineIds.includes(String(u._id)),
  }));

  res.status(200).json(usersWithStatus);
});


export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phoneNumber,
    avatar,
    bio,

    // BUSINESS
    isBusiness,
    businessCategory,
  } = req.body;

  // ✅ Validate required fields
  if (!name || !email || !password || !phoneNumber) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  }

  // ✅ Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  // ✅ Validate password
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  // ✅ Check if user already exists
  const userExists = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phoneNumber }],
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email or phone number");
  }

  // ✅ Use default avatar if none provided
  const avatarUrl =
    avatar ||
    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

  // ✅ Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phoneNumber,
    bio: bio || "Hey there! I am using Chasmos.",
    avatar: avatarUrl,
    // BUSINESS
    isBusiness: Boolean(isBusiness),
    businessCategory: isBusiness ? businessCategory : "",
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      bio: user.bio,
      isBusiness: user.isBusiness,
      businessCategory: user.businessCategory,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});


// export const registerUser = asyncHandler(async (req, res) => {
//   const { name, email, password, phoneNumber, avatar, bio } = req.body;

//   // Validate required fields
//   if (!name || !email || !password || !phoneNumber) {
//     res.status(400);
//     throw new Error("Please enter all the required fields");
//   }

//   // Validate email format
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     res.status(400);
//     throw new Error("Please enter a valid email address");
//   }

//   // Validate password strength (minimum 6 characters)
//   if (password.length < 6) {
//     res.status(400);
//     throw new Error("Password must be at least 6 characters long");
//   }

//   // Check if user already exists (by email or phone)
//   const userExists = await User.findOne({
//     $or: [{ email: email.toLowerCase() }, { phoneNumber: phoneNumber }],
//   });

//   if (userExists) {
//     res.status(400);
//     throw new Error("User already exists with this email or phone number");
//   }

//   // Create new user
//   const user = await User.create({
//     name: name.trim(),
//     email: email.toLowerCase().trim(),
//     password,
//     phoneNumber,
//     bio: bio || "Hey there! I am using Chasmos.",
//     avatar:
//       avatar ||
//       "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//   });

//   if (user) {
//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isAdmin: user.isAdmin,
//       avatar: user.avatar,
//       phoneNumber: user.phoneNumber,
//       bio: user.bio,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(400);
//     throw new Error("Failed to create user");
//   }
// });

export const authUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, password } = req.body;
  if (!emailOrPhone || !password) {
    res.status(400);
    throw new Error("Please provide email/phone and password");
  }

  let user = null;
  if (emailOrPhone.includes("@")) {
    user = await User.findOne({ email: emailOrPhone.toLowerCase().trim() });
  } else {
    user = await User.findOne({ phoneNumber: emailOrPhone.trim() });
  }

  if (user && (await user.matchPassword(password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      isBusiness: user.isBusiness,
      businessCategory: user.businessCategory,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email/phone or password");
  }
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    
    
  // ✅ SUPABASE AVATAR UPLOAD (ONLY CHANGE)
  if (req.body.avatarBase64) {
    user.avatar = await uploadBase64ImageToSupabase(
      req.body.avatarBase64,
      "avatars",
      "users"
    );
  }
    
  // ✅ SUPABASE AVATAR UPLOAD (ONLY CHANGE)
  if (req.body.avatarBase64) {
    user.avatar = await uploadBase64ImageToSupabase(
      req.body.avatarBase64,
      "avatars",
      "users"
    );
  }

    // BUSINESS update (optional)
    if (req.body.isBusiness !== undefined) {
      user.isBusiness = Boolean(req.body.isBusiness);
      user.businessCategory = user.isBusiness ? req.body.businessCategory : "";
    }

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
       avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      isAdmin: updatedUser.isAdmin,
      isBusiness: updatedUser.isBusiness,
      businessCategory: updatedUser.businessCategory,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});


// Get user settings
export const getUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("settings");

  if (user) {
    res.status(200).json({
      notifications: user.settings?.notifications ?? true,
      sound: user.settings?.sound ?? true,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update user settings
export const updateUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }

    // Update settings fields if provided
    if (req.body.notifications !== undefined) {
      user.settings.notifications = req.body.notifications;
    }
    if (req.body.sound !== undefined) {
      user.settings.sound = req.body.sound;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      notifications: updatedUser.settings.notifications,
      sound: updatedUser.settings.sound,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});



export const sendChatRequest = asyncHandler(async (req, res) => {
  const { recipientEmail, inviteMessage, requestType } = req.body;
  const me = await User.findById(req.user._id);
  const recipient = await User.findOne({ email: recipientEmail });

  if (!me || !recipient) {
    res.status(404);
    throw new Error("User not found");
  }

  me.sentChatRequests = me.sentChatRequests || [];
  recipient.receivedChatRequests = recipient.receivedChatRequests || [];

  // Prevent duplicates
  if (!me.sentChatRequests.some(r => r.email.toLowerCase() === recipientEmail.toLowerCase())) {
    me.sentChatRequests.push({ email: recipientEmail, message: inviteMessage, type: requestType });
    recipient.receivedChatRequests.push({ email: me.email, message: inviteMessage, type: requestType });
  }

  await me.save();
  await recipient.save();

  res.json({ message: "Chat request sent", status: "outgoing" });
});



export const acceptChatRequest = asyncHandler(async (req, res) => {
  const senderEmail = req.body.senderEmail.toLowerCase().trim();
  const me = await User.findById(req.user._id);
  const sender = await User.findOne({ email: senderEmail });

  if (!me || !sender) {
    res.status(404);
    throw new Error("User not found");
  }

  // Remove received request from me
  me.receivedChatRequests = me.receivedChatRequests?.filter(r => r.email.toLowerCase() !== senderEmail);
  me.acceptedChatRequests = me.acceptedChatRequests || [];
  if (!me.acceptedChatRequests.includes(senderEmail)) me.acceptedChatRequests.push(senderEmail);

  // Remove sent request from sender
  sender.sentChatRequests = sender.sentChatRequests?.filter(r => r.email.toLowerCase() !== me.email.toLowerCase());
  sender.acceptedChatRequests = sender.acceptedChatRequests || [];
  if (!sender.acceptedChatRequests.includes(me.email.toLowerCase())) sender.acceptedChatRequests.push(me.email.toLowerCase());

  await me.save();
  await sender.save();

  // Notify real-time (if socket is connected)
  if (typeof socket !== "undefined" && socket?.emit) {
    socket.emit("chatAccepted", { senderEmail, receiverEmail: me.email });
  }

  res.json({ message: "Chat request accepted", status: "accepted" });
});



// GET /api/user/request/status/:email
export const getChatRequestStatus = asyncHandler(async (req, res) => {
  const otherEmail = req.params.email.toLowerCase().trim();
  const type = req.query.type || "user";

  const me = await User.findById(req.user._id);
  if (!me) return res.status(404).json({ message: "User not found" });

  const targetUser = await User.findOne({
    email: otherEmail,
    ...(type === "business" ? { isBusiness: true } : {}),
  });
  if (!targetUser) return res.status(404).json({ message: "Target user not found" });

  const myEmailLower = me.email.toLowerCase();

  // Accepted if either side has each other in acceptedChatRequests
  const acceptedByMe = me.acceptedChatRequests?.includes(otherEmail);
  const acceptedByTarget = targetUser.acceptedChatRequests?.includes(myEmailLower);
  if (acceptedByMe || acceptedByTarget) return res.json({ status: "accepted" });

  // Outgoing: I sent
  if (me.sentChatRequests?.some(r => (r.email || "").toLowerCase() === otherEmail)) return res.json({ status: "outgoing" });

  // Incoming: I received
  if (me.receivedChatRequests?.some(r => (r.email || "").toLowerCase() === otherEmail)) return res.json({ status: "incoming" });

  return res.json({ status: "none" });
});




// Fetch accepted chat requests that other users accepted which were sent by the current user
export const getAcceptedChatRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const acceptedEmails = user.acceptedChatRequests || [];

  const users = await User.find({
    email: { $in: acceptedEmails },
  }).select("_id name email avatar");

  res.json(users);
});


// Get list of received chat requests for current user
// export const getReceivedChatRequests = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id).select("receivedChatRequests");
//   if (!user) {
//     res.status(404);
//     throw new Error("User not found");
//   }

//   res.status(200).json(user.receivedChatRequests || []);
// });
export const getReceivedChatRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("receivedChatRequests");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const normalizedRequests = (user.receivedChatRequests || []).map((r) =>
    typeof r === "string" ? { email: r, message: "", date: null } : r
  );

  const detailedRequests = await Promise.all(
    normalizedRequests.map(async (reqItem) => {
      const sender = await User.findOne({ email: reqItem.email }).select("name email avatar");
      return {
        email: reqItem.email,
        name: sender?.name || reqItem.email.split("@")[0],
        avatar:
          sender?.avatar ||
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        message: reqItem.message || "",
        date: reqItem.date,
      };
    })
  );

  res.status(200).json(detailedRequests);
});

export const withdrawChatRequest = asyncHandler(async (req, res) => {
  const { recipientEmail } = req.body;

  if (!recipientEmail) {
    res.status(400);
    throw new Error("Please provide recipientEmail");
  }

  const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
  if (!recipient) {
    res.status(404);
    throw new Error("Recipient not found");
  }

  recipient.receivedChatRequests = recipient.receivedChatRequests.filter(
    (r) => r.email.toLowerCase() !== req.user.email.toLowerCase()
  );
  await recipient.save();

  const sender = await User.findById(req.user._id);
  if (sender) {
    sender.sentChatRequests = sender.sentChatRequests.filter(
      (r) => r.email.toLowerCase() !== recipientEmail.toLowerCase()
    );
    await sender.save();
  }

  res.status(200).json({ message: "Chat request withdrawn successfully" });
});

// POST /api/user/request/reject
export const rejectChatRequest = asyncHandler(async (req, res) => {
  const { senderEmail } = req.body;

  if (!senderEmail) {
    res.status(400);
    throw new Error("senderEmail is required");
  }

  const receiver = await User.findById(req.user._id);
  const sender = await User.findOne({ email: senderEmail.toLowerCase().trim() });

  if (!receiver || !sender) {
    res.status(404);
    throw new Error("User not found");
  }

  // Remove from receiver.received
  receiver.receivedChatRequests = receiver.receivedChatRequests.filter(
    (r) => r?.email?.toLowerCase() !== senderEmail.toLowerCase()
  );

  // Remove from sender.sent
  sender.sentChatRequests = sender.sentChatRequests.filter(
    (r) => r?.email?.toLowerCase() !== receiver.email.toLowerCase()
  );

  await receiver.save();
  await sender.save();

  res.status(200).json({ message: "Chat request rejected" });
});


/**
 * GET all business accounts
 */
export const getBusinessUsers = async (req, res) => {
  try {
    const businesses = await User.find({ isBusiness: true })
      .select("name avatar bio businessCategory acceptedChatRequests sentChatRequests receivedChatRequests email") // include necessary fields
      .sort({ createdAt: -1 });

    // Category count
    const categoryCounts = businesses.reduce((acc, user) => {
      const cat = user.businessCategory || "Other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      businesses,
      categoryCounts,
      total: businesses.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch business users" });
  }
};

