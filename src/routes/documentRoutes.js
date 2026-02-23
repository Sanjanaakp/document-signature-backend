import express from "express";
import {
  uploadDocument,
  getMyDocuments,
  getDocumentByPublicToken,
  downloadPublicDocument,
  getRawDocument,
  downloadDocument,
  sendSignatureRequest
} from "../controllers/documentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { cloudUpload } from "../config/cloudinary.js";

const router = express.Router();

/**
 * Upload Document (PDF)
 * Frontend MUST use formData key: "pdf"
 */
router.post(
  "/upload",
  protect,
  cloudUpload.single("pdf"),
  uploadDocument
);

/**
 * Internal Document Management
 */
router.get("/", protect, getMyDocuments);
router.get("/raw/:id", protect, getRawDocument);
router.get("/download/:id", protect, downloadDocument);

/**
 * Public Access
 */
router.get("/public/:token", getDocumentByPublicToken);
router.get("/public/download/:token", downloadPublicDocument);

/**
 * Signature Requests
 */
router.post("/send-request", protect, sendSignatureRequest);

export default router;