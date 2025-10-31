import asyncHandler from "express-async-handler";
import AIService from "../services/ai.service.js";
import OCRService from "../services/ocr.service.js";

export const processAIChat = asyncHandler(async (req, res) => {
  const { message, chatId } = req.body;
  const userId = req.user._id;

  if (!message || !chatId) {
    res.status(400);
    throw new Error("Message and chat ID are required");
  }

  if (message.length > 2000) {
    res.status(400);
    throw new Error("Message too long");
  }

  try {
    const sessionId = `${userId}_${chatId}`;
    const result = await AIService.processWithAI(message, sessionId);

    if (!result.success) {
      res.status(500);
      throw new Error(result.error || "AI service unavailable");
    }

    res.status(200).json({
      success: true,
      response: result.response,
      session_id: result.session_id,
      source: result.source,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500);
    throw new Error(`AI processing failed: ${error.message}`);
  }
});

export const processDocumentWithAI = asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;
  const userId = req.user._id;
  const file = req.file;

  if (!file || !chatId) {
    res.status(400);
    throw new Error("File and chat ID are required");
  }

  if (file.size > 10 * 1024 * 1024) {
    res.status(400);
    throw new Error("File size too large");
  }

  if (!OCRService.isSupportedFileType(file.mimetype)) {
    res.status(400);
    throw new Error("Unsupported file type");
  }

  try {
    const result = await AIService.processDocumentWithAI(
      file, 
      userId.toString(), 
      chatId, 
      message || "Analyze this document"
    );

    if (!result.success) {
      res.status(500);
      throw new Error(result.error || "Document processing failed");
    }

    res.status(200).json({
      success: true,
      response: result.response,
      document_processed: result.document_processed,
      extracted_text: result.extracted_text,
      document_url: result.document_url,
      session_id: result.session_id,
      source: result.source,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500);
    throw new Error(`Document processing failed: ${error.message}`);
  }
});

export const getConversationHistory = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!chatId) {
    res.status(400);
    throw new Error("Chat ID is required");
  }

  try {
    const sessionId = `${userId}_${chatId}`;
    const history = await AIService.getSessionHistory(sessionId);

    res.status(200).json({
      success: true,
      history,
      session_id: sessionId,
      count: history.length
    });

  } catch (error) {
    res.status(500);
    throw new Error(`Failed to get conversation history: ${error.message}`);
  }
});

export const clearConversationHistory = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!chatId) {
    res.status(400);
    throw new Error("Chat ID is required");
  }

  try {
    const sessionId = `${userId}_${chatId}`;
    const result = await AIService.clearSessionHistory(sessionId);

    if (!result.success) {
      res.status(500);
      throw new Error(result.error);
    }

    res.status(200).json({
      success: true,
      message: "Conversation history cleared",
      session_id: sessionId
    });

  } catch (error) {
    res.status(500);
    throw new Error(`Failed to clear conversation history: ${error.message}`);
  }
});

export const extractTextFromImage = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error("Image file is required");
  }

  if (file.size > 5 * 1024 * 1024) {
    res.status(400);
    throw new Error("File size too large");
  }

  if (!file.mimetype.startsWith('image/')) {
    res.status(400);
    throw new Error("Only image files are supported");
  }

  try {
    const result = await OCRService.extractTextFromImage(file);

    if (!result.success) {
      res.status(500);
      throw new Error(result.error || "OCR processing failed");
    }

    res.status(200).json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      original_length: result.originalLength,
      cleaned_length: result.cleanedLength,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
});

export const getAIStatus = asyncHandler(async (req, res) => {
  try {
    const ocrStatus = await OCRService.healthCheck();
    const flaskStatus = AIService.isFlaskServerHealthy ? 'healthy' : 'unhealthy';

    res.status(200).json({
      success: true,
      services: {
        ocr: ocrStatus,
        flask: flaskStatus,
        openai: 'configured'
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check AI service status"
    });
  }
});