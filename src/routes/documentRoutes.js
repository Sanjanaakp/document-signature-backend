import express from "express";
import {
  uploadDocument,
  getMyDocuments,
  getDocumentByPublicToken,
  downloadPublicDocument,
  getRawDocument,
  downloadDocument,
  sendSignatureRequest // Added for your email logic
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { cloudUpload } from "../config/cloudinary.js"; // Use this for Cloudinary

const router = express.Router();

/**
 * 1. Upload Document
 * Uses 'cloudUpload' to stream directly to Cloudinary, fixing the upload hang.
 * Ensure your frontend FormData key is "pdf".
 */
router.post("/upload", protect, cloudUpload.single("pdf"), uploadDocument);

/**
 * 2. Internal Document Management
 */
router.get("/", protect, getMyDocuments);
router.get("/raw/:id", protect, getRawDocument); 
router.get("/download/:id", protect, downloadDocument);

/**
 * 3. Public & External Signer Access
 * These do NOT use the 'protect' middleware so external signers can access them.
 */
router.get("/public/:token", getDocumentByPublicToken);
router.get("/public/download/:token", downloadPublicDocument);

/**
 * 4. Signature Requests
 * Triggers the Nodemailer logic to send tokenized links to signers.
 */
router.post("/send-request", protect, sendSignatureRequest);

export default router;