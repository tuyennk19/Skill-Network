const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.AUTH_LIMIT_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.',
    code: 'RATE_LIMITED'
  }
});

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.SUBMIT_LIMIT_PER_MIN,
  keyGenerator: (req) => String(req.user.id),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Bạn đã nộp quá nhiều bài. Vui lòng thử lại sau.',
    code: 'RATE_LIMITED'
  }
});

module.exports = { authLimiter, submitLimiter };
