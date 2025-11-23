const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const { getUploadDir } = require('../middleware/uploadMiddleware');

const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';

// 🚀 Cloud upload using buffer (for Render / production)
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const baseDir = getUploadDir(file);              // e.g. "uploads/news"
    const folder = baseDir.replace(/^uploads/, 'lawyerup'); // "lawyerup/news"

    const resourceType = file.mimetype.startsWith('image/')
      ? 'image'
      : 'raw'; // pdf etc

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url); // we just return the final URL
      }
    );

    stream.end(file.buffer);
  });
};

// 💾 Local upload using buffer (for dev on your laptop)
const uploadToLocal = (file) => {
  return new Promise((resolve, reject) => {
    const dir = getUploadDir(file); // "uploads/news", "uploads/lawyers/photo", etc.

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${file.fieldname}-${unique}${ext}`;
    const fullPath = path.join(dir, filename);

    fs.writeFile(fullPath, file.buffer, (err) => {
      if (err) return reject(err);

      const publicPath = '/' + fullPath.replace(/\\/g, '/'); // "/uploads/..."
      resolve(publicPath);
    });
  });
};

// 🌗 Main switch: Cloudinary or Local depending on env
const uploadFile = (file) => {
  if (USE_CLOUDINARY) {
    return uploadToCloudinary(file);
  } else {
    return uploadToLocal(file);
  }
};

module.exports = {
  uploadFile,
};
