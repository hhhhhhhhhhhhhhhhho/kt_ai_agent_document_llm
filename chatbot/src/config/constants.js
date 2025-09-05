module.exports = {
  // 카카오톡 API 설정
  KAKAO_API_KEY: process.env.KAKAO_API_KEY,
  KAKAO_API_URL: process.env.KAKAO_API_URL || 'https://kapi.kakao.com',
  
  // AI 시스템 설정
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  AI_SERVICE_TIMEOUT: parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000,
  
  // Redis 설정
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_TTL: parseInt(process.env.REDIS_TTL) || 86400, // 24시간
  
  // 서버 설정
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 보안 설정
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15분
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // 로깅 설정
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // 지원사업 분야 코드
  CATEGORY_CODES: {
    "금융": "01",
    "기술": "02", 
    "인력": "03",
    "수출": "04",
    "내수": "05",
    "창업": "06",
    "경영": "07",
    "기타": "09"
  },
  
  // 지원사업 분야별 해시태그
  CATEGORY_HASHTAGS: {
    "금융": ["금융", "자금", "융자", "보증"],
    "기술": ["기술", "R&D", "개발", "혁신"],
    "인력": ["인력", "채용", "교육", "훈련"],
    "수출": ["수출", "해외", "글로벌", "무역"],
    "내수": ["내수", "국내", "판로", "마케팅"],
    "창업": ["창업", "스타트업", "신규", "사업화"],
    "경영": ["경영", "관리", "시스템", "품질"],
    "기타": ["기타", "일반", "종합"]
  },
  
  // 메시지 템플릿
  MESSAGES: {
    WELCOME: `
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
    `,
    
    HELP: `
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
    `,
    
    ERROR: {
      AI_SERVICE_DOWN: 'AI 시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      INVALID_INPUT: '입력하신 내용을 이해할 수 없습니다. 다시 시도해주세요.',
      TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      RATE_LIMIT: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      GENERAL: '처리 중 오류가 발생했습니다. 다시 시도해주세요.'
    }
  },
  
  // 세션 단계
  SESSION_STEPS: {
    WELCOME: 'welcome',
    CATEGORY: 'category',
    BUSINESS: 'business',
    RESULT: 'result',
    COMPLETED: 'completed'
  }
};
