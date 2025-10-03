const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { deleteImageByUrl } = require('../services/cloudflareImagesService');

const uploadsDir = path.join(__dirname, '../uploads/images');

// Configure storage to keep files in memory before forwarding to Cloudflare
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Helper function to delete old image
const deleteOldImage = async (imagePath) => {
  if (!imagePath) {
    return;
  }

  if (imagePath.startsWith('http')) {
    try {
      await deleteImageByUrl(imagePath);
    } catch (error) {
      console.error('Failed to delete Cloudflare image', error);
    }
    return;
  }

  const fullPath = path.join(uploadsDir, path.basename(imagePath));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = {
  upload,
  deleteOldImage,
  uploadsDir
};
