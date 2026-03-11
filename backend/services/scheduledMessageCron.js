import cron from 'node-cron';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import ChatKey from '../models/chatKey.model.js';
import KeyManagementService from './keyManagement.service.js';
import EncryptionService from './encryption.service.js';

// Socket.io instance holder
let ioInstance = null;
export const setSocketIOInstance = (io) => {
  ioInstance = io;
};

// Getter for other modules to access the io instance
export const getSocketIOInstance = () => ioInstance;

// Helper to decrypt message for emission (E2E encryption)
const decryptMessageForEmission = async (message, chatId) => {
  const msgObj = (message && message.toObject) ? message.toObject() : { ...message };
  
  // Add timestamp
  msgObj.timestamp = msgObj.isScheduled ? msgObj.scheduledFor : msgObj.createdAt;
  
  // Decrypt if encrypted
  if (msgObj.isEncrypted && msgObj.encryptedContent && msgObj.encryptionMetadata) {
    try {
      // Get any user from the chat to decrypt (all users share same chat key)
      const chat = await Chat.findById(chatId).lean();
      if (chat && chat.users && chat.users.length > 0) {
        const anyUserId = chat.users[0];
        const chatKeyInfo = await KeyManagementService.getChatKeyForUser(chatId, anyUserId);
        
        if (chatKeyInfo && chatKeyInfo.aesKey) {
          const decryptedContent = EncryptionService.decryptAES(
            {
              encrypted: msgObj.encryptedContent,
              iv: msgObj.encryptionMetadata.iv,
              tag: msgObj.encryptionMetadata.tag
            },
            chatKeyInfo.aesKey
          );
          
          msgObj.content = decryptedContent;
          msgObj.wasDecrypted = true;
        }
      }
    } catch (decryptError) {
      console.error('[decryptMessageForEmission] Failed to decrypt:', decryptError);
      msgObj.content = '[ENCRYPTED]';
    }
  }
  
  return msgObj;
};

// Function to send scheduled messages
const sendScheduledMessages = async () => {
  try {
    
    const now = new Date();
    
    // Find all scheduled messages that are due
    const dueMessages = await Message.find({
      isScheduled: true,
      scheduledSent: false,
      scheduledFor: { $lte: now }
    })
      .populate('sender', 'name avatar email')
      .populate('attachments')
      .populate('chat');

    if (dueMessages.length === 0) {
      return;
    }

    console.log(`📨 [CRON] Found ${dueMessages.length} scheduled message(s) to send`);

    for (const message of dueMessages) {
      try {
        // Mark as no longer scheduled and set as sent
        message.scheduledSent = true;
        await message.save();

        // Update the chat's last message
        await Chat.findByIdAndUpdate(message.chat._id, { 
          lastMessage: message._id 
        });

        console.log(`✅ [CRON] Sent scheduled message ${message._id} to chat ${message.chat._id}`);

        // Decrypt message before emitting (E2E encryption support)
        const messageToEmit = await decryptMessageForEmission(message, message.chat._id);

        // Emit socket event to chat room and user rooms
        if (ioInstance && message.chat && message.chat._id) {
          // To chat room (for users who have the chat open)
          ioInstance.to(message.chat._id.toString()).emit("message recieved", messageToEmit);

          // To each user's personal room (for chat list updates and notifications)
          // Frontend should filter messages by chatId to prevent displaying in wrong chat
          const users = (message.chat.users && message.chat.users.length)
            ? message.chat.users
            : (message.chat.participants || []);
          if (Array.isArray(users)) {
            users.forEach(user => {
              const userId = user._id ? user._id.toString() : user.toString();
              ioInstance.to(userId).emit("message recieved", messageToEmit);
            });
          }
        }
      } catch (error) {
        console.error(`❌ [CRON] Error sending scheduled message ${message._id}:`, error);
      }
    }

    console.log(`🎉 [CRON] Completed sending ${dueMessages.length} scheduled message(s)`);
  } catch (error) {
    console.error('❌ [CRON] Error in scheduled message cron job:', error);
  }
};

// Initialize cron job - runs every minute
export const initScheduledMessageCron = () => {
  console.log('⏰ [CRON] Initializing scheduled message cron job (runs every minute)');
  
  // Run every minute: '* * * * *'
  cron.schedule('* * * * *', () => {
    sendScheduledMessages();
  });

  console.log('✅ [CRON] Scheduled message cron job initialized');
};

// Manual trigger for testing
export const triggerScheduledMessages = sendScheduledMessages;
