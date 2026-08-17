const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getQuestions, getQuestion, askQuestion, addAnswer } = require('../controllers/qnaController');

const router = express.Router();

router.use(requireAuth); // every Q&A route needs a logged-in user

router.get('/questions', asyncHandler(getQuestions));
router.get('/questions/:id', asyncHandler(getQuestion));
router.post('/ask', asyncHandler(askQuestion));
router.post('/questions/:id/answers', asyncHandler(addAnswer));

module.exports = router;
