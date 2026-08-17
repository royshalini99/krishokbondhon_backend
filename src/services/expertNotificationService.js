/**
 * Guide reference: Phase 6, Step 6.4 — "When a question is posted, check
 * if it matches an expert's registered specialty/language. Send an email
 * notification to relevant experts."
 *
 * This is a STUB, and deliberately so: expert records (specialty,
 * language, verification status, email) live in PostgreSQL, managed by
 * a separate auth/expert service that isn't part of this repo (see
 * README's scope note). This service can't do real specialty/language
 * matching until that service exists and exposes a way to query it.
 *
 * What's real here: the *trigger point* — every new question correctly
 * calls this, so wiring in the real behavior later is a one-function
 * change in this file, not a hunt through the codebase for where
 * notifications "should" happen.
 *
 * To make this real:
 *   1. Replace the matching step with a call to your Postgres-backed
 *      expert service, e.g.:
 *        GET /experts?specialty=<cropType>&language=<preferredLanguage>
 *   2. Replace the "send" step with a real email provider — SendGrid or
 *      Nodemailer, exactly as named in the guide — using each matched
 *      expert's email address from that response.
 */
async function notifyMatchingExperts(question) {
  try {
    // --- Replace with a real lookup against the expert service ---
    // const res = await fetch(`${process.env.EXPERT_SERVICE_URL}/experts?specialty=${question.cropType}`);
    // const matchedExperts = await res.json();
    const matchedExperts = []; // no expert directory to query yet — see comment above
    // --- end replaceable block ---

    if (matchedExperts.length === 0) {
      console.log(
        `[expertNotification] question ${question._id} (${question.cropType}): ` +
          'no expert-matching service wired up yet — skipping notification.'
      );
      return;
    }

    // --- Replace with a real email send (SendGrid / Nodemailer) ---
    for (const expert of matchedExperts) {
      console.log(`[expertNotification] would email ${expert.email} about question ${question._id}`);
    }
    // --- end replaceable block ---
  } catch (err) {
    // Notification failures should never break question creation itself.
    console.error('[expertNotification] failed:', err.message);
  }
}

module.exports = { notifyMatchingExperts };
