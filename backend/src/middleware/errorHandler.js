const ApiError = require('../utils/ApiError');

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize known non-ApiError cases
  const isMysqlDupe = err.code === 'ER_DUP_ENTRY';
  const isSqliteDupe = err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    (err.message && err.message.includes('UNIQUE constraint failed'));

  if (isMysqlDupe || isSqliteDupe) {
    error = ApiError.conflict('A record with this value already exists');
  } else if (err.name === 'MulterError') {
    error = ApiError.badRequest(`Upload error: ${err.message}`);
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || 500, err.message || 'Something went wrong');
  }

  if (process.env.NODE_ENV !== 'production' && error.statusCode >= 500) {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    details: error.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };
