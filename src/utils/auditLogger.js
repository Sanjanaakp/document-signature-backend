import Audit from "../models/Audit.js";

export const logAudit = async ({ documentId, user, action, req }) => {
  try {
    console.log("AUDIT LOGGING:", action);

    await Audit.create({
      documentId,
      user,
      action,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
  } catch (err) {
    console.error("Audit logging failed:", err.message);
  }
};
