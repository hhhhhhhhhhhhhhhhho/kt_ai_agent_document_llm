const axios = require('axios');
const logger = require('../utils/logger');
const { KAKAO_API_KEY, KAKAO_API_URL } = require('../config/constants');

class KakaoService {
  constructor() {
    this.apiKey = KAKAO_API_KEY;
    this.baseURL = KAKAO_API_URL || 'https://kapi.kakao.com';
  }

  /**
   * 카카오톡 텍스트 응답 생성
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
   * 카카오톡 카드 응답 생성
   */
  createCardResponse(cards) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            carousel: {
              type: "basicCard",
              items: cards
            }
          }
        ]
      }
    };
  }

  /**
   * 카카오톡 버튼 응답 생성
   */
  createButtonResponse(text, buttons) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: text
            }
          }
        ],
        quickReplies: buttons
      }
    };
  }

  /**
   * 카카오톡 이미지 응답 생성
   */
  createImageResponse(imageUrl, altText = '이미지') {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleImage: {
              imageUrl: imageUrl,
              altText: altText
            }
          }
        ]
      }
    };
  }

  /**
   * 카카오톡 리스트 응답 생성
   */
  createListResponse(items) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            listCard: {
              header: {
                title: "지원사업 목록"
              },
              items: items
            }
          }
        ]
      }
    };
  }

  /**
   * 사용자에게 메시지 전송 (관리자용)
   */
  async sendMessageToUser(userId, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v2/api/talk/memo/default/send`,
        {
          receiver_uuids: [userId],
          template_object: {
            object_type: "text",
            text: message,
            link: {
              web_url: "https://your-domain.com",
              mobile_web_url: "https://your-domain.com"
            }
          }
        },
        {
          headers: {
            'Authorization': `KakaoAK ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('카카오톡 메시지 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(userId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v2/user/me`,
        {
          headers: {
            'Authorization': `Bearer ${userId}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 친구 목록 조회
   */
  async getFriends(userId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/api/talk/friends`,
        {
          headers: {
            'Authorization': `Bearer ${userId}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('친구 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 메시지 전송
   */
  async sendTemplateMessage(userId, templateId, templateArgs) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v2/api/talk/memo/send`,
        {
          receiver_uuids: [userId],
          template_id: templateId,
          template_args: templateArgs
        },
        {
          headers: {
            'Authorization': `KakaoAK ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('템플릿 메시지 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 지원사업 카드 생성
   */
  createSupportProgramCard(program) {
    return {
      title: program.name || '지원사업',
      description: program.summary?.substring(0, 100) + '...' || '상세 정보를 확인해주세요.',
      thumbnail: {
        imageUrl: program.imageUrl || 'https://via.placeholder.com/300x200?text=Support+Program'
      },
      buttons: [
        {
          label: '상세보기',
          action: 'webLink',
          webLinkUrl: program.url || '#'
        },
        {
          label: '신청하기',
          action: 'webLink',
          webLinkUrl: program.applicationUrl || '#'
        }
      ]
    };
  }

  /**
   * 지원사업 목록을 카드 형태로 변환
   */
  createSupportProgramCards(programs) {
    const cards = programs.slice(0, 5).map(program => 
      this.createSupportProgramCard(program)
    );

    return this.createCardResponse(cards);
  }

  /**
   * 카테고리 선택 버튼 생성
   */
  createCategoryButtons() {
    const categories = ['기술', '금융', '경영', '창업', '인력', '수출', '내수', '기타'];
    
    const buttons = categories.map(category => ({
      label: category,
      action: 'message',
      messageText: category
    }));

    return buttons;
  }

  /**
   * 에러 응답 생성
   */
  createErrorResponse(errorMessage) {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: `❌ ${errorMessage}`
            }
          }
        ]
      }
    };
  }

  /**
   * 로딩 응답 생성
   */
  createLoadingResponse() {
    return {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "🔍 AI가 지원사업을 분석하고 있습니다. 잠시만 기다려주세요..."
            }
          }
        ]
      }
    };
  }
}

module.exports = new KakaoService();
