import Signature from "../models/Signature.js";
import Document from "../models/Document.js";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logAudit } from "../utils/auditLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Create signature placeholder (Audit: Position Saved)
export const createSignature = async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const signature = await Signature.create({
      documentId,
      signer: req.user.id,
      x,
      y,
      page
    });

    await logAudit({
      documentId,
      user: req.user.id,
      action: "SIGNATURE_POSITION_CREATED",
      req
    });

    res.json({ message: "Signature position saved", signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get signatures for document
export const getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.documentId });
    res.json(signatures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. FINALIZE SIGNATURE (Hybrid: Supports Image or Typed Text)
export const finalizeDocument = async (req, res) => {
  try {
    // signatureImage: Base64 from Canvas | typedName: String from Input
    const { documentId, x, y, signatureImage, typedName } = req.body; 

    const docRecord = await Document.findById(documentId);
    if (!docRecord) return res.status(404).json({ error: "Document not found" });

    const absolutePath = path.resolve(docRecord.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Original PDF file missing on server" });
    }

    // Load and prepare PDF
    const existingPdfBytes = fs.readFileSync(absolutePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    // COORDINATE TRANSLATION & SCALING
    const scaleFactor = width / 800; // Normalizes browser 800px width to PDF units
    const pdfX = x * scaleFactor;
    const pdfY = height - (y * scaleFactor) - 60; 

    if (signatureImage) {
      // MODE: ELECTRONIC SIGNATURE (Hand-drawn Canvas)
      const imageBytes = signatureImage.split(',')[1];
      const embeddedImage = await pdfDoc.embedPng(Buffer.from(imageBytes, 'base64'));

      firstPage.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: 150 * scaleFactor,
        height: 50 * scaleFactor,
      });
    } else {
      // MODE: DIGITAL SIGNATURE (Typed Text with Timestamp)
      const nameToDraw = typedName || req.user.name;
      
      // Main Signature Text
      firstPage.drawText(`Digitally Signed by: ${nameToDraw}`, {
        x: pdfX,
        y: pdfY + 20,
        size: 14,
        color: rgb(0, 0, 0.6),
      });

      // Verification Timestamp
      firstPage.drawText(`Date: ${new Date().toLocaleString()}`, {
        x: pdfX,
        y: pdfY,
        size: 8,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Save modified PDF and update document status
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(absolutePath, pdfBytes);

    docRecord.status = 'signed';
    await docRecord.save();

    // Final Enterprise Audit Log
    await logAudit({
      documentId: docRecord._id,
      user: req.user.id,
      action: "DOCUMENT_SIGNED_AND_FINALIZED",
      req
    });

    res.json({ message: "Success", status: docRecord.status });
  } catch (err) {
    console.error("Finalize Crash:", err);
    res.status(500).json({ error: err.message || "Backend failed to process PDF" });
  }
};