/**
 * Global Error Handler Middleware
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: `Not Found: The requested URL ${req.originalUrl} was not found on this server.`,
  });
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error encountered:', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: `Invalid ID format: "${err.value}"` });
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `A record with this ${field} already exists` });
  }

  // Default status & message
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
