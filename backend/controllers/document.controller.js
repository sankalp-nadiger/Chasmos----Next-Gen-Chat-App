import asyncHandler from "express-async-handler";
import Document from "../models/document.model.js";
import supabase from "../utils/supabaseHelper.js";
import { v4 as uuidv4 } from "uuid";


export const uploadDocument = asyncHandler(async (req, res) => {
  try {
    const { id: userId } = req.user; // assuming JWT middleware sets req.user
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uniqueFileName = `${Date.now()}_${file.originalname}`;
    const bucketName = "documents";
    const filePath = `${uuidv4()}/${uniqueFileName}`;

    console.log(`📁 Uploading to bucket: ${bucketName}`);

    // 🧩 Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("🔥 Supabase upload error:", error.message);
      return res.status(500).json({ message: "Supabase upload failed" });
    }

    // ✅ Generate public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const fileUrl = publicData.publicUrl;
    console.log("✅ Uploaded file URL:", fileUrl);

    // 🧾 Save document metadata to MongoDB
    const newDocument = new Document({
      fileUrl,
      filePath,
      fileType: file.mimetype.split("/")[1],
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      createdBy: userId,
      settings: {
        emotion: "neutral",
        depth: "detailed",
        clarity: "clear",
      },
    });

    const savedDoc = await newDocument.save();
    console.log("📄 Document metadata saved to MongoDB");

    // ✅ Convert to plain object to ensure timestamps are included
    const docData = savedDoc.toObject({ getters: true, virtuals: false });

    console.log(
      "🕓 Saved document timestamps:",
      docData.createdAt,
      docData.updatedAt
    );

    // ✅ Send full document to frontend
    return res.status(200).json({
      message: "Document uploaded successfully",
      document: docData,
    });
  } catch (err) {
    console.error("🔥 uploadDocument error:", err);
    return res.status(500).json({
      message: "Document upload failed",
      error: err.message,
    });
  }
});


// 🧩 Ask a question on an existing document
export const processDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { question } = req.body;
  const userId = req.user._id;

  const doc = await Document.findOne({ _id: documentId, createdBy: userId });
  if (!doc) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  // Send question to Flask AI server
  const response = await axios.post(`${process.env.FLASK_SERVER_URL}/process`, {
    file_url: doc.fileUrl,
    question,
  });

  const aiAnswer = response.data.answer || "No answer received from AI";

  // Append Q&A to document history
  doc.questions.push({ question, answer: aiAnswer });
  await doc.save();

  res.status(200).json({ question, answer: aiAnswer });
});

// 🧩 Get all documents for the logged-in user (chat history list)
export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const documents = await Document.find({ createdBy: userId })
    .select("originalName questions updatedAt createdAt")
    .sort({ updatedAt: -1 });

  const result = documents.map((doc) => ({
    _id: doc._id,
    fileName: doc.originalName,
    questionCount: doc.questions?.length || 0,
    updatedAt: doc.updatedAt, // ✅ renamed key
    lastQuestion: doc.questions?.[doc.questions.length - 1]?.question || null,
    lastAnswer: doc.questions?.[doc.questions.length - 1]?.answer || null,
  }));

  res.status(200).json(result);
});


// 🧩 Get one document with its full chat history
export const getDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({ _id: documentId, createdBy: userId })
    .select("originalName fileUrl questions createdAt updatedAt");

  if (!document) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  res.status(200).json(document);
});

// 🧩 Delete a document and its file from Supabase
export const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({ _id: documentId, createdBy: userId });
  if (!document) {
    res.status(404);
    throw new Error("Document not found or unauthorized");
  }

  await deleteFromSupabase(document.fileUrl);
  await document.deleteOne();

  res.status(200).json({ message: "Document deleted successfully" });
});

// 🧩 Test Flask AI connection
export const testFlaskConnection = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${process.env.FLASK_SERVER_URL}/ping`);
    res.status(200).json({ message: "Flask server reachable", data: response.data });
  } catch (error) {
    res.status(500).json({ message: "Flask server not reachable", error: error.message });
  }
});

// 🆕 NEW: Get all previously chatted documents
export const getAllDocumentChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const docs = await Document.find({ createdBy: userId })
    .select("originalName questions updatedAt createdAt")
    .sort({ updatedAt: -1 });

  const history = docs.map((doc) => ({
    _id: doc._id,
    fileName: doc.originalName,
    lastQuestion: doc.questions?.[doc.questions.length - 1]?.question || null,
    lastAnswer: doc.questions?.[doc.questions.length - 1]?.answer || null,
    questionCount: doc.questions?.length || 0,
    updatedAt: doc.updatedAt,
  }));

  res.status(200).json(history);
});

// 🆕 NEW: Get full chat for a specific document
export const getDocumentChatById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const doc = await Document.findOne({ _id: id, createdBy: userId }).select(
    "originalName fileUrl questions createdAt updatedAt"
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
  });
});
