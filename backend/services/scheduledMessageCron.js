import cron from 'node-cron';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';

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
        message.isScheduled = false;
        message.scheduledSent = true;
        await message.save();

        // Update the chat's last message
        await Chat.findByIdAndUpdate(message.chat._id, { 
          lastMessage: message._id 
        });

        console.log(`✅ [CRON] Sent scheduled message ${message._id} to chat ${message.chat._id}`);

        // Here you would also emit a socket event to notify users
        // This requires access to your socket.io instance
        // You'll need to set this up in your main server file
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
