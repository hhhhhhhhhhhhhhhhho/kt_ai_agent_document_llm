"""
Python AI 시스템 메인 서버
카카오톡 챗봇과 연동하여 지원사업 추천 서비스 제공
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os
from datetime import datetime
import json

# 로컬 모듈 임포트
from src.vllm_matcher import VLLMMatcher
from src.user import User
from src.parsing import BizInfoAPI
from src.config import Config

# FastAPI 앱 초기화
app = FastAPI(
    title="KT AI Agent Document LLM API",
    description="카카오톡 챗봇과 연동하여 지원사업 추천 서비스를 제공하는 AI 시스템",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic 모델 정의
class UserRequest(BaseModel):
    userId: str
    message: str
    session: Optional[Dict[str, Any]] = {}

class BatchRequest(BaseModel):
    requests: List[UserRequest]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Optional[Dict[str, bool]] = None

class ProcessResponse(BaseModel):
    success: bool
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None

# 전역 변수
vllm_matcher = None
biz_parser = None

def initialize_services():
    """서비스 초기화"""
    global vllm_matcher, biz_parser
    
    try:
        logger.info("AI 서비스 초기화 시작...")
        
        # vLLM 매처 초기화
        vllm_matcher = VLLMMatcher()
        logger.info("vLLM 매처 초기화 완료")
        
        # API 파서 초기화
        biz_parser = BizInfoAPI()
        logger.info("API 파서 초기화 완료")
        
        logger.info("모든 서비스 초기화 완료")
        
    except Exception as e:
        logger.error(f"서비스 초기화 실패: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """헬스체크 엔드포인트"""
    try:
        return HealthResponse(
            status='healthy',
            timestamp=datetime.now().isoformat(),
            services={
                'vllm_matcher': vllm_matcher is not None,
                'biz_parser': biz_parser is not None
            }
        )
    except Exception as e:
        logger.error(f"헬스체크 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process", response_model=ProcessResponse)
async def process_user_request(request: UserRequest):
    """사용자 요청 처리"""
    try:
        logger.info(f"사용자 요청 처리 시작 - ID: {request.userId}, 메시지: {request.message}")
        
        # 사용자 정보 생성
        user = create_user_from_request(request.userId, request.message, request.session)
        
        # AI 매칭 실행
        result = process_ai_matching(user, request.message)
        
        return ProcessResponse(**result)
        
    except Exception as e:
        logger.error(f"사용자 요청 처리 실패: {e}")
        raise HTTPException(status_code=500, detail="처리 중 오류가 발생했습니다.")

@app.post("/api/batch")
async def process_batch_request(request: BatchRequest):
    """배치 요청 처리"""
    try:
        results = []
        for req in request.requests:
            try:
                user = create_user_from_request(req.userId, req.message, req.session)
                result = process_ai_matching(user, req.message)
                results.append(result)
                
            except Exception as e:
                logger.error(f"배치 요청 중 개별 요청 실패: {e}")
                results.append({
                    'success': False,
                    'error': str(e)
                })
        
        return {
            'success': True,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"배치 요청 처리 실패: {e}")
        raise HTTPException(status_code=500, detail="배치 처리 중 오류가 발생했습니다.")

def create_user_from_request(user_id, message, session):
    """요청 데이터로부터 사용자 객체 생성"""
    # 세션에서 카테고리 추출
    categories = session.get('category', [])
    business_summary = session.get('businessSummary', '')
    
    # 메시지에서 카테고리 추출 시도
    if not categories and message:
        categories = extract_categories_from_message(message)
    
    # 메시지에서 사업 내용 추출 시도
    if not business_summary and message:
        business_summary = extract_business_summary_from_message(message)
    
    return User(
        name=user_id,
        code="02",  # 기본값
        main_category=categories,
        main_business_summary=business_summary
    )

def extract_categories_from_message(message):
    """메시지에서 카테고리 추출"""
    categories = []
    message_lower = message.lower()
    
    category_mapping = {
        '기술': ['기술', 'tech', 'ai', '개발', '소프트웨어'],
        '금융': ['금융', 'finance', '핀테크', 'fintech'],
        '경영': ['경영', 'management', '컨설팅', 'consulting'],
        '창업': ['창업', 'startup', '스타트업', '사업화'],
        '인력': ['인력', 'hr', '채용', '교육'],
        '수출': ['수출', 'export', '해외', '글로벌'],
        '내수': ['내수', 'domestic', '국내', '판로'],
        '기타': ['기타', 'other', '일반']
    }
    
    for category, keywords in category_mapping.items():
        if any(keyword in message_lower for keyword in keywords):
            categories.append(category)
    
    return categories if categories else ['기술']  # 기본값

def extract_business_summary_from_message(message):
    """메시지에서 사업 내용 추출"""
    # 간단한 추출 로직 (실제로는 더 정교한 NLP 필요)
    if len(message) > 10:
        return message
    return ""

def process_ai_matching(user, message):
    """AI 매칭 처리"""
    try:
        # 지원사업 정보 추출
        all_categories_file = "src/data/all_categories.json"
        extracted_data = vllm_matcher.extract_support_programs_info(all_categories_file)
        
        # vLLM 매칭 실행
        matched_programs = vllm_matcher.match_support_programs(user, extracted_data)
        
        # 결과 포맷팅
        if matched_programs:
            programs_data = []
            for program in matched_programs:
                if isinstance(program, list) and len(program) >= 3:
                    name, score, analysis = program
                    programs_data.append({
                        'name': name,
                        'score': score,
                        'analysis': analysis,
                        'url': '#',  # 실제 URL은 원본 데이터에서 가져와야 함
                        'summary': analysis
                    })
            
            return {
                'success': True,
                'type': 'support_programs',
                'data': {
                    'programs': programs_data,
                    'userInfo': {
                        'categories': user.category_list,
                        'businessSummary': user.main_business_summary
                    }
                },
                'message': f'{len(programs_data)}개의 지원사업을 찾았습니다.'
            }
        else:
            return {
                'success': True,
                'type': 'no_results',
                'data': {
                    'programs': [],
                    'userInfo': {
                        'categories': user.category_list,
                        'businessSummary': user.main_business_summary
                    }
                },
                'message': '현재 조건에 맞는 지원사업을 찾을 수 없습니다.'
            }
            
    except Exception as e:
        logger.error(f"AI 매칭 처리 실패: {e}")
        return {
            'success': False,
            'type': 'error',
            'message': 'AI 매칭 처리 중 오류가 발생했습니다.'
        }

@app.get("/api/categories")
async def get_categories():
    """지원사업 카테고리 목록 조회"""
    try:
        from src.config import CATEGORY_CODES
        return {
            'success': True,
            'data': {
                'categories': list(CATEGORY_CODES.keys()),
                'codes': CATEGORY_CODES
            }
        }
    except Exception as e:
        logger.error(f"카테고리 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="카테고리 조회 중 오류가 발생했습니다.")

@app.post("/api/refresh-data")
async def refresh_support_data():
    """지원사업 데이터 새로고침"""
    try:
        if not biz_parser:
            raise HTTPException(status_code=500, detail="API 파서가 초기화되지 않았습니다.")
        
        # 데이터 새로고침 실행
        biz_parser.categories_list_search(['기술', '경영', '금융', '창업'])
        
        return {
            'success': True,
            'message': '지원사업 데이터가 새로고침되었습니다.'
        }
        
    except Exception as e:
        logger.error(f"데이터 새로고침 실패: {e}")
        raise HTTPException(status_code=500, detail="데이터 새로고침 중 오류가 발생했습니다.")

# 서비스 초기화
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 서비스 초기화"""
    initialize_services()

if __name__ == '__main__':
    import uvicorn
    try:
        port = int(os.environ.get('PORT', 8000))
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=False,
            workers=1
        )
    except Exception as e:
        logger.error(f"서버 시작 실패: {e}")
        exit(1)
