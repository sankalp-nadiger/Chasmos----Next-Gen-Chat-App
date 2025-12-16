import asyncHandler from "express-async-handler";
import Document from "../models/document.model.js";
import supabase from "../utils/supabaseHelper.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const uploadDocument = asyncHandler(async (req, res) => {
  try {
    const { id: userId } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Increase file size limit (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        message: `File size too large. Maximum size is 50MB. Your file: ${Math.round(file.size / (1024 * 1024))}MB` 
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: "Unsupported file type. Supported types: PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX" 
      });
    }

    const uniqueFileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    const bucketName = "documents";
    const filePath = `${uuidv4()}/${uniqueFileName}`;

    console.log(`Uploading to bucket: ${bucketName}, Size: ${Math.round(file.size / (1024 * 1024))}MB`);

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error.message);
      return res.status(500).json({ 
        message: "File upload failed", 
        error: error.message 
      });
    }

    // Generate public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const fileUrl = publicData.publicUrl;
    console.log("Uploaded file URL:", fileUrl);

    // Save document metadata to MongoDB
    const newDocument = new Document({
      fileUrl,
      filePath,
      fileType: file.mimetype.split("/")[1] || file.mimetype,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      createdBy: userId,
      settings: {
        emotion: "neutral",
        depth: "detailed",
        clarity: "clear",
      },
      processingStatus: "pending"
    });

    const savedDoc = await newDocument.save();
    console.log("Document metadata saved to MongoDB");

    // Convert to plain object
    const docData = savedDoc.toObject({ getters: true, virtuals: false });

    // Start background processing for large documents
    if (file.size > 5 * 1024 * 1024) { // If > 5MB, process in background
      processDocumentInBackground(docData._id, fileUrl, file.mimetype);
    }

    return res.status(200).json({
      message: "Document uploaded successfully",
      document: docData,
      processing: file.size > 5 * 1024 * 1024 ? "background" : "immediate"
    });
  } catch (err) {
    console.error("uploadDocument error:", err);
    return res.status(500).json({
      message: "Document upload failed",
      error: err.message,
    });
  }
});

// Background processing for large documents
const processDocumentInBackground = async (documentId, fileUrl, mimeType) => {
  try {
    console.log(`Starting background processing for document: ${documentId}`);
    
    await Document.findByIdAndUpdate(documentId, {
      processingStatus: "processing"
    });

    // Call Flask server for processing
    const flaskURL = `${process.env.FLASK_SERVER_URL}/api/process-large-document`;
    
    const response = await axios.post(
      flaskURL,
      {
        document_id: documentId,
        file_url: fileUrl,
        mime_type: mimeType
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 300000, // 5 minutes for large documents
      }
    );

    if (response.data.success) {
      await Document.findByIdAndUpdate(documentId, {
        processingStatus: "completed",
        isProcessed: true,
        "ocrData.text": response.data.extracted_text,
        "ocrData.page_count": response.data.page_count,
        "ocrData.word_count": response.data.word_count
      });
      console.log(`Background processing completed for document: ${documentId}`);
    } else {
      await Document.findByIdAndUpdate(documentId, {
        processingStatus: "failed",
        "ocrData.error": response.data.error
      });
      console.log(`Background processing failed for document: ${documentId}`);
    }
  } catch (error) {
    console.error(`Background processing error for document ${documentId}:`, error.message);
    await Document.findByIdAndUpdate(documentId, {
      processingStatus: "failed",
      "ocrData.error": error.message
    });
  }
};

export const pinDocument = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const documentId = req.params.documentId;

    const doc = await Document.findOneAndUpdate(
      { _id: documentId, createdBy: userId },
      { isPinned: true },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Document not found" });

    return res.status(200).json({
      message: "Pinned successfully",
      document: doc,
    });
  } catch (err) {
    console.error("PIN ERROR:", err);
    return res.status(500).json({ message: "Error pinning document" });
  }
});

export const unpinDocument = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const documentId = req.params.documentId;

    const doc = await Document.findOneAndUpdate(
      { _id: documentId, createdBy: userId },
      { isPinned: false },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Document not found" });

    return res.status(200).json({
      message: "Unpinned successfully",
      document: doc,
    });
  } catch (err) {
    console.error("UNPIN ERROR:", err);
    return res.status(500).json({ message: "Error unpinning document" });
  }
});

export const processDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { question } = req.body;
  const userId = req.user._id;

  // Validate question
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ message: "Question is required" });
  }

  if (question.length > 1000) {
    return res.status(400).json({ message: "Question too long. Maximum 1000 characters." });
  }

  // Find document for this user
  const doc = await Document.findOne({ _id: documentId, createdBy: userId });
  if (!doc) {
    return res.status(404).json({ message: "Document not found or unauthorized" });
  }

  try {
    // Check if document is still processing
    if (doc.processingStatus === "processing") {
      return res.status(202).json({
        message: "Document is still being processed. Please try again in a moment.",
        status: "processing"
      });
    }

    if (doc.processingStatus === "failed") {
      return res.status(500).json({
        message: "Document processing failed. Please try uploading again.",
        status: "failed"
      });
    }

    const flaskURL = `${process.env.FLASK_SERVER_URL}/api/document/${documentId}/process`;

    const response = await axios.post(
      flaskURL,
      {
        file_url: doc.fileUrl,
        question: question.trim(),
        document_type: doc.mimeType,
        previous_context: doc.questions.slice(-3) // Send last 3 questions for context
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 120000, // 2 minutes
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "AI processing failed");
    }

    const aiAnswer = response.data.answer;

    // Save question + answer to document history
    doc.questions.push({ 
      question: question.trim(), 
      answer: aiAnswer,
      askedAt: new Date()
    });
    
    // Limit questions history to 100 entries
    if (doc.questions.length > 100) {
      doc.questions = doc.questions.slice(-100);
    }
    
    await doc.save();

    res.status(200).json({
      success: true,
      question: question.trim(),
      answer: aiAnswer,
      answer_type: response.data.answer_type || "text",
      confidence: response.data.confidence || 0.8,
      processing_time: response.data.processing_time || 0
    });
  } catch (err) {
    console.error("AI processing error:", err.message);
    
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: "AI processing timeout. The document might be too large.",
        error: "Request timeout"
      });
    }
    
    if (err.response?.status === 413) {
      return res.status(413).json({
        message: "Document too large for processing. Please split the document into smaller parts.",
        error: "Document too large"
      });
    }

    res.status(500).json({
      message: "AI processing failed",
      error: err.message,
      retry_suggestion: "Please try again with a simpler question or re-upload the document."
    });
  }
});

export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const documents = await Document.find({ createdBy: userId })
    .sort({ isPinned: -1, updatedAt: -1 });

  const result = documents.map((doc) => ({
    _id: doc._id,
    fileName: doc.originalName,
    isPinned: doc.isPinned,
    questionCount: doc.questions?.length || 0,
    updatedAt: doc.updatedAt,
    lastQuestion: doc.questions?.[doc.questions.length - 1]?.question || null,
    lastAnswer: doc.questions?.[doc.questions.length - 1]?.answer || null,
    processingStatus: doc.processingStatus || "pending",
    fileSize: doc.fileSize,
    mimeType: doc.mimeType
  }));

  res.status(200).json(result);
});

export const getDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({ _id: documentId, createdBy: userId })
    .select("originalName fileUrl questions createdAt updatedAt processingStatus fileSize mimeType ocrData");

  if (!document) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  res.status(200).json(document);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({ _id: documentId, createdBy: userId });
  if (!document) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  await deleteFromSupabase(document.filePath);
  await document.deleteOne();

  res.status(200).json({ message: "Document deleted successfully" });
});

export const testFlaskConnection = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${process.env.FLASK_SERVER_URL}/ping`, {
      timeout: 5000
    });
    res.status(200).json({ 
      message: "Flask server reachable", 
      data: response.data,
      response_time: response.duration || 0
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Flask server not reachable", 
      error: error.message,
      suggestion: "Check if Flask server is running on port 5001"
    });
  }
});

export const getAllDocumentChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const docs = await Document.find({ createdBy: userId })
    .select("originalName questions updatedAt createdAt processingStatus fileSize")
    .sort({ updatedAt: -1 });

  const history = docs.map((doc) => ({
    _id: doc._id,
    fileName: doc.originalName,
    lastQuestion: doc.questions?.[doc.questions.length - 1]?.question || null,
    lastAnswer: doc.questions?.[doc.questions.length - 1]?.answer || null,
    questionCount: doc.questions?.length || 0,
    updatedAt: doc.updatedAt,
    processingStatus: doc.processingStatus,
    fileSizeMB: Math.round((doc.fileSize || 0) / (1024 * 1024) * 100) / 100
  }));

  res.status(200).json(history);
});

export const getDocumentChatById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const doc = await Document.findOne({ _id: id, createdBy: userId }).select(
    "originalName fileUrl questions createdAt updatedAt processingStatus ocrData fileSize mimeType"
  );

  if (!doc) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  res.status(200).json({
    _id: doc._id,
    fileName: doc.originalName,
    fileUrl: doc.fileUrl,
    questions: doc.questions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    processingStatus: doc.processingStatus,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    extractedTextLength: doc.ocrData?.text?.length || 0
  });
});

export const getDocumentProcessingStatus = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const doc = await Document.findOne({ _id: documentId, createdBy: userId })
    .select("processingStatus ocrData isProcessed");

  if (!doc) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.status(200).json({
    documentId,
    processingStatus: doc.processingStatus,
    isProcessed: doc.isProcessed,
    extractedTextLength: doc.ocrData?.text?.length || 0,
    hasError: !!doc.ocrData?.error
  });
});

const deleteFromSupabase = async (filePath) => {
  try {
    if (!filePath) {
      console.error("No file path provided for deletion");
      return;
    }

    const { error } = await supabase.storage
      .from("documents")
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error.message);
    } else {
      console.log("Deleted file from Supabase:", filePath);
    }
  } catch (err) {
    console.error("Error deleting from Supabase:", err);
  }
};