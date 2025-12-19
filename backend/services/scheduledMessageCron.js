import cron from 'node-cron';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';

// Socket.io instance holder
let ioInstance = null;
export const setSocketIOInstance = (io) => {
  ioInstance = io;
};

// Getter for other modules to access the io instance
export const getSocketIOInstance = () => ioInstance;

// Function to send scheduled messages
const sendScheduledMessages = async () => {
  try {
    console.log('🔍 [CRON] Checking for scheduled messages...');
    
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
      console.log('✅ [CRON] No scheduled messages due at this time');
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

        // Emit socket event to all users in the chat room AND to each participant's userId room
        if (ioInstance && message.chat && message.chat._id) {
          // To chat room (for users who joined the chat)
          ioInstance.to(message.chat._id.toString()).emit("message recieved", message);

          // To each userId room (for users not in the chat room)
          const users = (message.chat.users && message.chat.users.length)
            ? message.chat.users
            : (message.chat.participants || []);
          if (Array.isArray(users)) {
            users.forEach(user => {
              const userId = user._id ? user._id.toString() : user.toString();
              ioInstance.to(userId).emit("message recieved", message);
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
