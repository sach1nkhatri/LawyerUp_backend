const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware'); // ✅ named import
const authMiddleware = require('../middleware/authMiddleware');
const newsController = require('../controllers/newsController');

// Basic CRUD
router.get('/', newsController.getAllNews);
router.post('/', upload.single('image'), newsController.createNews);   // ✅ req.file
router.put('/:id', upload.single('image'), newsController.updateNews); // ✅ req.file
router.delete('/:id', newsController.deleteNews);

// Reactions
router.post('/:id/like', newsController.likeNews);
router.post('/:id/unlike', newsController.unlikeNews);
router.post('/:id/dislike', newsController.dislikeNews);
router.post('/:id/undislike', newsController.undislikeNews);

// Comments
router.post('/:id/comment', authMiddleware, newsController.addComment);
router.delete('/:id/comment/:index', authMiddleware, newsController.deleteComment);

module.exports = router;
