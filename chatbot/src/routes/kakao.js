const express = require('express');
const router = express.Router();
const kakaoController = require('../controllers/kakaoController');
const kakaoValidator = require('../middleware/kakaoValidator');
const logger = require('../utils/logger');

// 카카오톡 웹훅 엔드포인트
router.post('/webhook', kakaoValidator, kakaoController.handleWebhook);

// 카카오톡 친구 추가/삭제 이벤트
router.post('/friend', kakaoValidator, kakaoController.handleFriendEvent);

// 카카오톡 채팅방 입장/퇴장 이벤트
router.post('/chatroom', kakaoValidator, kakaoController.handleChatroomEvent);

// 카카오톡 메시지 전송 (관리자용)
router.post('/message/send', kakaoController.sendMessage);

// 사용자 세션 관리
router.get('/session/:userId', kakaoController.getUserSession);
router.put('/session/:userId', kakaoController.updateUserSession);

// 디버깅용 로그 조회
router.get('/logs/:userId', kakaoController.getUserLogs);

module.exports = router;
