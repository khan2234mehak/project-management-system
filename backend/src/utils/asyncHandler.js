// Wraps an async Express route handler so any thrown/rejected error
// is automatically forwarded to the error-handling middleware instead
// of crashing the process or requiring try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
