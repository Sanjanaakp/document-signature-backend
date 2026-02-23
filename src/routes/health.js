import express from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await cloudinary.v2.api.ping();
    res.json({
      status: "OK",
      cloudinary: "connected",
      server: "alive"
    });
  } catch (err) {
    res.status(500).json({
      status: "FAILED",
      error: err.message
    });
  }
});

export default router;