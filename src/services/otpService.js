const { OtpVerification, EmailVerification } = require('../models/postgres');

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------- Phone OTP (unchanged from before) ----------

async function generateAndSendOtp(phone) {
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpVerification.create({ phone, otpCode, expiresAt, isUsed: false });

  console.log(`[otp] Development mode — OTP for ${phone} is: ${otpCode}`);
}

async function verifyOtpCode(phone, submittedCode) {
  const record = await OtpVerification.findOne({
    where: { phone, otpCode: submittedCode, isUsed: false },
    order: [['createdAt', 'DESC']],
  });

  if (!record) return { valid: false, reason: 'Incorrect OTP.' };
  if (new Date() > record.expiresAt) return { valid: false, reason: 'OTP has expired. Please request a new one.' };

  record.isUsed = true;
  await record.save();
  return { valid: true };
}

// ---------- Email OTP (new) ----------

async function generateAndSendEmailOtp(email) {
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await EmailVerification.create({ email, otpCode, expiresAt, isUsed: false });

  // Development mode: print instead of actually emailing. Swap in a real
  // email provider (SendGrid, Nodemailer, etc.) here later.
  console.log(`[email-otp] Development mode — OTP for ${email} is: ${otpCode}`);
}

async function verifyEmailOtpCode(email, submittedCode) {
  const record = await EmailVerification.findOne({
    where: { email, otpCode: submittedCode, isUsed: false },
    order: [['createdAt', 'DESC']],
  });

  if (!record) return { valid: false, reason: 'Incorrect verification code.' };
  if (new Date() > record.expiresAt) return { valid: false, reason: 'Code has expired. Please request a new one.' };

  record.isUsed = true;
  await record.save();
  return { valid: true };
}

module.exports = {
  generateAndSendOtp,
  verifyOtpCode,
  generateAndSendEmailOtp,
  verifyEmailOtpCode,
};