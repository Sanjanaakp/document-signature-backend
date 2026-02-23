import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import signatureRoutes from "./routes/signatureRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import healthRoutes from "./routes/health.js";

dotenv.config();

const app = express();

/* =========================
   PRODUCTION CORS CONFIG
========================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://document-signature-frontend-bukb.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Important for preflight
app.options("/*", cors());

/* ========================= */

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/health", healthRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send("Document Signature API running");
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("SERVER ERROR FULL:");
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});