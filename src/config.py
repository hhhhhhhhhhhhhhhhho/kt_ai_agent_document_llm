    
    #설정 파일
    #API 키와 기타 설정을 관리합니다.
    

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    # """애플리케이션 설정 클래스"""
    
    # API 설정
    BIZINFO_API_KEY: str = os.getenv('BIZINFO_API_KEY', os.getenv('BIZINFO_KEY'))
    BIZINFO_BASE_URL: str = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"
    
    # 기본 조회 설정
    DEFAULT_DATA_TYPE: str = "json"
    DEFAULT_SEARCH_CNT: int = 100
    DEFAULT_PAGE_UNIT: int = 20
    
    # 파일 저장 설정
    OUTPUT_DIR: str = os.path.dirname(__file__)
    DEFAULT_FILENAME_PREFIX: str = "bizinfo_data"
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = '%(asctime)s - %(levelname)s - %(message)s'
    
    # HTTP 요청 설정
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    
    @classmethod
    def get_api_key(cls) -> Optional[str]:
        """API 키를 반환합니다."""
        if cls.BIZINFO_API_KEY == 'YOUR_API_KEY_HERE':
            return None
        return cls.BIZINFO_API_KEY
    
    @classmethod
    def is_api_key_configured(cls) -> bool:
        """API 키가 설정되었는지 확인합니다."""
        return cls.get_api_key() is not None


# 분야 코드 매핑
CATEGORY_CODES = {
"금융": "01",
"기술": "02", 
"인력":  "03",
"수출":  "04",
"내수":  "05",
"창업":  "06",
"경영":  "07",
"기타":  "09"
}

# 해시태그 매핑
HASHTAGS = {
    "금융": ["금융", "자금", "융자", "보증"],
    "기술": ["기술", "R&D", "개발", "혁신"],
    "인력": ["인력", "채용", "교육", "훈련"],
    "수출": ["수출", "해외", "글로벌", "무역"],
    "내수": ["내수", "국내", "판로", "마케팅"],
    "창업": ["창업", "스타트업", "신규", "사업화"],
    "경영": ["경영", "관리", "시스템", "품질"],
    "기타": ["기타", "일반", "종합"]
}
