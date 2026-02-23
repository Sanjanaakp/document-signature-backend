import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  getAuditTrail, 
  getDocumentAuditLogs 
} from "../controllers/auditController.js";

const router = express.Router();

/**
 * @route   GET /api/audit/:documentId
 * @desc    Get all audit logs for a specific document
 * @access  Private
 */

// Both routes point to the same logical data retrieval
router.get("/:documentId", protect, getAuditTrail);
router.get("/logs/:documentId", protect, getDocumentAuditLogs);

export default router;