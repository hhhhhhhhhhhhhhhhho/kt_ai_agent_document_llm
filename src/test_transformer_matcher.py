"""
Transformers 매처 테스트 스크립트
"""

import json
import logging
from user import User
from transformer_matcher import TransformerMatcher

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_extract_support_programs():
    """지원사업 정보 추출 테스트"""
    logger.info("=== 지원사업 정보 추출 테스트 ===")
    
    matcher = TransformerMatcher()
    extracted_data = matcher.extract_support_programs_info("src/all_categories.json")
    
    # 결과 확인
    for category, programs in extracted_data.items():
        logger.info(f"{category}: {len(programs)}개 지원사업")
        if programs:
            first_program = programs[0]
            logger.info(f"  첫 번째 지원사업: {first_program['pblancNm'][:50]}...")
    
    return extracted_data


def test_user_matching():
    """사용자 매칭 테스트"""
    logger.info("=== 사용자 매칭 테스트 ===")
    
    # 테스트 사용자 생성
    test_users = [
        User(
            name="기술 스타트업",
            code="02",
            main_category=["기술"],
            main_business_summary="AI 기반 개인정보 관리 시스템 개발 및 컨설팅 서비스 제공"
        ),
        User(
            name="금융 컨설팅",
            code="01",
            main_category=["금융", "경영"],
            main_business_summary="핀테크 솔루션 개발 및 금융기관 디지털 전환 컨설팅"
        ),
        User(
            name="창업 지원",
            code="06",
            main_category=["창업", "기술"],
            main_business_summary="스타트업 창업 지원 및 기술 사업화 컨설팅"
        )
    ]
    
    matcher = TransformerMatcher()
    extracted_data = matcher.extract_support_programs_info("src/all_categories.json")
    
    for i, user in enumerate(test_users, 1):
        logger.info(f"\n--- 테스트 사용자 {i}: {user.name} ---")
        logger.info(f"사업분야: {user.category}")
        logger.info(f"사업내용: {user.main_business_summary}")
        
        try:
            matched_programs = matcher.match_support_programs(user, extracted_data)
            logger.info(f"매칭된 지원사업 수: {len(matched_programs)}")
            
            for j, program in enumerate(matched_programs, 1):
                logger.info(f"  {j}. {program['pblancNm'][:60]}...")
                
        except Exception as e:
            logger.error(f"매칭 실패: {e}")


def test_full_pipeline():
    """전체 파이프라인 테스트"""
    logger.info("=== 전체 파이프라인 테스트 ===")
    
    # 테스트 사용자
    user = User(
        name="AI 컨설팅 기업",
        code="02",
        main_category=["기술", "경영"],
        main_business_summary="AI 기반 개인정보 관리실태 컨설팅 및 자동화 솔루션 개발"
    )
    
    try:
        matcher = TransformerMatcher()
        
        # 1. 지원사업 정보 추출
        extracted_data = matcher.extract_support_programs_info("src/all_categories.json")
        
        # 2. 사용자 매칭
        matched_programs = matcher.match_support_programs(user, extracted_data)
        
        # 3. 결과 파일 생성
        matcher.create_matched_output_file(
            matched_programs, 
            "src/all_categories.json", 
            "src/test_transformer_matched_programs.json"
        )
        
        logger.info("전체 파이프라인 테스트 완료!")
        
    except Exception as e:
        logger.error(f"파이프라인 테스트 실패: {e}")


def test_model_loading():
    """모델 로딩 테스트"""
    logger.info("=== 모델 로딩 테스트 ===")
    
    try:
        # 기본 모델 로딩 테스트
        matcher = TransformerMatcher("K-intelligence/Midm-2.0-Base-Instruct")
        logger.info("기본 모델 로딩 성공")
        
        # 간단한 프롬프트 테스트
        test_prompt = "안녕하세요. 이것은 테스트입니다."
        response = matcher.generate_response(test_prompt, max_length=100)
        logger.info(f"테스트 응답: {response}")
        
    except Exception as e:
        logger.error(f"모델 로딩 테스트 실패: {e}")



# runpod 에서 실행 endpoint
if __name__ == "__main__":
    logger.info("Transformers 매처 테스트 시작")
    
    try:
        # 1. 모델 로딩 테스트
        test_model_loading()
        
        # 2. 지원사업 정보 추출 테스트
        test_extract_support_programs()
        
        # 3. 사용자 매칭 테스트
        test_user_matching()
        
        # 4. 전체 파이프라인 테스트
        test_full_pipeline()
        
        logger.info("모든 테스트 완료!")
        
    except Exception as e:
        logger.error(f"테스트 실행 중 오류 발생: {e}")
