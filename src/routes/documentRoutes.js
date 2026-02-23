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
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Upload PDF
router.post(
  "/upload",
  protect,
  upload.single("pdf"), // MUST be "pdf"
  uploadDocument
);

// Internal
router.get("/", protect, getMyDocuments);
router.get("/raw/:id", protect, getRawDocument);
router.get("/download/:id", protect, downloadDocument);

// Public
router.get("/public/:token", getDocumentByPublicToken);
router.get("/public/download/:token", downloadPublicDocument);

// Signature email
router.post("/send-request", protect, sendSignatureRequest);

export default router;