import Audit from "../models/Audit.js";

// 1. Get detailed audit trail (for timeline view)
export const getAuditTrail = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Fetch logs and populate user details (name and email)
    // Sorted by latest first to show a clear history
    const audits = await Audit.find({ documentId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(audits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Fetch logs with user details for the history timeline
// This is an alias for the same logic, useful if you prefer this naming convention
export const getDocumentAuditLogs = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const logs = await Audit.find({ documentId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};