import express from "express";
import {
  createSignature,
  getSignatures,
  finalizeDocument, // Updated to match your new controller function name
} from "../controllers/signatureController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Save the signature coordinates (placeholder)
router.post("/", protect, createSignature);

// 2. Get all signatures associated with a specific document
router.get("/:documentId", protect, getSignatures);

// 3. Process the PDF and burn the signature onto the file
// This matches the frontend call: api.post('/signatures/finalize', { documentId, x, y })
router.post("/finalize", protect, finalizeDocument);

export default router;