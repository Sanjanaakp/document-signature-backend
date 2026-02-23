import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Document from "../models/Document.js";
import { logAudit } from "../utils/auditLogger.js";

// Helper for ES Module directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Upload a new document (Cloud-Ready via Multer-Cloudinary)
export const uploadDocument = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ error: "Unauthorized" });

    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const doc = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname || req.file.filename,
      filePath: req.file.secure_url || req.file.path,
      status: "pending"
    });

    await logAudit({
      documentId: doc._id,
      user: req.user.id,
      action: "DOCUMENT_UPLOADED",
      req
    });

    res.status(201).json({
      message: "Uploaded successfully",
      document: doc
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
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

// 3. Serve/Proxy PDF file (Modified for Cloud compatibility)
export const getRawDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      $or: [{ _id: req.params.id }, { publicToken: req.params.id }]
    });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Returns the Cloudinary URL so the frontend can render it
    res.json({ url: doc.filePath });
  } catch (err) {
    res.status(500).json({ message: "Failed to load document" });
  }
};

// 4. Public access info by token
export const getDocumentByPublicToken = async (req, res) => {
  try {
    const doc = await Document.findOne({ publicToken: req.params.token });
    if (!doc) return res.status(404).json({ message: "Invalid public token" });

    res.json({
      originalName: doc.originalName,
      filePath: doc.filePath,
      status: doc.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Download Document (Owner only)
export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.owner.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    // Redirect to Cloudinary URL for direct download
    res.redirect(doc.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Download Public Document
export const downloadPublicDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ publicToken: req.params.token });
    if (!doc) return res.status(404).json({ error: "Invalid or expired link" });

    res.redirect(doc.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Generate Tokenized URL and Email Request
export const sendSignatureRequest = async (req, res) => {
  try {
    const { documentId, signerEmail } = req.body;
    
    const publicToken = crypto.randomBytes(32).toString('hex');
    
    const doc = await Document.findByIdAndUpdate(
      documentId, 
      { publicToken, signerEmail, status: 'pending' },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "Document not found" });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const signLink = `${process.env.FRONTEND_URL}/public/${publicToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: signerEmail,
      subject: 'Signature Request: Action Required',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Signature Request</h2>
          <p><strong>${req.user.name}</strong> has invited you to sign <strong>${doc.originalName}</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${signLink}" style="padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Review & Sign Document
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">This link is unique to you and should not be shared.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    await logAudit({
      documentId: doc._id,
      user: req.user.id,
      action: "SIGNATURE_REQUEST_SENT",
      req
    });

    res.json({ message: "Request sent successfully", signLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};