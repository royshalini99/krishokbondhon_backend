const multer = require('multer');

/**
 * Holds uploaded files in memory (as a Buffer) rather than writing them
 * to local disk. The controller then hands that buffer straight to
 * Google Cloud Storage — the file never touches the container's disk at
 * all, which is exactly what you want on Cloud Run (see
 * src/services/storageService.js for why).
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
