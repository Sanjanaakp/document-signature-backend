import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    action: {
      type: String,
      required: true
    },

    ipAddress: String,

    userAgent: String
  },
  { timestamps: true }
);

export default mongoose.model("Audit", auditSchema);
