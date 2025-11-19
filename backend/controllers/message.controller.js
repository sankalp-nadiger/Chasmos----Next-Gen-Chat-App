import asyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";

export const allMessages = asyncHandler(async (req, res) => {
  try {
    console.log("Fetching messages for chatId:", req.params.chatId);
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar email")
      .populate({ path: 'attachments' })
      .populate("chat");
    
    // Ensure chat participants are populated so frontend can identify users
    await User.populate(messages, {
      path: 'chat.participants',
      select: 'name avatar email',
    });
    
    console.log("Populating messages with chat participants:", messages);
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // NEW: Check if chat exists and user is participant
  const chat = await Chat.findById(chatId)
    .populate("users", "blockedUsers")
    .populate("participants", "blockedUsers");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // NEW: Check block status for one-on-one chats
  if (!chat.isGroupChat) {
    const otherUser = chat.users.find(user => 
      user._id.toString() !== req.user._id.toString()
    );
    
    if (otherUser && otherUser.blockedUsers.includes(req.user._id)) {
      res.status(403);
      throw new Error("You cannot send messages to this user as you have been blocked");
    }
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  // If attachments passed as array of ids include them
  if (req.body.attachments && Array.isArray(req.body.attachments)) {
    newMessage.attachments = req.body.attachments;
  }
  if (req.body.type) newMessage.type = req.body.type;

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name avatar email");
    message = await message.populate("chat");
    // populate attachments so clients receive URLs immediately
    message = await message.populate({ path: 'attachments' });
    // Ensure chat participants are populated. Some codebases use `users` instead of `participants`.
    message = await User.populate(message, {
      path: "chat.participants",
      select: "name avatar email",
    });

    // If participants were empty (older chats might use `users` field), try populating `chat.users`
    if (!message.chat.participants || message.chat.participants.length === 0) {
      try {
        const chatWithUsers = await Chat.findById(message.chat._id).populate(
          "users",
          "name avatar email"
        );
        if (chatWithUsers && chatWithUsers.users && chatWithUsers.users.length > 0) {
          // Attach users as participants for downstream consumers
          message.chat.participants = chatWithUsers.users;
        }
      } catch (e) {
        // ignore populate fallback errors
      }
    }

    // update chat lastMessage reference
    try {
      await Chat.findByIdAndUpdate(req.body.chatId, { lastMessage: message._id });
    } catch (e) {
      // ignore
    }

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});