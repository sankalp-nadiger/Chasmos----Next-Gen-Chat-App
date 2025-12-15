import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";

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
    // No search → return all except current user
    users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password -__v"
    );
    return res.status(200).json(users);
  }

  // If search is an email → exact match
  if (search.includes("@")) {
    const user = await User.findOne({ email: search.toLowerCase() }).select(
      "-password -__v"
    );
    if (user && user._id.toString() !== req.user._id.toString()) {
      return res.status(200).json([user]); // return array for compatibility
    }
    // fallback to fuzzy search if exact not found
  }

  // Fuzzy search on name or email
  users = await User.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
    _id: { $ne: req.user._id },
  }).select("-password -__v");

  res.status(200).json(users);
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber, avatar, bio } = req.body;

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
    $or: [{ email: email.toLowerCase() }, { phoneNumber: phoneNumber }],
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
    bio: bio || "Hey there! I am using Chasmos.",
    avatar:
      avatar ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});

export const authUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, password } = req.body;
  // Validate required fields
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
    user.pic = req.body.pic || user.pic;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

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
      bio: updatedUser.bio,
      isAdmin: updatedUser.isAdmin,
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

// Send a chat/invite request to another user (adds sender's email to recipient.receivedChatRequests)
// export const sendChatRequest = asyncHandler(async (req, res) => {
//   const { recipientEmail } = req.body;

//   if (!recipientEmail) {
//     res.status(400);
//     throw new Error("Please provide recipientEmail");
//   }

//   // Prevent sending request to self
//   if (
//     recipientEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim()
//   ) {
//     res.status(400);
//     throw new Error("You cannot send a chat request to yourself");
//   }

//   const recipient = await User.findOne({
//     email: recipientEmail.toLowerCase().trim(),
//   });
//   if (!recipient) {
//     res.status(404);
//     throw new Error("Recipient user not found");
//   }

//   recipient.receivedChatRequests = recipient.receivedChatRequests || [];

//   // Avoid duplicate requests
//   if (recipient.receivedChatRequests.includes(req.user.email)) {
//     res.status(400);
//     throw new Error("Chat request already sent to this user");
//   }

//   recipient.receivedChatRequests.push(req.user.email);
//   await recipient.save();

//   // Also record the sent request for the sender
//   const sender = await User.findById(req.user._id);
//   if (sender) {
//     sender.sentChatRequests = sender.sentChatRequests || [];
//     if (!sender.sentChatRequests.includes(recipientEmail)) {
//       sender.sentChatRequests.push(recipientEmail);
//       await sender.save();
//     }
//   }

//   res.status(200).json({ message: "Chat request sent" });
// });

export const sendChatRequest = asyncHandler(async (req, res) => {
  const { recipientEmail, inviteMessage } = req.body;

  if (!recipientEmail) {
    res.status(400);
    throw new Error("Please provide recipientEmail");
  }

  const sender = await User.findById(req.user._id);
  const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });

  if (!recipient) {
    res.status(404);
    throw new Error("Recipient user not found");
  }

  // Prevent sending to yourself
  if (recipient.email === sender.email) {
    res.status(400);
    throw new Error("You cannot send a chat request to yourself");
  }

  // -------------------------
  //  1. Check if already connected (accepted)
  // -------------------------
  const isAlreadyConnected =
    sender.acceptedChatRequests?.includes(recipient.email) ||
    recipient.acceptedChatRequests?.includes(sender.email);

  if (isAlreadyConnected) {
    res.status(409);
    throw new Error("You are already connected with this user");
  }

  // -------------------------
  //  2. Check if sender already sent one
  // -------------------------
  const alreadySent = sender.sentChatRequests?.some(
    (reqItem) => reqItem.email.toLowerCase() === recipient.email.toLowerCase()
  );

  if (alreadySent) {
    res.status(409);
    throw new Error("You have already sent a chat request to this user");
  }

  // -------------------------
  //  3. Check if recipient already sent one (reverse direction)
  // -------------------------
  const reversePending = recipient.sentChatRequests?.some(
    (reqItem) => reqItem.email.toLowerCase() === sender.email.toLowerCase()
  );

  if (reversePending) {
    res.status(409);
    throw new Error("This user has already sent you a chat request");
  }

  // -------------------------
  //  If no previous invites → create new pending request
  // -------------------------

  // Add to recipient (received)
  recipient.receivedChatRequests.push({
    email: sender.email,
    message: inviteMessage || "",
    date: new Date(),
  });
  await recipient.save();

  // Add to sender (sent)
  sender.sentChatRequests.push({
    email: recipient.email,
    message: inviteMessage || "",
    date: new Date(),
  });
  await sender.save();

  res.status(200).json({ message: "Chat request sent successfully" });
});



export const acceptChatRequest = asyncHandler(async (req, res) => {
  const { senderEmail } = req.body;

  if (!senderEmail) {
    res.status(400);
    throw new Error("senderEmail required");
  }

  const receiver = await User.findById(req.user._id);
  const sender = await User.findOne({
    email: senderEmail.toLowerCase().trim(),
  });

  if (!receiver || !sender) {
    res.status(404);
    throw new Error("Sender or receiver not found");
  }


  // ---------------- REMOVE PENDING REQUESTS ----------------
  receiver.receivedChatRequests = receiver.receivedChatRequests.filter(
    (r) => r?.email?.toLowerCase() !== sender.email.toLowerCase()
  );

  sender.sentChatRequests = sender.sentChatRequests.filter(
    (r) => r?.email?.toLowerCase() !== receiver.email.toLowerCase()
  );

  // ---------------- ADD ACCEPTED ONLY FOR SENDER (who sent the invite) ----------------
  if (!sender.acceptedChatRequests.includes(receiver.email)) {
    sender.acceptedChatRequests.push(receiver.email);
  }

  await receiver.save();
  await sender.save();

  // ---------------- RESPONSE ----------------
  res.status(200).json({
    message: "Chat request accepted",
    acceptedChat: {
      email: sender.email,
      name: sender.name,
      avatar: sender.avatar,
    },
  });
});


// GET /api/user/request/status/:email
export const getChatRequestStatus = asyncHandler(async (req, res) => {
  const otherEmail = req.params.email.toLowerCase().trim();
  const me = await User.findById(req.user._id);

  if (!me) {
    res.status(404);
    throw new Error("User not found");
  }

  if (me.acceptedChatRequests?.includes(otherEmail)) {
    return res.json({ status: "accepted" });
  }

  if (me.sentChatRequests?.some(r => r.email.toLowerCase() === otherEmail)) {
    return res.json({ status: "outgoing" });
  }

  if (me.receivedChatRequests?.some(r => r.email.toLowerCase() === otherEmail)) {
    return res.json({ status: "incoming" });
  }

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
