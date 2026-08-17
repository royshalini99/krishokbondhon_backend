const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { paginate } = require('../utils/pagination');
const { uploadImage } = require('../services/storageService');

/** GET /community/feed */
async function getFeed(req, res) {
  const { cursor, limit, tag } = req.query;

  const filter = {};
  if (tag && tag !== 'All') filter.tags = tag;

  const query = Post.find(filter).sort({ createdAt: -1 });
  const { items, nextCursor, hasMore } = await paginate(query, { cursor, limit });

  res.json({
    items: items.map((post) => post.toPublicJson(req.user.id)),
    nextCursor,
    hasMore,
  });
}

/** POST /community/posts (multipart: content, tags, images[]) */
async function createPost(req, res) {
  const { content, tags } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  if (content.trim().length > 2000) {
    return res.status(400).json({ error: 'Post is too long (max 2000 characters).' });
  }

  // `tags` may arrive as a JSON string, a single string, or an array,
  // depending on how the client encodes the multipart form — handle all three.
  let parsedTags = [];
  if (Array.isArray(tags)) {
    parsedTags = tags;
  } else if (typeof tags === 'string' && tags.trim()) {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      parsedTags = [tags];
    }
  }

  const imagePaths = await Promise.all(
    (req.files || []).map((f) => uploadImage(f.buffer, f.originalname, f.mimetype))
  );

  const post = await Post.create({
    author: {
      id: req.user.id,
      name: req.user.name,
      village: req.user.village,
    },
    content: content.trim(),
    tags: parsedTags,
    images: imagePaths,
    likedBy: [],
    commentCount: 0,
  });

  res.status(201).json(post.toPublicJson(req.user.id));
}

/** POST /community/posts/:id/like — toggles like for the current user. */
async function toggleLike(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.user.id;
  const alreadyLiked = post.likedBy.includes(userId);

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter((id) => id !== userId);
  } else {
    post.likedBy.push(userId);
  }
  await post.save();

  res.json({ likeCount: post.likedBy.length, likedByMe: !alreadyLiked });
}

/** GET /community/posts/:id/comments */
async function getComments(req, res) {
  const { cursor, limit } = req.query;
  const query = Comment.find({ postId: req.params.id }).sort({ createdAt: 1 });
  const { items, nextCursor, hasMore } = await paginate(query, { cursor, limit });

  res.json({ items: items.map((c) => c.toPublicJson()), nextCursor, hasMore });
}

/** POST /community/posts/:id/comments */
async function addComment(req, res) {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = await Comment.create({
    postId: post._id,
    author: { id: req.user.id, name: req.user.name },
    content: content.trim(),
  });

  post.commentCount += 1;
  await post.save();

  res.status(201).json(comment.toPublicJson());
}

/** DELETE /community/posts/:id — author or admin only. */
async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isOwner = post.author.id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'You can only delete your own posts.' });
  }

  await Comment.deleteMany({ postId: post._id });
  await post.deleteOne();

  res.status(200).json({ message: 'Post deleted.' });
}

module.exports = { getFeed, createPost, toggleLike, getComments, addComment, deletePost };
