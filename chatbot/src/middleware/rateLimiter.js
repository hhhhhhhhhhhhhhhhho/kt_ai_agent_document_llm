const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate Limiting 미들웨어
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 최대 100 요청
  message: {
    success: false,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

/**
 * 카카오톡 웹훅 전용 Rate Limiter
 */
const kakaoWebhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 30, // 최대 30 요청
  message: {
    version: "2.0",
    template: {
      outputs: [{
        simpleText: {
          text: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        }
      }]
    }
  },
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Kakao webhook rate limit exceeded for user: ${req.body?.user?.id}`);
    res.status(429).json({
      version: "2.0",
      template: {
        outputs: [{
          simpleText: {
            text: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
          }
        }]
      }
    });
  }
});

/**
 * AI 서비스 요청 전용 Rate Limiter
 */
const aiServiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 최대 10 요청
  message: {
    success: false,
    message: 'AI 서비스 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`AI service rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'AI 서비스 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

module.exports = {
  rateLimiter,
  kakaoWebhookLimiter,
  aiServiceLimiter
};
