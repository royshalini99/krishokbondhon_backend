const mongoose = require('mongoose');

/**
 * A community post. `author` is stored denormalized (copied in at creation
 * time) rather than referenced, since author id/name/village come straight
 * off the JWT and rarely change — this avoids a cross-database join back
 * into Postgres just to render a feed.
 */
const postSchema = new mongoose.Schema(
  {
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, default: null },
      village: { type: String, default: null },
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    images: [{ type: String }],
    tags: [{ type: String }],
    likedBy: [{ type: String }], // array of user ids who liked this post
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });

/** Shapes a post document into exactly the JSON the Flutter app expects. */
postSchema.methods.toPublicJson = function (currentUserId) {
  return {
    id: this._id.toString(),
    author: this.author,
    content: this.content,
    images: this.images,
    tags: this.tags,
    likeCount: this.likedBy.length,
    commentCount: this.commentCount,
    likedByMe: currentUserId ? this.likedBy.includes(currentUserId) : false,
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports = mongoose.model('Post', postSchema);
