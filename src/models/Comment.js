const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

commentSchema.methods.toPublicJson = function () {
  return {
    id: this._id.toString(),
    author: this.author,
    content: this.content,
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports = mongoose.model('Comment', commentSchema);
