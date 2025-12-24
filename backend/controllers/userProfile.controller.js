import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';

// Get user profile details
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching profile for userId:', userId);
    // Find user by ID
    const user = await User.findById(userId).select('-password -googleAccessToken -googleRefreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      // Prefer DB avatar; fall back to common alternate fields if present (pic/picture), then default
      avatar:
        user.avatar || user.picture || user.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      bio: user.bio,
      createdAt: user.createdAt,
      isOnline: user.isOnline,
      // Business fields
      isBusiness: user.isBusiness || false,
      businessCategory: user.businessCategory || ""
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's shared media, documents, and links from chat history
export const getUserMediaAndDocs = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Find the chat between current user and the specified user
    const chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, userId] }
    });

    if (!chat) {
      return res.status(200).json({
        media: [],
        documents: [],
        links: []
      });
    }

    // Find all messages in this chat with attachments, excluding messages hidden from current user
    const messages = await Message.find({
      chat: chat._id,
      excludeUsers: { $not: { $elemMatch: { $eq: currentUserId } } }
    }).sort({ createdAt: -1 });

    const media = [];
    const documents = [];
    const links = [];

    // Process messages to extract media, docs, and links
    messages.forEach(message => {
      // Extract attachments
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          const attachmentData = {
            url: attachment.url,
            filename: attachment.filename,
            mimetype: attachment.mimetype,
            timestamp: message.createdAt
          };

          // Categorize by mimetype
          if (attachment.mimetype.startsWith('image/') || attachment.mimetype.startsWith('video/')) {
            media.push(attachmentData);
          } else {
            documents.push(attachmentData);
          }
        });
      }

      // Extract links from message content
      if (message.content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundLinks = message.content.match(urlRegex);
        
        if (foundLinks) {
          foundLinks.forEach(url => {
            links.push({
              url: url,
              timestamp: message.createdAt
            });
          });
        }
      }
    });

    // Remove duplicate links
    const uniqueLinks = Array.from(
      new Map(links.map(link => [link.url, link])).values()
    );

    res.status(200).json({
      media: media.slice(0, 50), // Limit to 50 most recent
      documents: documents.slice(0, 50),
      links: uniqueLinks.slice(0, 50)
    });
  } catch (error) {
    console.error('Error fetching user media and docs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

