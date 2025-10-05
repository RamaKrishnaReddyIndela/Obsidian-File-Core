const { logError } = require('../utils/logger');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(`${req.method} ${req.path} - ${err.message}`);
  
  // Default error
  let error = {
    message: 'Internal Server Error',
    statusCode: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Resource already exists';
    error = { message, statusCode: 409 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  // Custom application errors
  if (err.statusCode) {
    error = {
      message: err.message || 'Something went wrong',
      statusCode: err.statusCode
    };
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;