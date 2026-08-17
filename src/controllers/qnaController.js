const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { paginate } = require('../utils/pagination');
const { generateAiAnswer } = require('../services/nlpService');
const { notifyMatchingExperts } = require('../services/expertNotificationService');

/**
 * Fetches a question's answers ordered per the guide's Step 6.5:
 * "sorted with expert-verified answers prioritized." Within each group,
 * oldest-first still reads naturally as a conversation.
 */
async function sortedAnswersFor(questionId) {
  const answers = await Answer.find({ questionId }).sort({ createdAt: 1 });
  const rank = (a) => (a.verified ? 0 : a.source === 'ai' ? 1 : 2); // expert-verified, then AI, then farmer
  return [...answers].sort((a, b) => rank(a) - rank(b));
}

/** GET /qna/questions */
async function getQuestions(req, res) {
  const { cursor, limit, crop, status } = req.query;

  const filter = {};
  if (crop && crop !== 'All') filter.cropType = crop;
  // "status=open" matches the guide's "list open questions" (Step 6.1) —
  // 'open' is an alias for 'pending' so the API reads naturally either way.
  if (status === 'open') filter.status = 'pending';
  else if (status === 'pending' || status === 'answered') filter.status = status;

  const query = Question.find(filter).sort({ createdAt: -1 });
  const { items, nextCursor, hasMore } = await paginate(query, { cursor, limit });

  const withAnswers = await Promise.all(
    items.map(async (q) => {
      const answers = await sortedAnswersFor(q._id);
      return q.toPublicJson(answers);
    })
  );

  res.json({ items: withAnswers, nextCursor, hasMore });
}

/** GET /qna/questions/:id — polled repeatedly by the app while pending. */
async function getQuestion(req, res) {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const answers = await sortedAnswersFor(question._id);
  res.json(question.toPublicJson(answers));
}

/**
 * POST /qna/ask — creates the question as 'pending' and returns
 * immediately (mirrors HTTP 202-style "accepted, processing" semantics).
 * The AI answer is generated in the background by nlpService and picked
 * up later when the app calls GET /qna/questions/:id again.
 */
async function askQuestion(req, res) {
  const { title, cropType, imageUrl } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!cropType || !cropType.trim()) {
    return res.status(400).json({ error: 'cropType is required' });
  }

  const question = await Question.create({
    author: { id: req.user.id, name: req.user.name },
    title: title.trim(),
    cropType: cropType.trim(),
    imageUrl: imageUrl || null,
    status: 'pending',
  });

  // Fire-and-forget: don't make the farmer's request wait on AI inference
  // or on notifying experts.
  generateAiAnswer(question._id.toString());
  notifyMatchingExperts(question);

  res.status(201).json(question.toPublicJson([]));
}

/**
 * POST /qna/questions/:id/answers — a farmer or expert adding their own
 * answer. `source` and `verified` are derived from the JWT role, never
 * trusted from the request body — otherwise anyone could claim to be a
 * verified expert.
 */
async function addAnswer(req, res) {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const isExpert = req.user.role === 'expert';

  const answer = await Answer.create({
    questionId: question._id,
    source: isExpert ? 'expert' : 'farmer',
    authorName: req.user.name,
    content: content.trim(),
    verified: isExpert,
  });

  if (question.status === 'pending') {
    question.status = 'answered';
    await question.save();
  }

  res.status(201).json(answer.toPublicJson());
}

module.exports = { getQuestions, getQuestion, askQuestion, addAnswer };
