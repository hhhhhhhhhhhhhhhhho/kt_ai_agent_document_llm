const kakaoService = require('../services/kakaoService');
const aiService = require('../services/aiService');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');
const { validateUserInput } = require('../utils/validators');

class KakaoController {
  /**
   * 카카오톡 웹훅 메시지 처리
   */
  async handleWebhook(req, res) {
    try {
      const { userRequest, action, user } = req.body;
      const userId = user.id;
      const message = userRequest.utterance;

      logger.info(`카카오톡 메시지 수신 - 사용자: ${userId}, 메시지: ${message}`);

      // 사용자 세션 가져오기
      const session = await sessionService.getUserSession(userId);
      
      // 메시지 타입별 처리
      const response = await this.processMessage(userId, message, session);
      
      // 응답 전송
      res.json(response);

    } catch (error) {
      logger.error('웹훅 처리 중 오류:', error);
      res.status(500).json({
        version: "2.0",
        template: {
          outputs: [{
            simpleText: {
              text: "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            }
          }]
        }
      });
    }
  }

  /**
   * 메시지 타입별 처리
   */
  async processMessage(userId, message, session) {
    // 명령어 처리
    if (message.startsWith('/')) {
      return await this.handleCommand(userId, message, session);
    }

    // 사용자 입력 검증
    const validation = validateUserInput(message);
    if (!validation.isValid) {
      return kakaoService.createTextResponse(validation.message);
    }

    // AI 시스템에 요청 전송
    const aiResponse = await aiService.processUserRequest(userId, message, session);
    
    // 세션 업데이트
    await sessionService.updateUserSession(userId, {
      lastMessage: message,
      lastResponse: aiResponse,
      timestamp: new Date()
    });

    return aiResponse;
  }

  /**
   * 명령어 처리
   */
  async handleCommand(userId, message, session) {
    const command = message.toLowerCase().trim();

    switch (command) {
      case '/start':
      case '/시작':
        return await this.handleStartCommand(userId);
      
      case '/help':
      case '/도움말':
        return await this.handleHelpCommand();
      
      case '/reset':
      case '/초기화':
        await sessionService.clearUserSession(userId);
        return kakaoService.createTextResponse("세션이 초기화되었습니다. 다시 시작해주세요.");
      
      case '/status':
      case '/상태':
        return await this.handleStatusCommand(userId, session);
      
      default:
        return kakaoService.createTextResponse("알 수 없는 명령어입니다. /help를 입력하여 도움말을 확인하세요.");
    }
  }

  /**
   * 시작 명령어 처리
   */
  async handleStartCommand(userId) {
    await sessionService.clearUserSession(userId);
    
    const welcomeMessage = `
🎉 KT AI 지원사업 추천 챗봇에 오신 것을 환영합니다!

📋 사용 방법:
1. 사업 분야를 알려주세요 (예: 기술, 금융, 경영 등)
2. 사업 내용을 간단히 설명해주세요
3. AI가 맞춤형 지원사업을 추천해드립니다!

💡 명령어:
/help - 도움말
/reset - 초기화
/status - 현재 상태

지금 시작해보세요! 🚀
    `;

    return kakaoService.createTextResponse(welcomeMessage);
  }

  /**
   * 도움말 명령어 처리
   */
  async handleHelpCommand() {
    const helpMessage = `
📚 KT AI 지원사업 추천 챗봇 도움말

🎯 주요 기능:
• 맞춤형 지원사업 추천
• 사업분야별 지원사업 검색
• 지원사업 상세 정보 제공

💬 사용 방법:
1. 사업 분야 입력 (기술, 금융, 경영, 창업 등)
2. 사업 내용 설명
3. AI 추천 결과 확인

🔧 명령어:
/start - 처음부터 시작
/help - 이 도움말 보기
/reset - 대화 초기화
/status - 현재 상태 확인

❓ 문의사항이 있으시면 언제든 말씀해주세요!
    `;

    return kakaoService.createTextResponse(helpMessage);
  }

  /**
   * 상태 확인 명령어 처리
   */
  async handleStatusCommand(userId, session) {
    const statusMessage = `
📊 현재 상태

👤 사용자 ID: ${userId}
🕒 마지막 활동: ${session?.timestamp ? new Date(session.timestamp).toLocaleString() : '없음'}
💬 마지막 메시지: ${session?.lastMessage || '없음'}

${session?.category ? `🏷️ 선택된 분야: ${session.category.join(', ')}` : ''}
${session?.businessSummary ? `📝 사업 내용: ${session.businessSummary}` : ''}
    `;

    return kakaoService.createTextResponse(statusMessage);
  }

  /**
   * 친구 추가/삭제 이벤트 처리
   */
  async handleFriendEvent(req, res) {
    try {
      const { user } = req.body;
      const userId = user.id;
      const action = req.body.action;

      logger.info(`친구 ${action} 이벤트 - 사용자: ${userId}`);

      if (action === 'add') {
        // 친구 추가 시 환영 메시지
        const welcomeResponse = await this.handleStartCommand(userId);
        res.json(welcomeResponse);
      } else if (action === 'delete') {
        // 친구 삭제 시 세션 정리
        await sessionService.clearUserSession(userId);
        res.json({ success: true });
      }

    } catch (error) {
      logger.error('친구 이벤트 처리 중 오류:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * 채팅방 이벤트 처리
   */
  async handleChatroomEvent(req, res) {
    try {
      const { user, action } = req.body;
      const userId = user.id;

      logger.info(`채팅방 ${action} 이벤트 - 사용자: ${userId}`);

      if (action === 'join') {
        const welcomeResponse = await this.handleStartCommand(userId);
        res.json(welcomeResponse);
      } else if (action === 'leave') {
        await sessionService.clearUserSession(userId);
        res.json({ success: true });
      }

    } catch (error) {
      logger.error('채팅방 이벤트 처리 중 오류:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * 메시지 전송 (관리자용)
   */
  async sendMessage(req, res) {
    try {
      const { userId, message } = req.body;
      
      const response = await kakaoService.sendMessageToUser(userId, message);
      res.json(response);

    } catch (error) {
      logger.error('메시지 전송 중 오류:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * 사용자 세션 조회
   */
  async getUserSession(req, res) {
    try {
      const { userId } = req.params;
      const session = await sessionService.getUserSession(userId);
      res.json(session);

    } catch (error) {
      logger.error('세션 조회 중 오류:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  /**
   * 사용자 세션 업데이트
   */
  async updateUserSession(req, res) {
    try {
      const { userId } = req.params;
      const sessionData = req.body;
      
      await sessionService.updateUserSession(userId, sessionData);
      res.json({ success: true });

    } catch (error) {
      logger.error('세션 업데이트 중 오류:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }

  /**
   * 사용자 로그 조회
   */
  async getUserLogs(req, res) {
    try {
      const { userId } = req.params;
      const logs = await sessionService.getUserLogs(userId);
      res.json(logs);

    } catch (error) {
      logger.error('로그 조회 중 오류:', error);
      res.status(500).json({ error: 'Failed to get logs' });
    }
  }
}

module.exports = new KakaoController();
