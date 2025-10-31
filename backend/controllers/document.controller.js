import asyncHandler from "express-async-handler";
import Document from "../models/document.model.js";
import { supabase } from "../config/supabase.js";
import axios from "axios";

const uploadToSupabase = async (file, userId) => {
  const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const fileExtension = sanitizedFileName.split('.').pop();
  const fileName = `documents/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  return {
    fileUrl: publicUrl,
    filePath: fileName,
    fileType: file.mimetype.split('/')[1] || 'file',
    mimeType: file.mimetype
  };
};

const deleteFromSupabase = async (filePath) => {
  if (!filePath) return;
  
  const { error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
  }
};

const processWithFlaskAI = async (question, context = '', documentUrl = null) => {
  try {
    const formData = new FormData();
    formData.append('question', question);
    formData.append('context', context);
    if (documentUrl) {
      formData.append('document_url', documentUrl);
    }

    const response = await axios.post(`http://localhost:${process.env.FLASK_PORT || 5001}/process-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 45000
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service is unavailable. Please ensure Flask server is running.');
    } else if (error.response?.data?.error) {
      throw new Error(`AI processing error: ${error.response.data.error}`);
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
};

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a file");
  }

  const { question, emotion = 'neutral', depth = 'detailed', clarity = 'clear' } = req.body;

  const uploadResult = await uploadToSupabase(req.file, req.user._id);

  const document = await Document.create({
    fileUrl: uploadResult.fileUrl,
    filePath: uploadResult.filePath,
    fileType: uploadResult.fileType,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    settings: { emotion, depth, clarity },
    context: "",
    questions: [],
    processingStatus: "pending",
    isProcessed: false,
    createdBy: req.user._id
  });

  let aiResult = null;
  if (question) {
    document.processingStatus = "processing";
    await document.save();

    try {
      aiResult = await processWithFlaskAI(question, "", uploadResult.fileUrl);
      
      document.context = aiResult.updated_context || "";
      document.questions.push({
        question,
        answer: aiResult.response,
        askedAt: new Date()
      });

      if (aiResult.extracted_text) {
        document.ocrData = {
          extracted_text: aiResult.extracted_text,
          word_count: aiResult.extracted_text.split(/\s+/).length,
          character_count: aiResult.extracted_text.length,
          method: "llm_vision"
        };
      }

      document.processingStatus = "completed";
      document.isProcessed = true;
    } catch (aiError) {
      document.processingStatus = "failed";
      document.questions.push({
        question,
        answer: `Error: ${aiError.message}`,
        askedAt: new Date()
      });
    }
  }

  await document.save();

  const populatedDocument = await Document.findById(document._id)
    .populate("createdBy", "name email avatar");

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    response: aiResult?.response,
    document: populatedDocument
  });
});

export const processDocument = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const { documentId } = req.params;

  if (!question) {
    res.status(400);
    throw new Error("Question is required");
  }

  const document = await Document.findById(documentId);
  
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  if (document.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to access this document");
  }

  document.processingStatus = "processing";
  await document.save();

  try {
    const aiResult = await processWithFlaskAI(question, document.context, document.fileUrl);

    document.context = aiResult.updated_context || document.context;
    document.questions.push({
      question,
      answer: aiResult.response,
      askedAt: new Date()
    });

    if (aiResult.extracted_text && !document.ocrData) {
      document.ocrData = {
        extracted_text: aiResult.extracted_text,
        word_count: aiResult.extracted_text.split(/\s+/).length,
        character_count: aiResult.extracted_text.length,
        method: "llm_vision"
      };
    }

    document.processingStatus = "completed";
    document.isProcessed = true;

    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate("createdBy", "name email avatar");

    res.status(200).json({
      success: true,
      response: aiResult.response,
      document: updatedDocument
    });
  } catch (error) {
    document.processingStatus = "failed";
    document.questions.push({
      question,
      answer: `Error: ${error.message}`,
      askedAt: new Date()
    });
    await document.save();
    
    res.status(500);
    throw new Error(error.message);
  }
});

export const getUserDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ createdBy: req.user._id })
    .populate("createdBy", "name email avatar")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    documents
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId)
    .populate("createdBy", "name email avatar");

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  if (document.createdBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to access this document");
  }

  res.status(200).json({
    success: true,
    document
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  if (document.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this document");
  }

  await deleteFromSupabase(document.filePath);

  await Document.findByIdAndDelete(req.params.documentId);

  res.status(200).json({
    success: true,
    message: "Document deleted successfully"
  });
});

export const testFlaskConnection = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:${process.env.FLASK_PORT || 5001}/health`, {
      timeout: 10000
    });

    res.status(200).json({
      success: true,
      message: "Flask AI server is running",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Flask AI server is not reachable",
      error: error.message
    });
  }
});