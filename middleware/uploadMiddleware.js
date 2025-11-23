const multer = require('multer');
const path = require('path');

// 🎯 Determine base upload folder (logical name)
const getUploadDir = (file) => {
  const { mimetype, fieldname } = file;

  if (fieldname === 'image') return 'uploads/news';
  if (fieldname === 'profilePhoto') return 'uploads/lawyers/photo';
  if (fieldname === 'licenseFile') return 'uploads/lawyers/license';
  if (mimetype === 'application/pdf') return 'uploads/pdf';
  if (fieldname === 'chatpdf') return 'uploads/chatpdf';
  if (fieldname === 'screenshot') return 'uploads/payment';

  // Fallback
  return 'uploads/misc';
};

// 🛡️ Only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  const isExtValid = allowedExts.test(ext);
  const isMimeValid = allowedExts.test(mime);

  if (isExtValid || isMimeValid) {
    cb(null, true);
  } else {
    console.log('📎 Incoming File Type:', file.mimetype);
    cb(new Error('Only image and PDF files are allowed.'));
  }
};

// 📦 Memory storage so it works on Render & with Cloudinary/local switch
const storage = multer.memoryStorage();

const upload = multer({ storage, fileFilter });

module.exports = {
  upload,
  getUploadDir,
};
