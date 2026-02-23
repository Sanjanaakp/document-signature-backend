import express from "express";
import {
  uploadDocument,
  getMyDocuments,
  getDocumentByPublicToken,
  downloadPublicDocument,
  getRawDocument // 👈 Added this import
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/multerConfig.js";
import { downloadDocument } from "../controllers/documentController.js";
const router = express.Router();

// Existing routes
router.post("/upload", protect, upload.single("file"), uploadDocument);
router.get("/", protect, getMyDocuments);
router.get("/public/:token", getDocumentByPublicToken);
router.get("/download/:id", protect, downloadDocument);
// 👈 Added this new route to serve the physical PDF file
router.get("/raw/:id", protect, getRawDocument); 
// backend/routes/documentRoutes.js
router.get("/public/download/:token", downloadPublicDocument);
export default router;