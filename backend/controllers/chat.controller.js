import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import path from "path";

export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  const currentUser = await User.findById(req.user._id);
  const targetUser = await User.findById(userId);
  
  if (currentUser.blockedUsers.includes(userId) || targetUser.blockedUsers.includes(req.user._id)) {
    res.status(403);
    throw new Error("Cannot access chat with blocked user");
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
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "lastMessage.sender",
      select: "name avatar email",
    });
    
    res.status(200).send(populatedResults);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      participants: users,
      isGroupChat: true,
      groupAdmin: req.user,
      admins: [req.user._id]
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("admins", "name email avatar");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId, participants: userId, admins: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId, participants: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

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

      return {
        chatId: chat._id,
        participants: chat.participants,
        lastMessage: lastMessageText || "Say hi!",
        timestamp: chat.updatedAt || chat.timestamp,
        unreadCount: unread,
        otherUser: {
          id: otherUser?._id ? String(otherUser._id) : null,
          username: otherUser?.name || otherUser?.email || null,
          email: otherUser?.email || null,
          avatar: otherUser?.avatar || null,
          isOnline: !!otherUser?.isOnline,
        },
      };
    });
    
    console.log("Formatted Recent Chats:", formattedChats);
    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent chats" });
  }
};

export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (chat.isGroupChat) {
    if (!chat.admins.includes(userId)) {
      res.status(403);
      throw new Error("Only admins can delete group chats");
    }
    
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    
    res.status(200).json({
      message: "Group chat deleted successfully",
      chatId: chatId
    });
  } else {
    if (!chat.users.includes(userId)) {
      res.status(403);
      throw new Error("Not authorized to delete this chat");
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    
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
    if (updatedChat.admins.length === 0 && updatedChat.users.length > 0) {
      updatedChat.admins = [updatedChat.users[0]._id];
      updatedChat.groupAdmin = updatedChat.users[0]._id;
      await updatedChat.save();
    }
    
    res.status(200).json({
      message: "You have left the group successfully",
      chat: updatedChat
    });
  }
});