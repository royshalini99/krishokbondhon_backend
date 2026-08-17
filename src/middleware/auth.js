const jwt = require('jsonwebtoken');
const { User } = require('../models/postgres');

/**
 * Verifies the JWT issued by our passwordless OTP auth flow and looks up
 * the real user in Postgres to populate req.user. Our JWT only carries
 * { userId, role } — not name/village — so those always need a fresh
 * lookup rather than being trusted from token claims, which could go
 * stale if the user edits their profile before the token expires.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      village: user.village,
      role: user.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };