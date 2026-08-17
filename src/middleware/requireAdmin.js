/**
 * Must run AFTER authenticate middleware, which populates req.user.
 * Blocks anyone whose token role isn't 'admin'.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAdmin };