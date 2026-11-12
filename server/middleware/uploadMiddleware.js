const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure base upload directories exist
const itemUploadDir = path.join(__dirname, '..', 'uploads', 'items');
const evidenceUploadDir = path.join(__dirname, '..', 'uploads', 'evidence');

if (!fs.existsSync(itemUploadDir)) {
  fs.mkdirSync(itemUploadDir, { recursive: true });
}
if (!fs.existsSync(evidenceUploadDir)) {
  fs.mkdirSync(evidenceUploadDir, { recursive: true });
}

// Factory to create multer disk storage for specific folder and file prefix
const createStorage = (destinationDir, filePrefix) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destinationDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${filePrefix}-${uniqueSuffix}${extension}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, JPG, PNG, and WEBP image files are allowed.'
      ),
      false
    );
  }
};

// Item images upload instance
const upload = multer({
  storage: createStorage(itemUploadDir, 'item'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter,
});

// Dispute evidence upload instance
const uploadEvidence = multer({
  storage: createStorage(evidenceUploadDir, 'evidence'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter,
});

module.exports = upload;
module.exports.uploadEvidence = uploadEvidence;
