import axios from 'axios';
import { supabaseDb } from '../config/supabase.js';

class AIService {
  constructor() {
    this.flaskBaseURL = process.env.FLASK_SERVER_URL || 'http://localhost:5001';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.isFlaskServerHealthy = false;
    this.checkFlaskHealth();
  }

  async checkFlaskHealth() {
    try {
      const response = await axios.get(`${this.flaskBaseURL}/api/health`, {
        timeout: 5000
      });
      this.isFlaskServerHealthy = response.data.status === 'healthy';
    } catch (error) {
      this.isFlaskServerHealthy = false;
    }
  }

  async getOrCreateSession(userId, chatId) {
    const sessionId = `${userId}_${chatId}`;
    
    try {
      const { data: existingSession, error } = await supabaseDb.getAISession(sessionId);

      if (error || !existingSession) {
        const { data: newSession, error: createError } = await supabaseDb.createAISession({
          session_id: sessionId,
          user_id: userId,
          chat_id: chatId,
          conversation_history: [],
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        });

        if (createError) {
          throw createError;
        }
        
        return newSession;
      }

      await supabaseDb.updateAISession(sessionId, { 
        last_activity: new Date().toISOString() 
      });

      return existingSession;

    } catch (error) {
      return {
        session_id: sessionId,
        user_id: userId,
        chat_id: chatId,
        conversation_history: []
      };
    }
  }

  async updateConversationHistory(sessionId, userMessage, aiResponse) {
    try {
      const { data: session, error } = await supabaseDb.getAISession(sessionId);

      if (error) {
        return;
      }

      const updatedHistory = [
        ...(session.conversation_history || []),
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        }
      ].slice(-20);

      const { error: updateError } = await supabaseDb.updateAISession(sessionId, {
        conversation_history: updatedHistory,
        last_activity: new Date().toISOString()
      });

    } catch (error) {
    }
  }

  async processWithAI(message, sessionId, documentContext = null) {
    try {
      const session = await this.getOrCreateSession(sessionId.split('_')[0], sessionId.split('_')[1]);
      
      if (this.isFlaskServerHealthy) {
        try {
          const payload = {
            message,
            session_id: sessionId,
            conversation_history: session.conversation_history || [],
            document_context: documentContext,
            api_key: this.openaiApiKey
          };

          const response = await axios.post(`${this.flaskBaseURL}/api/chat`, payload, {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const aiResponse = response.data.response;

          await this.updateConversationHistory(sessionId, message, aiResponse);

          return {
            success: true,
            response: aiResponse,
            session_id: sessionId,
            source: 'flask'
          };
        } catch (flaskError) {
          this.isFlaskServerHealthy = false;
        }
      }

      return await this.fallbackToOpenAI(message, sessionId, session.conversation_history, documentContext);

    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: "Service unavailable. Please try again.",
        source: 'error'
      };
    }
  }

  async fallbackToOpenAI(message, sessionId, conversationHistory = [], documentContext = null) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are Chasm AI with memory capabilities.${documentContext ? ` Document context: ${documentContext}` : ''}`
        }
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.slice(-10).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }

      messages.push({
        role: "user",
        content: message
      });

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content;

      await this.updateConversationHistory(sessionId, message, aiResponse);

      return {
        success: true,
        response: aiResponse,
        session_id: sessionId,
        source: 'openai_fallback'
      };
    } catch (error) {
      return {
        success: true,
        response: "Service temporarily unavailable. Please try again.",
        session_id: sessionId,
        source: 'simple_fallback'
      };
    }
  }

  async processDocumentWithAI(file, userId, chatId, message = "Analyze this document") {
    try {
      const sessionId = `${userId}_${chatId}`;
      
      const OCRService = (await import('./ocr.service.js')).default;
      const ocrResult = await OCRService.processDocument(file, sessionId);

      const enhancedMessage = ocrResult.text 
        ? `Document content: ${ocrResult.text}\n\nUser question: ${message}`
        : `I have uploaded a document. ${message}`;

      const aiResult = await this.processWithAI(enhancedMessage, sessionId, ocrResult.text);

      return {
        ...aiResult,
        document_processed: true,
        extracted_text: ocrResult.text || '',
        document_url: ocrResult.publicUrl || 'uploaded',
        ocr_success: !!ocrResult.text
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: "Document processing failed.",
        document_processed: false
      };
    }
  }

  async getSessionHistory(sessionId) {
    try {
      const { data: session, error } = await supabaseDb.getAISession(sessionId);
      if (error) throw error;
      return session?.conversation_history || [];
    } catch (error) {
      return [];
    }
  }

  async clearSessionHistory(sessionId) {
    try {
      const { error } = await supabaseDb.updateAISession(sessionId, {
        conversation_history: [],
        last_activity: new Date().toISOString()
      });

      if (error) throw error;
      
      return { success: true, message: "Conversation history cleared" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeDocumentSentiment(text) {
    try {
      const prompt = `Analyze sentiment: "${text.substring(0, 4000)}"`;

      const result = await this.processWithAI(prompt, 'sentiment_analysis');
      
      return {
        success: true,
        analysis: result.response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const aiService = new AIService();
export default aiService;