const rateLimit = require('express-rate-limit');

// Strict limiter for sensitive auth endpoints (login, register, password
// reset). Blunts brute-force, credential-stuffing, and reset-token guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // per IP per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'عدد كبير من المحاولات، يرجى المحاولة بعد قليل'
  }
});

// Limiter for the AI chat endpoint. It is unauthenticated and proxies to a
// paid LLM, so it needs its own cap to prevent cost-amplification / abuse.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 15, // per IP per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'عدد كبير من الرسائل، يرجى المحاولة بعد قليل'
  }
});

module.exports = { authLimiter, chatLimiter };
