const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  getFeed,
  createPost,
  toggleLike,
  getComments,
  addComment,
  deletePost,
} = require('../controllers/communityController');

const router = express.Router();

router.use(requireAuth);

router.get('/feed', asyncHandler(getFeed));
router.post('/posts', upload.array('images[]', 4), asyncHandler(createPost));
router.post('/posts/:id/like', asyncHandler(toggleLike));
router.get('/posts/:id/comments', asyncHandler(getComments));
router.post('/posts/:id/comments', asyncHandler(addComment));
router.delete('/posts/:id', asyncHandler(deletePost));

module.exports = router;