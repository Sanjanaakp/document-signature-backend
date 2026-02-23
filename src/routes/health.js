import express from "express";
import cloudinary from "cloudinary";

const router = express.Router();

// IMPORTANT: configure cloudinary first
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", async (req, res) => {
  try {
    await cloudinary.v2.api.ping();

    res.json({
      status: "OK",
      cloudinary: "connected",
      server: "alive"
    });
  } catch (err) {
    console.error("HEALTH CHECK ERROR:", err);

    res.status(500).json({
      status: "FAILED",
      error: err.message
    });
  }
});

export default router;