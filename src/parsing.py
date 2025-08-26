import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging
from src.config import Config, CATEGORY_CODES,HASHTAGS
from dotenv import load_dotenv

load_dotenv()

# 로깅 설정
logging.basicConfig(level=Config.LOG_LEVEL, format=Config.LOG_FORMAT)
logger = logging.getLogger("parsing client")

class BizInfoAPI:
    """기업마당 API 클라이언트"""
    
    def __init__(self, api_key: str = None):
        """
        Args:
            api_key (str, optional): 기업마당에서 발급받은 서비스 인증키
                                   None일 경우 Config에서 가져옴
        """
        self.api_key = api_key or Config.get_api_key()
            # API 키 확인
        if not Config.is_api_key_configured():
            logger.error("API 키가 설정되지 않았습니다.")
            logger.info("다음 중 하나의 방법으로 API 키를 설정해주세요:")
            logger.info("1. config.py 파일에서 BIZINFO_API_KEY 설정")
            logger.info("2. 환경변수 BIZINFO_API_KEY 설정")
            logger.info("3. 기업마당(https://www.bizinfo.go.kr)에서 API 키 발급")
            logger.info("API 키 발급 문의: 02-867-9765")
            return

        if not self.api_key:
            raise ValueError("API 키가 설정되지 않았습니다. config.py 또는 환경변수에서 설정해주세요.")
        self.base_url = Config.BIZINFO_BASE_URL
        
    def get_support_programs(self, 
                           data_type: str = "json",
                           search_cnt: Optional[int] = None,
                           search_lclas_id: Optional[str] = None,
                           hashtags: Optional[str] = None,
                           page_unit: Optional[int] = None,
                           page_index: Optional[int] = None) -> Dict:
        """
        지원사업 정보를 조회합니다.
        
        Args:
            data_type (str): 데이터 타입 (rss/json)
            search_cnt (int, optional): 조회건수 (0 또는 None일 경우 전체 데이터)
            search_lclas_id (str, optional): 분야 코드
                - 01: 금융, 02: 기술, 03: 인력, 04: 수출, 05: 내수, 06: 창업, 07: 경영, 09: 기타
            hashtags (str, optional): 해시태그 (다중입력 가능, 쉼표로 구분)
            page_unit (int, optional): 한 페이지당 데이터 개수
            page_index (int, optional): 페이지 번호
            
        Returns:
            Dict: API 응답 데이터
        """
        params = {
            'crtfcKey': self.api_key,
            'dataType': data_type
        }
        
        if search_cnt is not None:
            params['searchCnt'] = str(search_cnt)
        if search_lclas_id is not None:
            params['searchLclasId'] = search_lclas_id
        if hashtags is not None:
            params['hashtags'] = hashtags
        if page_unit is not None:
            params['pageUnit'] = str(page_unit)
        if page_index is not None:
            params['pageIndex'] = str(page_index)
            
        try:
            logger.info(f"API 요청 시작: {self.base_url}")
            logger.info(f"요청 파라미터: {params}")
            
            response = requests.get(self.base_url, params=params, timeout=Config.REQUEST_TIMEOUT)
            response.raise_for_status()
            
            logger.info(f"API 응답 성공: 상태코드 {response.status_code}")
            
            if data_type == "json":
                return response.json()
            else:
                return {"xml_content": response.text}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API 요청 실패: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {e}")
            raise


    def save_to_json(self,data: Dict, filename: str = None) -> str:
        """
        데이터를 JSON 파일로 저장합니다.
        
        Args:
            data (Dict): 저장할 데이터
            filename (str, optional): 파일명 (None일 경우 자동 생성)
            
        Returns:
            str: 저장된 파일 경로
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{Config.DEFAULT_FILENAME_PREFIX}_{timestamp}.json"
        
        filepath = os.path.join(Config.OUTPUT_DIR, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"데이터가 성공적으로 저장되었습니다: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"파일 저장 실패: {e}")
            raise



    def basic_search(self):
        """기본 사용법 예시"""
        logger.info("=== 기본 사용법 예시 ===")
        
        # 기본 조회 (최대 50건)
        data = self.get_support_programs(
            data_type="json",
            search_cnt=50
        )
        
        # JSON 파일로 저장
        filepath = self.save_to_json(data, "basic_usage_example.json")
        logger.info(f"기본 사용법 예시 데이터 저장 완료: {filepath}")


    def filtered_search(self, category: str):
        """특정 분야의 지원사업 데이터 조회"""

        logger.info("=== 필터링된 검색 예시 ===")
        
        
        tech_data = self.get_support_programs(
            data_type="json",
            search_lclas_id=CATEGORY_CODES[category],  # 기술 분야
            search_cnt=30,
            hashtags=HASHTAGS[category]
        )
        
        # JSON 파일로 저장
        filepath = self.save_to_json(tech_data, "tech_support_programs.json")
        logger.info(f"기술 분야 지원사업 데이터 저장 완료: {filepath}")


    def categories_list_search(self,category_list: list):
        # 분야별 코드 정의
        """
        Argument : category_list : list
        Example : ["기술", "금융"]
        카테고리 리스트를 입력받아서 리스트 전체의 지원사업을 반환하는 함수입니다. (현재 파일출력)
        Return : category_data : dict
        """
        # 새로운 딕셔너리 만들기
        categories = {k: CATEGORY_CODES[k] for k in category_list}
        category_data = {}
        extract_category_data = {}

        for name, code in categories.items():
            logger.info(f"{name} 분야 조회 중...")
            
            try:
                data = self.get_support_programs(
                    data_type="json",
                    search_lclas_id=code,
                    search_cnt=20
                )
                
                category_data[name] = data
                # 개별 파일로도 저장
                self.save_to_json(data, f"data/{name}_support_programs.json")
                
                try:
                    file_path = 'data/all_categories.json'
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data_for_extract = json.load(f) # 파일에서 JSON 데이터를 읽어와 Python 딕셔너리로 변환
                    
                    print(f"'{file_path}' 파일에서 데이터를 성공적으로 로드했습니다.\n")
                    print(type(data_for_extract))

                    for section in data_for_extract:
                        for support_porgram in data_for_extract[section]['jsonArray']:
                            extract_category_data[support_porgram['pblancNm']] = support_porgram['bsnsSumryCn']
                    file_path = self.save_to_json(extract_category_data,"src/data/extract_catories.json")
                    print(f'✅ {file_path} 필드 추출본 파일 저장 성공')        
                    logger.info(f'✅ {file_path} 필드 추출본 파일 저장 성공')        
                except Exception as e:
                    logger.error(f"Extract 저장 실패 {e}")
                
            except Exception as e:
                logger.error(f"{name} 분야 조회 실패: {e}")
        
        # 전체 분야 데이터를 하나의 파일로 저장
        filepath = self.save_to_json(category_data, "data/all_categories.json")
        logger.info(f"전체 분야 데이터 저장 완료: {filepath}")


if __name__ == "__main__":

    # 로깅 설정
    '''
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger(__name__)

    logger.info("기업마당 API를 시작합니다.")
    
    client = BizInfoAPI(os.getenv("BIZINFO_KEY"))
    # 각 예시 실행
    
    try:
        client.basic_search()
        client.filtered_search()
        client.categories_list_search()    
        logger.info("모든 예시 실행 완료!")
        
    except Exception as e:
        logger.error(f"예시 실행 중 오류 발생: {e}")
    '''