const logger = require('../utils/logger');

/**
 * 전역 에러 핸들러 미들웨어
 */
const errorHandler = (err, req, res, next) => {
  // 에러 로깅
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });

  // 기본 에러 응답
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다.';

  // 에러 타입별 처리
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '입력 데이터가 올바르지 않습니다.';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '인증이 필요합니다.';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '접근 권한이 없습니다.';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = '요청한 리소스를 찾을 수 없습니다.';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = '요청이 충돌했습니다.';
  } else if (err.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = '외부 서비스에 연결할 수 없습니다.';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = '요청 시간이 초과되었습니다.';
  }

  // 카카오톡 웹훅 요청인 경우 특별 처리
  if (req.path.includes('/kakao/')) {
    return res.json({
      version: "2.0",
      template: {
        outputs: [{
          simpleText: {
            text: `❌ ${message}`
          }
        }]
      }
    });
  }

  // 일반 API 응답
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
};

/**
 * 404 에러 핸들러
 */
const notFoundHandler = (req, res) => {
  const message = '요청한 엔드포인트를 찾을 수 없습니다.';

  // 카카오톡 웹훅 요청인 경우 특별 처리
  if (req.path.includes('/kakao/')) {
    return res.json({
      version: "2.0",
      template: {
        outputs: [{
          simpleText: {
            text: `❌ ${message}`
          }
        }]
      }
    });
  }

  res.status(404).json({
    success: false,
    message: message
  });
};

/**
 * 비동기 에러 래퍼
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 에러 생성 헬퍼
 */
const createError = (message, statusCode = 500, name = 'CustomError') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError
};
