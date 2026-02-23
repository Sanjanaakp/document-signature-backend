import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    x: Number,
    y: Number,
    page: Number,
    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Signature", signatureSchema);
