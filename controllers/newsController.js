const News = require('../models/News');
const fs = require('fs');

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, summary, author, date } = req.body;
    const image = req.file ? `/uploads/news/${req.file.filename}` : '';
    const news = new News({ title, summary, author, date, image });
    await news.save();
    res.status(201).json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If new image uploaded, replace the old one
    if (req.file) {
      const old = await News.findById(req.params.id);
      if (old?.image && fs.existsSync(`.${old.image}`)) {
        fs.unlinkSync(`.${old.image}`);
      }
      updateData.image = `/uploads/news/${req.file.filename}`;
    }

    const updated = await News.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (deleted?.image && fs.existsSync(`.${deleted.image}`)) {
      fs.unlinkSync(`.${deleted.image}`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🧡 Reactions

exports.likeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });
  if (news.likedBy.includes(userId)) return res.status(400).json({ error: 'Already liked' });

  news.dislikedBy = news.dislikedBy.filter(u => u !== userId);
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
    news.likedBy = news.likedBy.filter(u => u !== userId);
    if (news.likes > 0) news.likes--;
  }

  await news.save();
  res.json({ likes: news.likes, dislikes: news.dislikes });
};

exports.dislikeNews = async (req, res) => {
  const { userId } = req.body;
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found' });
  if (news.dislikedBy.includes(userId)) return res.status(400).json({ error: 'Already disliked' });

  news.likedBy = news.likedBy.filter(u => u !== userId);
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
    news.dislikedBy = news.dislikedBy.filter(u => u !== userId);
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
    return res.status(403).json({ error: 'You can only delete your own comments.' });
  }

  news.comments.splice(commentIndex, 1);
  await news.save();

  res.json({ comments: news.comments });
  

  
};
