import asyncHandler from "express-async-handler";
import Screenshot from "../models/screenshot.model.js";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import { uploadFileToSupabase } from "../utils/uploadToSupabase.js";

// Upload screenshot and create system message
export const uploadScreenshot = asyncHandler(async (req, res) => {
  try {
    console.log('📸 [uploadScreenshot] Request received');
    const { chatId } = req.body;
    
    if (!chatId) {
      res.status(400);
      throw new Error("Chat ID is required");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("Screenshot file is required");
    }

    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    const hasAccess = chat.users.some(
      user => user.toString() === req.user._id.toString()
    );
    
    if (!hasAccess) {
      res.status(403);
      throw new Error("You don't have access to this chat");
    }

    // Upload screenshot to Supabase (screenshots bucket, UUID folder)
    const uploadResult = await uploadFileToSupabase(req.file, 'screenshots');

    if (!uploadResult || uploadResult.success !== true || !uploadResult.fileUrl) {
      res.status(500);
      throw new Error(uploadResult?.error || "Failed to upload screenshot");
    }

    // Get chat participants info for system message
    const chatParticipants = await User.find({
      _id: { $in: chat.users }
    }).select('name email');

    const chatName = chat.isGroupChat 
      ? chat.chatName 
      : chatParticipants.find(u => u._id.toString() !== req.user._id.toString())?.name || 'Chat';

    // Create screenshot record
    const screenshot = await Screenshot.create({
      chat: chatId,
      capturedBy: req.user._id,
      imageUrl: uploadResult.fileUrl,
      fileName: uploadResult.filePath || req.file.originalname || `screenshot_${Date.now()}.png`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || 'image/png',
      dimensions: {
        width: req.body.width ? parseInt(req.body.width) : null,
        height: req.body.height ? parseInt(req.body.height) : null
      },
      metadata: {
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        chatName: chatName
      }
    });

    // Create system message notifying other participants
    const systemMessage = await Message.create({
      sender: req.user._id,
      content: `${req.user.name || req.user.email} took a screenshot`,
      type: 'system',
      chat: chatId,
      attachments: []
    });

    // Populate system message
    await systemMessage.populate('sender', 'name avatar email');
    await systemMessage.populate('chat');
    await User.populate(systemMessage, {
      path: 'chat.users',
      select: 'name avatar email'
    });

    // Update screenshot with system message reference
    screenshot.systemMessage = systemMessage._id;
    await screenshot.save();

    // Do NOT update chat's last message for screenshot system messages
    // (screenshot notifications should not appear as last message)

    // Populate screenshot for response
    await screenshot.populate('capturedBy', 'name avatar email');

    res.status(201).json({
      success: true,
      screenshot,
      systemMessage
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to upload screenshot');
  }
});

// Get all screenshots for specific chats
export const getScreenshots = asyncHandler(async (req, res) => {
  try {
    console.log('📸 [getScreenshots] Request received');
    console.log('Query params:', req.query);
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());
    console.log('📋 Parsed chat IDs:', chatIdArray);

    // Verify user has access to these chats
    const chats = await Chat.find({
      _id: { $in: chatIdArray },
      users: req.user._id
    });

    console.log(`✅ Found ${chats.length} chats user has access to`);

    if (chats.length === 0) {
      console.log('⚠️ No accessible chats found, returning empty array');
      return res.json([]);
    }

    const verifiedChatIds = chats.map(chat => chat._id);
    console.log('🔐 Verified chat IDs:', verifiedChatIds);

    // Find all screenshots in these chats
    const screenshots = await Screenshot.find({
      chat: { $in: verifiedChatIds }
    })
      .populate('capturedBy', 'name email avatar')
      .populate('chat', 'chatName isGroupChat')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✨ Found ${screenshots.length} screenshots`);

    // Transform screenshots for frontend
    const screenshotItems = screenshots.map(screenshot => ({
      _id: screenshot._id,
      url: screenshot.imageUrl,
      fileName: screenshot.fileName,
      mimeType: screenshot.mimeType,
      fileSize: screenshot.fileSize,
      dimensions: screenshot.dimensions,
      createdAt: screenshot.createdAt,
      capturedByName: screenshot.capturedBy?.name || screenshot.capturedBy?.email,
      capturedBy: screenshot.capturedBy,
      chatId: screenshot.chat._id,
      chatName: screenshot.chat?.chatName,
      messageId: screenshot.systemMessage // For navigation to message
    }));

    console.log(`✨ Returning ${screenshotItems.length} screenshot items`);
    res.json(screenshotItems);
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(400);
    throw new Error(error.message);
  }
});

// Delete screenshot
export const deleteScreenshot = asyncHandler(async (req, res) => {
  try {
    const { screenshotId } = req.params;

    const screenshot = await Screenshot.findById(screenshotId);
    
    if (!screenshot) {
      res.status(404);
      throw new Error("Screenshot not found");
    }

    // Check if user is the one who captured the screenshot
    if (screenshot.capturedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own screenshots");
    }

    // Delete from Supabase
    // Extract file path from URL and delete
    // This is optional - you might want to keep files in storage

    // Delete screenshot record
    await Screenshot.findByIdAndDelete(screenshotId);

    // Optionally delete the system message
    if (screenshot.systemMessage) {
      await Message.findByIdAndDelete(screenshot.systemMessage);
    }

    res.json({ success: true, message: "Screenshot deleted successfully" });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to delete screenshot');
  }
});
