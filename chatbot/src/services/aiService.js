const axios = require('axios');
const logger = require('../utils/logger');
const { AI_SERVICE_URL } = require('../config/constants');

class AIService {
  constructor() {
    this.baseURL = AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30초 타임아웃
  }

  /**
   * 사용자 요청을 AI 시스템에 전송
   */
  async processUserRequest(userId, message, session) {
    try {
      logger.info(`AI 시스템에 요청 전송 - 사용자: ${userId}, 메시지: ${message}`);

      // 요청 데이터 구성
      const requestData = {
        userId,
        message,
        session: {
          category: session?.category || [],
          businessSummary: session?.businessSummary || '',
          lastInteraction: session?.timestamp
        },
        timestamp: new Date().toISOString()
      };

      // AI 시스템에 HTTP 요청
      const response = await axios.post(
        `${this.baseURL}/api/process`,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId
          }
        }
      );

      // 응답 처리
      const aiResponse = response.data;
      return this.formatAIResponse(aiResponse);

    } catch (error) {
      logger.error('AI 시스템 요청 실패:', error);
      return this.handleAIError(error);
    }
  }

  /**
   * AI 응답을 카카오톡 형식으로 변환
   */
  formatAIResponse(aiResponse) {
    try {
      const { type, data, message } = aiResponse;

      switch (type) {
        case 'support_programs':
          return this.formatSupportProgramsResponse(data);
        
        case 'business_analysis':
          return this.formatBusinessAnalysisResponse(data);
        
        case 'category_selection':
          return this.formatCategorySelectionResponse(data);
        
        case 'error':
          return this.createErrorResponse(message);
        
        default:
          return this.createTextResponse(message || '처리되었습니다.');
      }

    } catch (error) {
      logger.error('AI 응답 포맷팅 실패:', error);
      return this.createErrorResponse('응답 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 지원사업 목록 응답 포맷팅
   */
  formatSupportProgramsResponse(data) {
    const { programs, userInfo } = data;
    
    if (!programs || programs.length === 0) {
      return this.createTextResponse('죄송합니다. 현재 조건에 맞는 지원사업을 찾을 수 없습니다.');
    }

    // 카드 형태로 지원사업 목록 표시
    const cards = programs.slice(0, 5).map(program => ({
      title: program.name,
      description: program.summary?.substring(0, 100) + '...',
      buttons: [
        {
          label: '상세보기',
          action: 'webLink',
          webLinkUrl: program.url || '#'
        }
      ]
    }));

    return {
      version: "2.0",
      template: {
        outputs: [
          {
            carousel: {
              type: "basicCard",
              items: cards
            }
          },
          {
            simpleText: {
              text: `총 ${programs.length}개의 지원사업을 찾았습니다. 더 자세한 정보가 필요하시면 말씀해주세요!`
            }
          }
        ]
      }
    };
  }

  /**
   * 사업 분석 응답 포맷팅
   */
  formatBusinessAnalysisResponse(data) {
    const { analysis, recommendations } = data;
    
    const responseText = `
🔍 사업 분석 결과

📊 분석 내용:
${analysis}

💡 추천사항:
${recommendations.map(rec => `• ${rec}`).join('\n')}

더 구체적인 지원사업을 찾으시려면 사업 분야를 알려주세요!
    `;

    return this.createTextResponse(responseText);
  }

  /**
   * 카테고리 선택 응답 포맷팅
   */
  formatCategorySelectionResponse(data) {
    const { categories, message } = data;
    
    const buttons = categories.map(category => ({
      label: category,
      action: 'message',
      messageText: category
    }));

    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: message || '사업 분야를 선택해주세요:'
            }
          }
        ],
        quickReplies: buttons
      }
    };
  }

  /**
   * 텍스트 응답 생성
   */
  createTextResponse(text) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: text
            }
          }
        ]
      }
    };
  }

  /**
   * 에러 응답 생성
   */
  createErrorResponse(message) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: `❌ ${message}`
            }
          }
        ]
      }
    };
  }

  /**
   * AI 시스템 에러 처리
   */
  handleAIError(error) {
    if (error.code === 'ECONNREFUSED') {
      return this.createErrorResponse('AI 시스템에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
    
    if (error.code === 'ETIMEDOUT') {
      return this.createErrorResponse('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    
    if (error.response?.status === 429) {
      return this.createErrorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    
    if (error.response?.status >= 500) {
      return this.createErrorResponse('AI 시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    
    return this.createErrorResponse('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
  }

  /**
   * AI 시스템 상태 확인
   */
  async checkAIHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        response: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 배치 처리 요청
   */
  async processBatchRequest(requests) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/batch`,
        { requests },
        {
          timeout: 60000, // 1분 타임아웃
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('배치 처리 요청 실패:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
