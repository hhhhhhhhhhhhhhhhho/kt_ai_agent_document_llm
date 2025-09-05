const express = require('express');
const router = express.Router();
const kakaoController = require('../controllers/kakaoController');
const logger = require('../utils/logger');

/**
 * API 라우트
 */

// 사용자 세션 관리
router.get('/session/:userId', kakaoController.getUserSession);
router.put('/session/:userId', kakaoController.updateUserSession);

// 사용자 로그 조회
router.get('/logs/:userId', kakaoController.getUserLogs);

// 메시지 전송 (관리자용)
router.post('/message/send', kakaoController.sendMessage);

// 통계 조회
router.get('/stats', async (req, res) => {
  try {
    const sessionService = require('../services/sessionService');
    const stats = await sessionService.getSessionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// 시스템 정보 조회
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'KT AI Agent Chatbot',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
