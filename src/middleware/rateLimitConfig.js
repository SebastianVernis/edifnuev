/**
 * Rate Limiting Configuration
 * 
 * Configures rate limiting middleware to protect against brute force attacks,
 * credential stuffing, and DDoS attempts.
 * 
 * @module middleware/rateLimitConfig
 */

import rateLimit from 'express-rate-limit';

/**
 * Get rate limit window from environment or use default
 * @param {number} defaultMinutes - Default window in minutes
 * @returns {number} Window in milliseconds
 */
const getRateLimitWindow = (defaultMinutes) => {
  const envWindow = process.env.RATE_LIMIT_WINDOW;
  const minutes = envWindow ? parseInt(envWindow, 10) : defaultMinutes;
  return minutes * 60 * 1000;
};

/**
 * Get max requests from environment or use default
 * @param {number} defaultMax - Default max requests
 * @returns {number} Max requests
 */
const getMaxRequests = (defaultMax) => {
  const envMax = process.env.RATE_LIMIT_MAX_REQUESTS;
  return envMax ? parseInt(envMax, 10) : defaultMax;
};

/**
 * Custom handler for rate limit exceeded
 * Returns standardized error response format
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    ok: false,
    msg: 'Too many requests, please try again later'
  });
};

/**
 * Rate limiter for login endpoint
 * Strict: 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: getRateLimitWindow(15), // 15 minutes
  max: 5, // 5 attempts
  message: { ok: false, msg: 'Too many login attempts, please try again later' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler,
  // Store in memory (can be upgraded to Redis for distributed systems)
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for register endpoint
 * Strict: 3 attempts per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: { ok: false, msg: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for general API endpoints
 * Moderate: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: getRateLimitWindow(15), // 15 minutes
  max: getMaxRequests(100), // 100 requests
  message: { ok: false, msg: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for file upload endpoints
 * Strict: 10 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads
  message: { ok: false, msg: 'Too many upload attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for password reset endpoint
 * Strict: 3 attempts per hour per IP
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: { ok: false, msg: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Export all limiters
export default {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  uploadLimiter,
  resetPasswordLimiter
};
