/**
 * Express 4 doesn't automatically catch a rejected Promise thrown inside an
 * `async` route handler — without this, a database error would just hang
 * the request forever instead of returning a 500. Wrap every async
 * controller function in this before passing it to a route.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
