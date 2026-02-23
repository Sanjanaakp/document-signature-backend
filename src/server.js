import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import signatureRoutes from "./routes/signatureRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

dotenv.config();

const app = express();

// --- DYNAMIC CORS CONFIGURATION ---
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps) 
    // or any localhost port during development
    if (!origin || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length'] // Crucial for PDF viewers
}));
// ---------------------------------

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/audit", auditRoutes);

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