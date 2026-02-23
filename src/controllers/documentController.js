import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Document from "../models/Document.js";
import { logAudit } from "../utils/auditLogger.js";

// Helper for ES Module directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Upload a new document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Please upload a valid PDF file" });
    }

    const doc = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      filePath: req.file.path
    });

    await logAudit({
      documentId: doc._id,
      user: req.user.id,
      action: "DOCUMENT_UPLOADED",
      req
    });

    res.status(201).json({
      message: "File uploaded successfully",
      document: doc
    });

  } catch (err) {
    console.error("UPLOAD ERROR FULL STACK:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Fetch all documents for the logged-in user
export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Serve the actual physical PDF file (UPDATED PATH LOGIC)
// backend/controllers/documentController.js
export const getRawDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      $or: [
        { _id: req.params.id },
        { publicToken: req.params.id }
      ]
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found in DB" });
    }

    const absolutePath = path.resolve(doc.filePath);

    return res.sendFile(absolutePath);
  } catch (err) {
    console.error("RAW DOC ERROR:", err);
    res.status(500).json({ message: "Failed to load document" });
  }
};

// 4. Public access info by token
export const getDocumentByPublicToken = async (req, res) => {
  try {
    const doc = await Document.findOne({
      publicToken: req.params.token
    });

    if (!doc) {
      return res.status(404).json({ message: "Invalid public token" });
    }

    res.json({
      originalName: doc.originalName,
      filePath: doc.filePath,
      status: doc.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// backend/controllers/documentController.js

export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Security: Only the owner can download the file
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const absolutePath = path.resolve(doc.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File missing on server" });
    }

    // This header forces the "Save As" dialog in the browser
    res.download(absolutePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// backend/controllers/documentController.js

export const downloadPublicDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ publicToken: req.params.token });

    if (!doc) {
      return res.status(404).json({ error: "Invalid or expired link" });
    }

    const absolutePath = path.resolve(doc.filePath);
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(absolutePath, `signed_${doc.originalName}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};