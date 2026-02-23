import crypto from "crypto";
import nodemailer from "nodemailer";
import Document from "../models/Document.js";
import { logAudit } from "../utils/auditLogger.js";
import { cloudinary } from "../config/cloudinary.js";

/**
 * 1. Upload document
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload PDF to Cloudinary using stream
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "document_signatures",
            resource_type: "raw", // PDFs MUST be raw
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

    const result = await uploadToCloudinary();

    const doc = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      filePath: result.secure_url,
      status: "pending",
    });

    res.status(201).json({
      message: "Uploaded successfully",
      document: doc,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2. Get user's documents
 */
export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3. Return Cloudinary URL for PDF preview
 */
export const getRawDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      $or: [{ _id: req.params.id }, { publicToken: req.params.id }],
    });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    res.json({ url: doc.filePath });
  } catch (err) {
    res.status(500).json({ message: "Failed to load document" });
  }
};

/**
 * 4. Public document info
 */
export const getDocumentByPublicToken = async (req, res) => {
  try {
    const doc = await Document.findOne({ publicToken: req.params.token });

    if (!doc) return res.status(404).json({ message: "Invalid public token" });

    res.json({
      originalName: doc.originalName,
      filePath: doc.filePath,
      status: doc.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 5. Owner download
 */
export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    res.redirect(doc.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 6. Public download
 */
export const downloadPublicDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ publicToken: req.params.token });

    if (!doc) return res.status(404).json({ error: "Invalid or expired link" });

    res.redirect(doc.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 7. Send signature email
 */
export const sendSignatureRequest = async (req, res) => {
  try {
    const { documentId, signerEmail } = req.body;

    const publicToken = crypto.randomBytes(32).toString("hex");

    const doc = await Document.findByIdAndUpdate(
      documentId,
      { publicToken, signerEmail, status: "pending" },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "Document not found" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const signLink = `${process.env.FRONTEND_URL}/public/${publicToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: signerEmail,
      subject: "Signature Request",
      html: `
        <h2>Signature Request</h2>
        <p>${req.user.name} invited you to sign <b>${doc.originalName}</b></p>
        <a href="${signLink}">Review & Sign</a>
      `,
    });

    await logAudit({
      documentId: doc._id,
      user: req.user.id,
      action: "SIGNATURE_REQUEST_SENT",
      req,
    });

    res.json({ message: "Request sent successfully", signLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};