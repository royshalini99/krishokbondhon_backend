const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    cropType: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    // 'pending' until the NLP microservice (or an expert/farmer) answers it.
    status: { type: String, enum: ['pending', 'answered'], default: 'pending' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

questionSchema.index({ createdAt: -1 });
questionSchema.index({ cropType: 1 });

/**
 * `answers` isn't stored on the question itself — it's populated by the
 * controller from the Answer collection (see qnaController.js) so this
 * method just needs them passed in.
 */
questionSchema.methods.toPublicJson = function (answers = []) {
  return {
    id: this._id.toString(),
    author: this.author,
    title: this.title,
    cropType: this.cropType,
    imageUrl: this.imageUrl,
    status: this.status,
    createdAt: this.createdAt.toISOString(),
    answers: answers.map((a) => a.toPublicJson()),
  };
};

module.exports = mongoose.model('Question', questionSchema);
