const News = require('../models/News');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// 🧾 Get all news
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📰 Create news (with Cloudinary image)
exports.createNews = async (req, res) => {
  try {
    const { title, summary, author, date } = req.body;
    let image = '';

    if (req.file) {
      // 1️⃣ Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'lawyerup/news',
      });

      image = result.secure_url;

      // 2️⃣ Delete local temp file
      fs.unlink(req.file.path, () => {});
    }

    const news = new News({ title, summary, author, date, image });
    await news.save();

    res.status(201).json(news);
  } catch (err) {
    console.error('Create news error:', err);
    res.status(400).json({ error: err.message });
  }
};

// ✏️ Update news (replace image if new one uploaded)
exports.updateNews = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const old = await News.findById(req.params.id);

      // 🧹 If old image was local `/uploads/...`, try to delete it
      if (old?.image && old.image.startsWith('/uploads')) {
        const oldPath = path.join(__dirname, '..', old.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // 1️⃣ Upload new one to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'lawyerup/news',
      });

      updateData.image = result.secure_url;

      // 2️⃣ Delete local temp file
      fs.unlink(req.file.path, () => {});
    }

    const updated = await News.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update news error:', err);
    res.status(400).json({ error: err.message });
  }
};

// 🗑 Delete news
exports.deleteNews = async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);

    // Old posts that still stored local file paths
    if (deleted?.image && deleted.image.startsWith('/uploads')) {
      const imgPath = path.join(__dirname, '..', deleted.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    // (Optional: if later you store Cloudinary public_id, you can also destroy there)

    res.json({ success: true });
  } catch (err) {
    console.error('Delete news error:', err);
    res.status(400).json({ error: err.message });
  }
};

// 🧡 Reactions
exports.likeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });
  if (news.likedBy.includes(userId))
    return res.status(400).json({ error: 'Already liked' });

  news.dislikedBy = news.dislikedBy.filter((u) => u !== userId);
  if (news.dislikedBy.length < (news.dislikes || 0)) news.dislikes--;

  news.likedBy.push(userId);
  news.likes++;
  await news.save();

  res.json({ likes: news.likes, dislikes: news.dislikes });
};

exports.unlikeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });

  if (news.likedBy.includes(userId)) {
    news.likedBy = news.likedBy.filter((u) => u !== userId);
    if (news.likes > 0) news.likes--;
  }

  await news.save();
  res.json({ likes: news.likes, dislikes: news.dislikes });
};

exports.dislikeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });
  if (news.dislikedBy.includes(userId))
    return res.status(400).json({ error: 'Already disliked' });

  news.likedBy = news.likedBy.filter((u) => u !== userId);
  if (news.likedBy.length < (news.likes || 0)) news.likes--;

  news.dislikedBy.push(userId);
  news.dislikes++;
  await news.save();

  res.json({ likes: news.likes, dislikes: news.dislikes });
};

exports.undislikeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });

  if (news.dislikedBy.includes(userId)) {
    news.dislikedBy = news.dislikedBy.filter((u) => u !== userId);
    if (news.dislikes > 0) news.dislikes--;
  }

  await news.save();
  res.json({ likes: news.likes, dislikes: news.dislikes });
};

// 💬 Comments
exports.addComment = async (req, res) => {
  const text = req.body.text;
  const user = req.user.fullName || 'Anonymous';

  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });

  news.comments.push({ user, text });
  await news.save();

  res.json({ comments: news.comments });
};

exports.deleteComment = async (req, res) => {
  const news = await News.findById(req.params.id);
  const commentIndex = parseInt(req.params.index);
  const user = req.user.fullName;

  if (!news) return res.status(404).json({ error: 'News not found' });

  const comment = news.comments[commentIndex];
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (comment.user !== user) {
    return res
      .status(403)
      .json({ error: 'You can only delete your own comments.' });
  }

  news.comments.splice(commentIndex, 1);
  await news.save();

  res.json({ comments: news.comments });
};
