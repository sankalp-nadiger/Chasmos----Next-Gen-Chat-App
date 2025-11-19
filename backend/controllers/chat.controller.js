import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import path from "path";
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
    const results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
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
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

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
    .populate("groupAdmin", "-password");

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
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

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
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

//Fetch recent chats
// GET /api/chat/recent
export const getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id; 

    // Find all chats where the user is a participant
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 }) // recent chats first
      // populate useful user fields that actually exist on the User model
      .populate('participants', '_id name email avatar')
      // ensure lastMessage (Message doc) is populated so we can read its content
      // and also populate attachments inside lastMessage so we can show filenames
      .populate({ path: 'lastMessage', populate: { path: 'attachments' } })
      // then populate the sender inside lastMessage if present
      .populate({ path: 'lastMessage.sender', select: '_id email name' })
      .lean();

    // Map chats for frontend
    const formattedChats = chats.map((chat) => {
      const otherUser =
        (Array.isArray(chat.participants) &&
          chat.participants.find((p) => String(p._id) !== String(userId))) ||
        (Array.isArray(chat.participants) ? chat.participants[0] : null);

      // normalize unreadCount: support both numeric and object keyed by user id
      let unread = 0;
      if (typeof chat.unreadCount === "number") {
        unread = chat.unreadCount;
      } else if (chat.unreadCount && typeof chat.unreadCount === "object") {
        unread = chat.unreadCount[String(userId)] || chat.unreadCount[userId] || 0;
      }

      // Determine last message preview. Prefer textual content; if none,
      // fall back to filename from first attachment (stripping timestamp_ prefixes).
      let lastMessageText = "";
      if (chat.lastMessage) {
        const msg = chat.lastMessage;
        const text = (msg.content || msg.text || "").toString().trim();

        const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;

        if (text && text.length > 0) {
          // show first few words (up to 8) and append a paperclip indicator if attachments exist
          const preview = text.split(/\s+/).slice(0, 8).join(" ");
          lastMessageText = hasAttachments ? `${preview} 📎` : preview;
        } else if (hasAttachments) {
          const att = msg.attachments[0];
          // try common filename fields, fall back to basename of URL
          let filename = att.fileName || att.file_name || att.filename || "";
          if (!filename && att.fileUrl) {
            try {
              filename = path.basename(new URL(att.fileUrl).pathname);
            } catch (e) {
              filename = path.basename(att.fileUrl || "");
            }
          }

          // strip common timestamp prefixes like 1687452345_ or 20230703_ etc
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
