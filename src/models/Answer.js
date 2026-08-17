const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    source: { type: String, enum: ['ai', 'expert', 'farmer'], required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    // True only for expert answers — never trust this from client input.
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

answerSchema.methods.toPublicJson = function () {
  return {
    id: this._id.toString(),
    source: this.source,
    authorName: this.authorName,
    content: this.content,
    verified: this.verified,
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports = mongoose.model('Answer', answerSchema);
