const logger = require('../utils/logger');

/**
 * 카카오톡 웹훅 요청 검증 미들웨어
 */
const kakaoValidator = (req, res, next) => {
  try {
    // 요청 본문 검증
    if (!req.body) {
      logger.warn('카카오톡 웹훅: 요청 본문이 없습니다.');
      return res.status(400).json({
        version: "2.0",
        template: {
          outputs: [{
            simpleText: {
              text: "잘못된 요청입니다."
            }
          }]
        }
      });
    }

    const { userRequest, action, user } = req.body;

    // 사용자 정보 검증
    if (!user || !user.id) {
      logger.warn('카카오톡 웹훅: 사용자 정보가 없습니다.');
      return res.status(400).json({
        version: "2.0",
        template: {
          outputs: [{
            simpleText: {
              text: "사용자 정보를 찾을 수 없습니다."
            }
          }]
        }
      });
    }

    // 메시지 요청 검증
    if (userRequest && !userRequest.utterance) {
      logger.warn('카카오톡 웹훅: 메시지 내용이 없습니다.');
      return res.status(400).json({
        version: "2.0",
        template: {
          outputs: [{
            simpleText: {
              text: "메시지 내용을 확인할 수 없습니다."
            }
          }]
        }
      });
    }

    // 요청 로깅
    logger.info(`카카오톡 웹훅 검증 통과 - 사용자: ${user.id}, 액션: ${action || 'message'}`);

    next();
  } catch (error) {
    logger.error('카카오톡 웹훅 검증 중 오류:', error);
    res.status(500).json({
      version: "2.0",
      template: {
        outputs: [{
          simpleText: {
            text: "서버 오류가 발생했습니다."
          }
        }]
      }
    });
  }
};

module.exports = kakaoValidator;
