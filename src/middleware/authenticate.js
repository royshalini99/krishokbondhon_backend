const jwt = require('jsonwebtoken');

/**
 * Reads the JWT from the Authorization header, verifies it, and attaches
 * the decoded payload (userId, role) to req.user for downstream handlers
 * to use. If the token is missing, malformed, or expired, responds with
 * 401 immediately instead of letting the request proceed.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { authenticate };