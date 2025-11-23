const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const { getUploadDir } = require('../middleware/uploadMiddleware');

const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';

// 🚀 Upload using Cloudinary (uses buffer from memoryStorage)
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    // convert "uploads/news" → "lawyerup/news"
    const baseFolder = getUploadDir(file);           // e.g. "uploads/news"
    const folder = baseFolder.replace(/^uploads/, 'lawyerup');

    const resourceType = file.mimetype.startsWith('image/')
      ? 'image'
      : 'raw'; // pdf or other

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // we only care about the final URL
      }
    );

    uploadStream.end(file.buffer);
  });
};

// 💾 Upload using local filesystem (writes to /uploads)
const uploadToLocal = (file) => {
  return new Promise((resolve, reject) => {
    const dir = getUploadDir(file); // e.g. "uploads/news"

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${file.fieldname}-${unique}${ext}`;
    const fullPath = path.join(dir, filename);

    fs.writeFile(fullPath, file.buffer, (err) => {
      if (err) return reject(err);

      // public path used by frontend (served via Express static, if you want)
      const publicPath = '/' + fullPath.replace(/\\/g, '/');
      resolve(publicPath);
    });
  });
};

// 🌗 Main switch: Cloudinary or Local based on env
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
