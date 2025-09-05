const logger = require('./logger');

/**
 * 사용자 입력 검증
 */
const validateUserInput = (input) => {
  try {
    // 입력값 존재 확인
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        message: '입력값이 올바르지 않습니다.'
      };
    }

    // 길이 검증
    if (input.length < 1) {
      return {
        isValid: false,
        message: '메시지가 너무 짧습니다. 더 자세히 설명해주세요.'
      };
    }

    if (input.length > 1000) {
      return {
        isValid: false,
        message: '메시지가 너무 깁니다. 1000자 이내로 작성해주세요.'
      };
    }

    // 특수문자 및 스팸 검증
    const spamPatterns = [
      /(http|https):\/\//gi,
      /www\./gi,
      /[<>]/g,
      /script/gi,
      /javascript/gi
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          message: '안전하지 않은 내용이 포함되어 있습니다.'
        };
      }
    }

    // 비속어 검증 (간단한 예시)
    const profanityWords = ['욕설', '비속어']; // 실제로는 더 많은 단어 포함
    const lowerInput = input.toLowerCase();
    
    for (const word of profanityWords) {
      if (lowerInput.includes(word)) {
        return {
          isValid: false,
          message: '부적절한 언어가 포함되어 있습니다.'
        };
      }
    }

    return {
      isValid: true,
      message: '입력이 유효합니다.'
    };

  } catch (error) {
    logger.error('입력 검증 중 오류:', error);
    return {
      isValid: false,
      message: '입력 검증 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 사업 분야 검증
 */
const validateCategory = (category) => {
  const validCategories = ['기술', '금융', '경영', '창업', '인력', '수출', '내수', '기타'];
  
  if (!category || !validCategories.includes(category)) {
    return {
      isValid: false,
      message: '유효하지 않은 사업 분야입니다. 다음 중에서 선택해주세요: ' + validCategories.join(', ')
    };
  }

  return {
    isValid: true,
    message: '유효한 사업 분야입니다.'
  };
};

/**
 * 사업 내용 검증
 */
const validateBusinessSummary = (summary) => {
  if (!summary || summary.length < 10) {
    return {
      isValid: false,
      message: '사업 내용을 10자 이상으로 자세히 설명해주세요.'
    };
  }

  if (summary.length > 500) {
    return {
      isValid: false,
      message: '사업 내용이 너무 깁니다. 500자 이내로 작성해주세요.'
    };
  }

  return {
    isValid: true,
    message: '유효한 사업 내용입니다.'
  };
};

/**
 * 이메일 검증
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      message: '유효하지 않은 이메일 형식입니다.'
    };
  }

  return {
    isValid: true,
    message: '유효한 이메일입니다.'
  };
};

/**
 * 전화번호 검증
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9-+\s()]+$/;
  
  if (!phone || !phoneRegex.test(phone) || phone.length < 10) {
    return {
      isValid: false,
      message: '유효하지 않은 전화번호 형식입니다.'
    };
  }

  return {
    isValid: true,
    message: '유효한 전화번호입니다.'
  };
};

/**
 * 사용자 ID 검증
 */
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    return {
      isValid: false,
      message: '유효하지 않은 사용자 ID입니다.'
    };
  }

  if (userId.length < 1 || userId.length > 100) {
    return {
      isValid: false,
      message: '사용자 ID 길이가 올바르지 않습니다.'
    };
  }

  return {
    isValid: true,
    message: '유효한 사용자 ID입니다.'
  };
};

/**
 * 명령어 검증
 */
const validateCommand = (command) => {
  const validCommands = ['/start', '/help', '/reset', '/status', '/시작', '/도움말', '/초기화', '/상태'];
  
  if (!command || !validCommands.includes(command.toLowerCase())) {
    return {
      isValid: false,
      message: '유효하지 않은 명령어입니다.'
    };
  }

  return {
    isValid: true,
    message: '유효한 명령어입니다.'
  };
};

module.exports = {
  validateUserInput,
  validateCategory,
  validateBusinessSummary,
  validateEmail,
  validatePhoneNumber,
  validateUserId,
  validateCommand
};
