const jwt = require('jsonwebtoken');
const { User, Expert } = require('../models/postgres');
const {
  generateAndSendOtp,
  verifyOtpCode,
  generateAndSendEmailOtp,
  verifyEmailOtpCode,
} = require('../services/otpService');

async function register(req, res) {
  try {
    const { name, phone, village, district, state, crops, preferredLanguage, role } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are both required.' });
    }

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }

    const newUser = await User.create({
      name,
      phone,
      village: village || null,
      district: district || null,
      state: state || null,
      crops: Array.isArray(crops) ? crops : [],
      preferredLanguage: preferredLanguage || 'en',
      role: role === 'expert' ? 'expert' : 'farmer',
      isVerified: false,
    });

    await generateAndSendOtp(phone);

    return res.status(201).json({
      message: 'Account created. An OTP has been sent to your phone for verification.',
      userId: newUser.id,
    });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while creating your account.' });
  }
}

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone number. Please sign up first.' });
    }

    await generateAndSendOtp(phone);
    return res.status(200).json({ message: 'OTP sent.' });
  } catch (err) {
    console.error('[auth] sendOtp error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while sending the OTP.' });
  }
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
    village: user.village,
    district: user.district,
    state: user.state,
    preferredLanguage: user.preferredLanguage,
    crops: user.crops,
  };
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are both required.' });
    }

    const result = await verifyOtpCode(phone, otp);
    if (!result.valid) return res.status(400).json({ error: result.reason });

    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'No account found with this phone number.' });

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Verification successful.',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error('[auth] verifyOtp error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while verifying the OTP.' });
  }
}

async function submitExpertProfile(req, res) {
  try {
    const { userId, institution, specialty, credentialsDocUrl } = req.body;

    if (!userId || !institution || !specialty) {
      return res.status(400).json({ error: 'User ID, institution, and specialty are required.' });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'expert') {
      return res.status(400).json({ error: 'This user is not registered as an expert.' });
    }

    const existing = await Expert.findOne({ where: { userId } });
    if (existing) {
      return res.status(409).json({ error: 'An expert profile already exists for this account.' });
    }

    const expertProfile = await Expert.create({
      userId, institution, specialty,
      credentialsDocUrl: credentialsDocUrl || null,
      isApproved: false,
    });

    return res.status(201).json({
      message: 'Expert profile submitted. Awaiting admin approval before you can answer questions.',
      expertId: expertProfile.id,
    });
  } catch (err) {
    console.error('[auth] submitExpertProfile error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while submitting your expert profile.' });
  }
}

/**
 * Admin-only: lists every expert profile still awaiting approval, with
 * the underlying user's name/phone included for context.
 */
async function getPendingExperts(req, res) {
  try {
    const pending = await Expert.findAll({
      where: { isApproved: false },
      include: [{ model: User, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ experts: pending });
  } catch (err) {
    console.error('[auth] getPendingExperts error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while fetching pending experts.' });
  }
}

async function approveExpert(req, res) {
  try {
    const { expertId } = req.params;
    const expertProfile = await Expert.findByPk(expertId);
    if (!expertProfile) return res.status(404).json({ error: 'Expert profile not found.' });

    expertProfile.isApproved = true;
    await expertProfile.save();
    return res.status(200).json({ message: 'Expert approved successfully.' });
  } catch (err) {
    console.error('[auth] approveExpert error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while approving the expert.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const { village, district, state, preferredLanguage, crops } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (village !== undefined) user.village = village;
    if (district !== undefined) user.district = district;
    if (state !== undefined) user.state = state;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (crops !== undefined) user.crops = crops;

    await user.save();

    return res.status(200).json({ message: 'Profile updated.', user: serializeUser(user) });
  } catch (err) {
    console.error('[auth] updateProfile error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while updating your profile.' });
  }
}

async function sendEmailOtp(req, res) {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are both required.' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await generateAndSendEmailOtp(email);
    return res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('[auth] sendEmailOtp error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while sending the verification code.' });
  }
}

async function verifyEmailOtp(req, res) {
  try {
    const { userId, email, otp } = req.body;
    if (!userId || !email || !otp) {
      return res.status(400).json({ error: 'User ID, email, and code are all required.' });
    }

    const result = await verifyEmailOtpCode(email, otp);
    if (!result.valid) return res.status(400).json({ error: result.reason });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.email = email;
    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully.', user: serializeUser(user) });
  } catch (err) {
    console.error('[auth] verifyEmailOtp error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while verifying the email.' });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    console.error('[auth] getMe error:', err.message);
    return res.status(500).json({ error: 'Something went wrong while fetching your profile.' });
  }
}

module.exports = {
  register,
  sendOtp,
  verifyOtp,
  submitExpertProfile,
  getPendingExperts,
  approveExpert,
  updateProfile,
  sendEmailOtp,
  verifyEmailOtp,
  getMe,
};