import rateLimit from 'express-rate-limit';

// Rate limiter for chat endpoint
export const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10, // 10 requests per minute
  message: {
    success: false,
    error: 'Too many messages! Please slow down and try again in a minute. 😊'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests to allow conversation flow
  skipSuccessfulRequests: false,
  // Use user ID or IP for rate limiting
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});
