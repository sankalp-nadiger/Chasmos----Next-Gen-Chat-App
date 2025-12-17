import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import Attachment from "../models/attachment.model.js";
import { deleteFileFromSupabase } from "../utils/supabaseHelper.js";
import path from "path";
import { getSocketIOInstance } from "../services/scheduledMessageCron.js";

export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("lastMessage");

  isChat = await User.populate(isChat, {
    path: "lastMessage.sender",
    select: "name avatar email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
      participants: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

export const fetchChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select("blockedUsers archivedChats");
    const blockedUserIds = user.blockedUsers || [];
    const archivedChatIds = user.archivedChats.map(archived => archived.chat.toString());

    const results = await Chat.find({ 
      users: { $elemMatch: { $eq: userId } },
      _id: { $nin: archivedChatIds },
      $or: [
        { isGroupChat: true },
        { 
          isGroupChat: false,
          users: { 
            $not: { 
              $elemMatch: { 
                $in: blockedUserIds 
              } 
            } 
          } 
        }
      ]
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .populate("admins", "name email avatar")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "lastMessage.sender",
      select: "name avatar email",
    });
    console.log(results);
    res.status(200).send(populatedResults);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users, description, isPublic } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  let parsedUsers;
  try {
    parsedUsers = JSON.parse(users);
  } catch {
    return res.status(400).json({ message: "Invalid users format" });
  }

  if (!Array.isArray(parsedUsers) || parsedUsers.length < 2) {
    return res.status(400).json({
      message: "More than 2 users are required to form a group chat",
    });
  }

  // ✅ avatar path from multer
  const avatar = req.file ? `/uploads/${req.file.filename}` : "";

  console.log("Uploaded file:", req.file);

  // ✅ ensure creator is included only once
  if (!parsedUsers.includes(req.user._id.toString())) {
    parsedUsers.push(req.user._id);
  }

  const groupChat = await Chat.create({
    chatName: name,
    users: parsedUsers,
    participants: parsedUsers,
    isGroupChat: true,
    groupAdmin: req.user._id,
    admins: [req.user._id],
    groupSettings: {
      description: description || "",
      avatar,
      isPublic: isPublic === "true",
    },
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  // Emit socket event to participants so other connected users update immediately
  try {
    const io = getSocketIOInstance();
    const participants = Array.isArray(fullGroupChat.participants) && fullGroupChat.participants.length ? fullGroupChat.participants : fullGroupChat.users || [];
    const payload = {
      _id: fullGroupChat._id,
      chatId: fullGroupChat._id,
      id: fullGroupChat._id,
      chatName: fullGroupChat.chatName,
      name: fullGroupChat.chatName,
      isGroupChat: true,
      users: fullGroupChat.users,
      participants,
      admins: fullGroupChat.admins || [],
      groupAdmin: fullGroupChat.groupAdmin || null,
      groupSettings: fullGroupChat.groupSettings || {},
    };

    console.log("[chat.controller] Emitting group created:", { ioAvailable: !!io, chatId: String(fullGroupChat._id), participantCount: (participants || []).length });

    if (io) {
      // Emit to chat room
      try { io.to(String(fullGroupChat._id)).emit("group created", payload); } catch (e) { console.error('emit to chat room failed', e); }

      // Also emit to each participant's personal room so sidebar updates
      (participants || []).forEach((u) => {
        const uid = u && (u._id ? u._id.toString() : (typeof u === 'string' ? u : (u.toString && u.toString())));
        if (uid) {
          try { io.to(String(uid)).emit("group created", payload); } catch (e) { console.error('emit to user room failed', uid, e); }
        }
      });
    }
  } catch (e) {
    console.error("Failed to emit group created socket event:", e);
  }

  res.status(200).json(fullGroupChat);
});


// export const renameGroup = asyncHandler(async (req, res) => {
//   const { chatId, chatName } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if user is admin
//   if (!chat.admins.includes(req.user._id)) {
//     res.status(403);
//     throw new Error("Only admins can rename the group");
//   }

//   const updatedChat = await Chat.findByIdAndUpdate(
//     chatId,
//     { chatName: chatName },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(updatedChat);
// });

// export const updateGroupSettings = asyncHandler(async (req, res) => {
//   const { chatId, description, avatar, isPublic, allowInvites } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if user is admin
//   if (!chat.admins.includes(req.user._id)) {
//     res.status(403);
//     throw new Error("Only admins can update group settings");
//   }

//   const updateData = {};
//   if (description !== undefined) updateData["groupSettings.description"] = description;
//   if (avatar !== undefined) updateData["groupSettings.avatar"] = avatar;
//   if (isPublic !== undefined) updateData["groupSettings.isPublic"] = isPublic;
//   if (allowInvites !== undefined) updateData["groupSettings.allowInvites"] = allowInvites;

//   const updatedChat = await Chat.findByIdAndUpdate(
//     chatId,
//     updateData,
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(updatedChat);
// });

// export const removeFromGroup = asyncHandler(async (req, res) => {
//   const { chatId, userId } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if user is admin or removing themselves
//   const isAdmin = chat.admins.includes(req.user._id);
//   const isSelf = userId === req.user._id.toString();

//   if (!isAdmin && !isSelf) {
//     res.status(403);
//     throw new Error("Only admins can remove other users");
//   }

//   // Prevent admin from removing themselves if they're the only admin
//   if (isSelf && isAdmin && chat.admins.length === 1) {
//     res.status(400);
//     throw new Error("You are the only admin. Assign another admin before leaving.");
//   }

//   const removed = await Chat.findByIdAndUpdate(
//     chatId,
//     {
//       $pull: { users: userId, participants: userId, admins: userId },
//     },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(removed);
// });

// export const addToGroup = asyncHandler(async (req, res) => {
//   const { chatId, userId } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if user is admin
//   if (!chat.admins.includes(req.user._id)) {
//     res.status(403);
//     throw new Error("Only admins can add users to the group");
//   }

//   // Check if user is already in group
//   if (chat.users.includes(userId)) {
//     res.status(400);
//     throw new Error("User is already in the group");
//   }

//   const added = await Chat.findByIdAndUpdate(
//     chatId,
//     {
//       $push: { users: userId, participants: userId },
//     },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(added);
// });

// export const addAdmin = asyncHandler(async (req, res) => {
//   const { chatId, userId } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if current user is admin
//   if (!chat.admins.includes(req.user._id)) {
//     res.status(403);
//     throw new Error("Only admins can add new admins");
//   }

//   // Check if target user is in the group
//   if (!chat.users.includes(userId)) {
//     res.status(400);
//     throw new Error("User is not in the group");
//   }

//   const updatedChat = await Chat.findByIdAndUpdate(
//     chatId,
//     {
//       $addToSet: { admins: userId },
//     },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(updatedChat);
// });

// export const removeAdmin = asyncHandler(async (req, res) => {
//   const { chatId, userId } = req.body;

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     res.status(404);
//     throw new Error("Chat Not Found");
//   }

//   // Check if current user is admin
//   if (!chat.admins.includes(req.user._id)) {
//     res.status(403);
//     throw new Error("Only admins can remove admins");
//   }

//   // Prevent removing the last admin
//   if (chat.admins.length === 1 && chat.admins[0].toString() === userId) {
//     res.status(400);
//     throw new Error("Cannot remove the only admin");
//   }

//   const updatedChat = await Chat.findByIdAndUpdate(
//     chatId,
//     {
//       $pull: { admins: userId },
//     },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("groupAdmin", "-password")
//     .populate("admins", "name email avatar");

//   res.json(updatedChat);
// });

export const getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId).select("archivedChats");
    const archivedChatIds = user.archivedChats.map(archived => archived.chat.toString());

    const chats = await Chat.find({ 
      participants: userId,
      _id: { $nin: archivedChatIds }
    })
      .sort({ updatedAt: -1 })
      .populate('participants', '_id name email avatar')
      .populate('users', '_id name email avatar')
      .populate('admins', '_id name email avatar')
      .populate('groupAdmin', '_id name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'attachments' } })
      .populate({ path: 'lastMessage.sender', select: '_id email name' })
      .lean();

    const formattedChats = chats.map((chat) => {
       const otherUser =
        (Array.isArray(chat.participants) &&
          chat.participants.find((p) => String(p._id) !== String(userId))) ||
        (Array.isArray(chat.participants) ? chat.participants[0] : null);

      let unread = 0;
      if (typeof chat.unreadCount === "number") {
        unread = chat.unreadCount;
      } else if (chat.unreadCount && typeof chat.unreadCount === "object") {
        unread = chat.unreadCount[String(userId)] || chat.unreadCount[userId] || 0;
      }

      let lastMessageText = "";
      if (chat.lastMessage) {
        const msg = chat.lastMessage;
        // Skip system messages for chat preview
        if (msg.type === 'system') {
          lastMessageText = "";
        } else {
          const text = (msg.content || msg.text || "").toString().trim();
          const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
          if (text && text.length > 0) {
            const preview = text.split(/\s+/).slice(0, 8).join(" ");
            lastMessageText = hasAttachments ? `${preview} 📎` : preview;
          } else if (hasAttachments) {
            const att = msg.attachments[0];
            let filename = att.fileName || att.file_name || att.filename || "";
            if (!filename && att.fileUrl) {
              try {
                filename = path.basename(new URL(att.fileUrl).pathname);
              } catch (e) {
                filename = path.basename(att.fileUrl || "");
              }
            }
            filename = filename.replace(/^[\d\-:.]+_/, "");
            lastMessageText = filename || "Attachment";
          }
        }
      }

      // For group chats, return all members; for 1-on-1, return the other user
      const chatData = {
        chatId: chat._id,
        lastMessage: lastMessageText || "Say hi!",
        timestamp: chat.updatedAt || chat.timestamp,
        unreadCount: unread,
        isGroupChat: !!chat.isGroupChat,
        chatName: chat.chatName,
      };

      if (chat.isGroupChat) {
        // Group chat: include all members, admins, and group admin
        chatData.users = chat.users || chat.participants || [];
        chatData.admins = chat.admins || [];
        chatData.groupAdmin = chat.groupAdmin || null;
        chatData.groupSettings = chat.groupSettings || {};
      } else {
        // 1-on-1 chat: include participants and otherUser for backward compatibility
        chatData.participants = chat.participants;
        chatData.otherUser = {
          id: otherUser?._id ? String(otherUser._id) : null,
          username: otherUser?.name || otherUser?.email || null,
          email: otherUser?.email || null,
          avatar: otherUser?.avatar || null,
          isOnline: !!otherUser?.isOnline,
        };
      }

      return chatData;
    });
    console.log("Recent chats fetched:", formattedChats);
    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent chats" });
  }
};

export const deleteChat = asyncHandler(async (req, res) => {
  console.log("Delete chat request received");
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  console.log("Chat found:", chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (chat.isGroupChat) {
    // Compare ObjectIds as strings to avoid type mismatch
    if (!chat.admins.map(String).includes(String(userId))) {
      console.log("User is not admin, cannot delete group chat");
      res.status(403);
      throw new Error("Only admins can delete group chats");
    }
    
    // Get all messages with attachments
    const messages = await Message.find({ chat: chatId }).populate('attachments');
    
    // Delete all attachments
    for (const message of messages) {
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          try {
            // Extract file path from URL for deletion
            if (attachment.fileUrl) {
              const urlParts = attachment.fileUrl.split('/');
              const bucketIndex = urlParts.findIndex(part => part === 'storage');
              if (bucketIndex !== -1 && urlParts[bucketIndex + 2]) {
                const bucket = urlParts[bucketIndex + 2];
                const filePath = urlParts.slice(bucketIndex + 3).join('/');
                
                // Delete file from Supabase storage
                await deleteFileFromSupabase(filePath, bucket);
              }
            }
            
            // Delete attachment document from database
            await Attachment.findByIdAndDelete(attachment._id);
          } catch (err) {
            console.error(`Failed to delete attachment ${attachment._id}:`, err.message);
            // Continue with other attachments even if one fails
          }
        }
      }
    }
    
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    console.log("Group chat deleted successfully");
    // Emit socket event to participants so they can remove the chat from UI
    try {
      const io = getSocketIOInstance();
      if (io) {
        // notify chat room
        try { io.to(String(chatId)).emit('chat deleted', { chatId: String(chatId) }); } catch (e) { console.error('emit chat deleted to room failed', e); }

        // notify each user individually
        const participants = chat.participants && chat.participants.length ? chat.participants : chat.users || [];
        (participants || []).forEach(p => {
          const uid = p && (p._id ? String(p._id) : (typeof p === 'string' ? p : (p.toString && p.toString())));
          if (uid) {
            try { io.to(uid).emit('chat deleted', { chatId: String(chatId) }); } catch (e) { console.error('emit chat deleted to user failed', uid, e); }
          }
        });
      }
    } catch (e) {
      console.error('Failed to emit chat deleted event:', e);
    }
    res.status(200).json({
      message: "Group chat deleted successfully",
      chatId: chatId
    });
  } else {
    if (!chat.users.includes(userId)) {
      res.status(403);
      throw new Error("Not authorized to delete this chat");
    }

    // Get all messages with attachments
    const messages = await Message.find({ chat: chatId }).populate('attachments');
    
    // Delete all attachments
    for (const message of messages) {
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          try {
            // Extract file path from URL for deletion
            if (attachment.fileUrl) {
              const urlParts = attachment.fileUrl.split('/');
              const bucketIndex = urlParts.findIndex(part => part === 'storage');
              if (bucketIndex !== -1 && urlParts[bucketIndex + 2]) {
                const bucket = urlParts[bucketIndex + 2];
                const filePath = urlParts.slice(bucketIndex + 3).join('/');
                
                // Delete file from Supabase storage
                await deleteFileFromSupabase(filePath, bucket);
              }
            }
            
            // Delete attachment document from database
            await Attachment.findByIdAndDelete(attachment._id);
          } catch (err) {
            console.error(`Failed to delete attachment ${attachment._id}:`, err.message);
            // Continue with other attachments even if one fails
          }
        }
      }
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    console.log("Chat deleted successfully");
    // Emit socket event to participants so they can remove the chat from UI
    try {
      const io = getSocketIOInstance();
      if (io) {
        try { io.to(String(chatId)).emit('chat deleted', { chatId: String(chatId) }); } catch (e) { console.error('emit chat deleted to room failed', e); }
        const participants = chat.participants && chat.participants.length ? chat.participants : chat.users || [];
        (participants || []).forEach(p => {
          const uid = p && (p._id ? String(p._id) : (typeof p === 'string' ? p : (p.toString && p.toString())));
          if (uid) {
            try { io.to(uid).emit('chat deleted', { chatId: String(chatId) }); } catch (e) { console.error('emit chat deleted to user failed', uid, e); }
          }
        });
      }
    } catch (e) {
      console.error('Failed to emit chat deleted event:', e);
    }
    res.status(200).json({
      message: "Chat deleted successfully",
      chatId: chatId
    });
  }
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("This is not a group chat");
  }

  if (!chat.users.includes(userId)) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Check if user is the only admin
  if (chat.admins.includes(userId) && chat.admins.length === 1) {
    res.status(400);
    throw new Error("You are the only admin. Assign another admin before leaving.");
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
    
    res.status(200).json({
      message: "You have left the group and the group has been deleted as it has no members",
      chatId: chatId
    });
  } else {
    res.status(200).json({
      message: "You have left the group successfully",
      chat: updatedChat
    });
  }
});

export const joinGroupByInvite = asyncHandler(async (req, res) => {
  const { inviteLink } = req.body;

  const chat = await Chat.findOne({ "groupSettings.inviteLink": inviteLink });
  
  if (!chat) {
    res.status(404);
    throw new Error("Invalid invite link");
  }

  if (!chat.groupSettings.allowInvites) {
    res.status(403);
    throw new Error("This group is not accepting new members");
  }

  if (chat.users.includes(req.user._id)) {
    res.status(400);
    throw new Error("You are already a member of this group");
  }

  // Check group size limit
  if (chat.users.length >= chat.groupSettings.maxMembers) {
    res.status(400);
    throw new Error("Group has reached maximum member limit");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chat._id,
    {
      $addToSet: { users: req.user._id, participants: req.user._id },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  res.json({
    message: "Successfully joined the group",
    chat: updatedChat
  });
});

export const getGroupChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  try {
   // Backend: controllers/chatController.js
const groupChat = await Chat.findById(chatId)
  .populate("participants", "_id name email avatar") // ✅ populate members
  .populate("admins", "_id name email avatar")      // populate admins
  .populate("groupAdmin", "_id name email avatar"); // populate creator


    if (!groupChat || !groupChat.isGroupChat) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(groupChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch group chat" });
  }
});