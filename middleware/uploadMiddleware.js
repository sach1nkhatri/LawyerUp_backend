const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🎯 Determine the upload folder based on fieldname
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

// 📦 Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadDir(file);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

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
    console.log("📎 Incoming File Type:", file.mimetype);
    cb(new Error('Only image and PDF files are allowed.'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
