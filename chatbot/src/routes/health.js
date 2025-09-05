const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

/**
 * 헬스체크 엔드포인트
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(health);
  } catch (error) {
    logger.error('헬스체크 실패:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * 상세 헬스체크 (AI 시스템 포함)
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // AI 시스템 상태 확인
    const aiHealth = await aiService.checkAIHealth();
    
    // 세션 서비스 상태 확인
    const sessionStats = await sessionService.getSessionStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        ai: aiHealth,
        session: {
          status: 'healthy',
          stats: sessionStats
        }
      },
      responseTime: Date.now() - startTime
    };

    // AI 시스템이 unhealthy면 전체 상태를 unhealthy로 설정
    if (aiHealth.status === 'unhealthy') {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    logger.error('상세 헬스체크 실패:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * 준비 상태 확인
 */
router.get('/ready', async (req, res) => {
  try {
    // 필수 서비스들이 준비되었는지 확인
    const aiHealth = await aiService.checkAIHealth();
    
    if (aiHealth.status === 'healthy') {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'AI service is not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('준비 상태 확인 실패:', error);
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 라이브 상태 확인
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
