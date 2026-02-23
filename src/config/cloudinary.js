import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration using your dashboard credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'document_signatures',
    // 'auto' detects PDF vs Image automatically to prevent upload stalling
    resource_type: 'auto', 
    // Generates a unique filename to prevent overwriting documents
    public_id: (req, file) => `doc_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
  },
});

export const cloudUpload = multer({ storage: storage });
export { cloudinary };