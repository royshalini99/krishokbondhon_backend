/**
 * Catches anything thrown or passed to next(err) in any route handler
 * above this point, so a bug in one endpoint returns a clean JSON error
 * instead of crashing the process or leaking a stack trace to the app.
 */
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on our end.',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
