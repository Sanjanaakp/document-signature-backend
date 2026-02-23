import mongoose from "mongoose";
import crypto from "crypto";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    originalName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "pending"
    },

    // 🔐 Public share token
    publicToken: {
      type: String,
      unique: true
    }
  },
  { timestamps: true }
);

// 🔐 Auto-generate secure public token
documentSchema.pre("save", function () {
  if (!this.publicToken) {
    this.publicToken = crypto.randomBytes(32).toString("hex");
  }
});

export default mongoose.model("Document", documentSchema);
