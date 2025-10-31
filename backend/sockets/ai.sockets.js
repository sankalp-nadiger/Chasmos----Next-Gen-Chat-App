import AIService from '../services/ai.service.js';
import OCRService from '../services/ocr.service.js';

class AISocketHandler {
  constructor(io) {
    this.io = io;
    this.typingUsers = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 AI Socket connected: ${socket.id}`);

      // AI Chat
      socket.on('ai_chat', async (data) => {
        await this.handleAIChat(socket, data);
      });

      // Document processing
      socket.on('process_document', async (data) => {
        await this.handleDocumentProcessing(socket, data);
      });

      // Typing indicators for AI
      socket.on('ai_typing_start', (data) => {
        this.handleAITypingStart(socket, data);
      });

      socket.on('ai_typing_stop', (data) => {
        this.handleAITypingStop(socket, data);
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async handleAIChat(socket, data) {
    try {
      const { message, chatId, userId, sessionId } = data;

      if (!message || !chatId || !userId) {
        socket.emit('ai_error', {
          chatId,
          error: 'Missing required fields: message, chatId, userId'
        });
        return;
      }

      console.log(`🤖 AI Chat request from user ${userId} in chat ${chatId}`);

      // Emit typing indicator
      socket.to(chatId).emit('ai_typing', {
        chatId,
        isTyping: true,
        userId: 'ai'
      });

      // Process with AI
      const aiSessionId = sessionId || `${userId}_${chatId}`;
      const result = await AIService.processWithAI(message, aiSessionId);

      // Stop typing indicator
      socket.to(chatId).emit('ai_typing', {
        chatId,
        isTyping: false,
        userId: 'ai'
      });

      if (result.success) {
        const responseData = {
          chatId,
          response: result.response,
          sessionId: result.session_id,
          source: result.source,
          timestamp: new Date(),
          messageId: `ai_${Date.now()}`,
          type: 'ai_response'
        };

        // Emit to sender and others in the chat
        socket.emit('ai_response', responseData);
        socket.to(chatId).emit('ai_response', responseData);

        console.log(`✅ AI response sent for chat ${chatId}`);
      } else {
        socket.emit('ai_error', {
          chatId,
          error: result.error || 'Unknown AI error'
        });
        console.error(`❌ AI error for chat ${chatId}:`, result.error);
      }
    } catch (error) {
      console.error('❌ AI Socket handler error:', error);
      socket.emit('ai_error', {
        chatId: data.chatId,
        error: 'Internal server error processing AI request'
      });
    }
  }

  async handleDocumentProcessing(socket, data) {
    try {
      const { file, chatId, userId, message } = data;

      if (!file || !chatId || !userId) {
        socket.emit('document_error', {
          chatId,
          error: 'Missing required fields: file, chatId, userId'
        });
        return;
      }

      console.log(`📄 Document processing request from user ${userId}`);

      // Emit processing indicator
      socket.to(chatId).emit('document_processing', {
        chatId,
        isProcessing: true,
        fileName: file.name
      });

      const result = await AIService.processDocumentWithAI(
        file,
        userId,
        chatId,
        message || "Analyze this document"
      );

      // Stop processing indicator
      socket.to(chatId).emit('document_processing', {
        chatId,
        isProcessing: false
      });

      if (result.success) {
        const responseData = {
          chatId,
          response: result.response,
          extractedText: result.extracted_text,
          documentUrl: result.document_url,
          timestamp: new Date(),
          type: 'document_processed'
        };

        socket.emit('document_processed', responseData);
        socket.to(chatId).emit('document_processed', responseData);

        console.log(`✅ Document processed for chat ${chatId}`);
      } else {
        socket.emit('document_error', {
          chatId,
          error: result.error || 'Document processing failed'
        });
      }
    } catch (error) {
      console.error('❌ Document processing socket error:', error);
      socket.emit('document_error', {
        chatId: data.chatId,
        error: 'Failed to process document'
      });
    }
  }

  handleAITypingStart(socket, data) {
    const { chatId, userId } = data;
    if (chatId) {
      socket.to(chatId).emit('ai_typing', {
        chatId,
        isTyping: true,
        userId
      });
    }
  }

  handleAITypingStop(socket, data) {
    const { chatId, userId } = data;
    if (chatId) {
      socket.to(chatId).emit('ai_typing', {
        chatId,
        isTyping: false,
        userId
      });
    }
  }

  handleDisconnect(socket) {
    console.log(`🔌 AI Socket disconnected: ${socket.id}`);
    // Clean up any typing indicators for this socket
    this.typingUsers.forEach((users, chatId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          this.typingUsers.delete(chatId);
        }
      }
    });
  }
}

export default AISocketHandler;