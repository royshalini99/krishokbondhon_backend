const Question = require('../models/Question');
const Answer = require('../models/Answer');

/**
 * Fires off the "ask the AI" step. This is deliberately NOT awaited by the
 * route handler that creates a question — it runs in the background so
 * POST /qna/ask can return instantly with status: 'pending' (see
 * API_CONTRACT.md for why: real inference can take 10-30s on constrained
 * hardware, and we don't want a farmer's phone holding a connection open
 * that whole time).
 *
 * Right now this is a STUB: it waits a few seconds and writes back a canned
 * answer, purely so the whole pending -> answered flow is testable end to
 * end today. Replace the body of generateAiAnswer() with a real HTTP call
 * to your FastAPI service — the calling code (askQuestion controller)
 * doesn't need to change at all.
 */
async function generateAiAnswer(questionId) {
  try {
    // --- Replace this block with the real call, e.g.: ---
    // const res = await fetch(`${process.env.NLP_SERVICE_URL}/answer`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ questionId, title: question.title, cropType: question.cropType }),
    // });
    // const { content } = await res.json();

    await new Promise((resolve) => setTimeout(resolve, 5000)); // simulate inference time
    const content =
      "This is a placeholder AI response — swap src/services/nlpService.js's " +
      'generateAiAnswer() for a real call to the FastAPI NLP microservice.';
    // --- end replaceable block ---

    const answer = await Answer.create({
      questionId,
      source: 'ai',
      authorName: 'KrishokBondhon AI',
      content,
      verified: false,
    });

    await Question.findByIdAndUpdate(questionId, { status: 'answered' });
    return answer;
  } catch (err) {
    // Don't crash the server over a background job failing — just log it.
    // The question stays 'pending'; a farmer or expert can still answer it
    // manually, and you can add a retry/alerting mechanism here later.
    console.error(`[nlpService] failed to generate answer for ${questionId}:`, err.message);
    return null;
  }
}

module.exports = { generateAiAnswer };
