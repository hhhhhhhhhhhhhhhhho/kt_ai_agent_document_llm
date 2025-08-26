"""
vLLM을 사용한 지원사업 매칭 시스템
사용자의 사업분야와 지원사업 정보를 분석하여 적합한 지원사업을 추출합니다.
"""

import json
import os
from typing import Dict, List, Any
import logging
from src.user import User
from vllm import LLM, SamplingParams

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VLLMMatcher:
    """vLLM을 사용한 지원사업 매칭 클래스"""
    
    def __init__(self, model_name: str = "K-intelligence/Midm-2.0-Base-Instruct"): ## KT 믿:음 모델을 사용합니다. 
        """
        Args:
            model_name (str): 사용할 vLLM 모델명
        """
        self.model_name = model_name
        self.llm = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """vLLM 모델 초기화"""
        try:
            logger.info(f"vLLM 모델 초기화 중: {self.model_name}")
            self.llm = LLM(model=self.model_name)
            logger.info("vLLM 모델 초기화 완료")
        except Exception as e:
            logger.error(f"vLLM 모델 초기화 실패: {e}")
            raise
    
    def extract_support_programs_info(self, all_categories_file: str) -> Dict[str, List[Dict]]:
        """
        all_categories.json 파일에서 pblancNm과 bsnsSumryCn만 추출하여 새로운 딕셔너리 생성
        
        Args:
            all_categories_file (str): all_categories.json 파일 경로
            
        Returns:
            Dict[str, List[Dict]]: 카테고리별 지원사업 정보 (pblancNm, bsnsSumryCn만 포함)
        """
        try:
            with open(all_categories_file, 'r', encoding='utf-8') as f:
                all_data = json.load(f)
            
            extracted_data = {}
            
            for category, category_data in all_data.items():
                if 'jsonArray' in category_data:
                    extracted_programs = []
                    for program in category_data['jsonArray']:
                        extracted_program = {
                            'pblancNm': program.get('pblancNm', ''),
                            'bsnsSumryCn': program.get('bsnsSumryCn', ''),
                            'original_index': category_data['jsonArray'].index(program)  # 원본 인덱스 저장
                        }
                        extracted_programs.append(extracted_program)
                    
                    extracted_data[category] = extracted_programs
            
            logger.info(f"지원사업 정보 추출 완료: {len(extracted_data)}개 카테고리")
            return extracted_data
            
        except Exception as e:
            logger.error(f"지원사업 정보 추출 실패: {e}")
            raise
    
    def create_matching_prompt(self, user: User, support_programs: List[Dict]) -> str:
        """
        사용자 정보와 지원사업 정보를 바탕으로 매칭 프롬프트 생성
        
        Args:
            user (User): 사용자 정보
            support_programs (List[Dict]): 지원사업 정보 리스트
            
        Returns:
            str: vLLM 입력용 프롬프트
        """
        # 사용자 정보 요약
        user_info = f"""
사용자 정보:
- 사업분야: {', '.join(user.category_list)}
- 사업내용: {user.main_business_summary}
"""
        
        # 지원사업 정보 요약
        programs_info = ""
        for i, program in enumerate(support_programs):
            programs_info += f"""
지원사업 {i+1}:
- 사업명: {program['pblancNm']}
- 사업내용: {program['bsnsSumryCn']}
"""
        
        # 매칭 지시사항
        matching_instruction = """
위의 사용자 정보와 지원사업 정보를 분석하여, 사용자의 사업분야와 사업내용에 가장 적합한 지원사업을 선택해주세요.

분석 기준:
1. 사용자의 사업분야와 지원사업의 분야 일치도
2. 사용자의 사업내용과 지원사업 내용의 연관성
3. 지원사업의 구체성과 실용성

각 지원사업에 대해 0-10점의 적합도 점수를 매기고, 7점 이상인 지원사업만 선택해주세요.
응답 형식: "
{지원사업 이름} : {점수 0/0 형식 }"


"""
        
        full_prompt = user_info + programs_info + matching_instruction
        return full_prompt
    
    def match_support_programs(self, user: User, extracted_data: Dict[str, List[Dict]]) -> List[Dict]:
        """
        vLLM을 사용하여 사용자에게 적합한 지원사업 매칭
        
        Args:
            user (User): 사용자 정보
            extracted_data (Dict[str, List[Dict]]): 추출된 지원사업 정보
            
        Returns:
            List[Dict]: 매칭된 지원사업 정보 (원본 데이터 포함)
        """
        try:
            # 사용자의 카테고리와 관련된 지원사업들 수집
            relevant_programs = []
            category_indices = {}  # 카테고리별 원본 인덱스 매핑
            
            for user_category in user.category_list:
                if user_category in extracted_data:
                    for program in extracted_data[user_category]:
                        relevant_programs.append(program)
                        # 카테고리와 원본 인덱스 매핑 저장
                        category_indices[f"{user_category}_{program['original_index']}"] = {
                            'category': user_category,
                            'original_index': program['original_index']
                        }
            
            if not relevant_programs:
                logger.warning("사용자 카테고리와 관련된 지원사업이 없습니다.")
                return []
            
            # vLLM 프롬프트 생성
            prompt = self.create_matching_prompt(user, relevant_programs)
            
            # vLLM 추론
            sampling_params = SamplingParams(
                temperature=0.1,
                top_p=0.9,
                max_tokens=20000
            )
            
            logger.info("vLLM 매칭 분석 시작...")
            outputs = self.llm.generate([prompt], sampling_params)
            result = outputs[0].outputs[0].text
            
            logger.info(f"vLLM 분석 결과: {result}")
            
            # 결과 파싱 및 매칭된 지원사업 추출
            matched_programs = self._parse_matching_result(result, relevant_programs, category_indices)
            
            return matched_programs
            
        except Exception as e:
            logger.error(f"지원사업 매칭 실패: {e}")
            raise
    
    def _parse_matching_result(self, vllm_result: str, relevant_programs: List[Dict], category_indices: Dict) -> List[Dict]:
        """
        vLLM 결과를 파싱하여 매칭된 지원사업 추출
        
        Args:
            vllm_result (str): vLLM 분석 결과
            relevant_programs (List[Dict]): 관련 지원사업 리스트
            category_indices (Dict): 카테고리별 인덱스 매핑
            
        Returns:
            List[Dict]: 매칭된 지원사업 정보
        """
        matched_programs = []
        name= None
        score=None
        analysis=None
        # 간단한 파싱 로직 (실제로는 더 정교한 파싱이 필요할 수 있음)
        lines = vllm_result.strip().split('\n')
        
        for line in lines:
            if "**" in line:
                name = line.strip('*')
            elif "- 점수" in line:
                score = line[6:11]
            elif "- 분석" in line:
                analysis = line

            if name is not None and score is not None and analysis is not None:
                if int(score[:2]) > 7:
                    matched_programs.append([name,score,analysis])
                else:
                    logger.info(f"🤔 {name} 은 {analysis} 이유로 6점 이하 이므로 추천하지 않습니다.")


        
        # 매칭 결과가 없으면 상위 3개 반환
        if not matched_programs:
            logger.info("vLLM 매칭 결과가 없어 상위 3개 지원사업을 반환합니다.")
            matched_programs = relevant_programs[:3]
        
        return matched_programs
    
    def create_matched_output_file(self, matched_programs: List[Dict], all_categories_file: str, output_file: str):
        """
        매칭된 지원사업을 원본 데이터와 함께 새로운 파일로 저장
        
        Args:
            matched_programs (List[Dict]): 매칭된 지원사업 정보
            all_categories_file (str): 원본 all_categories.json 파일 경로
            output_file (str): 출력 파일 경로
        """
        try:
            # 원본 데이터 로드
            with open(all_categories_file, 'r', encoding='utf-8') as f:
                all_data = json.load(f)
            
            # 매칭된 지원사업의 원본 데이터 수집
            results_with_data = []

            for data_category in all_data:
                json_array = all_data[data_category]["jsonArray"]

                for name, score, analysis in matched_programs:
                    # JSON 안에서 name과 일치하는 항목 찾기
                    matched_item = next((item for item in json_array if item["pblancNm"] == name), None)
                    if matched_item:
                        # 원하는 데이터와 함께 저장
                        results_with_data.append({
                            "name": name,
                            "score": score,
                            "analysis": analysis,
                            "rceptEngnHmpgUrl": matched_item.get("rceptEngnHmpgUrl"),
                            "reqstBeginEndDe": matched_item.get("reqstBeginEndDe"),
                            "bsnsSumryCn": matched_item.get("bsnsSumryCn")
                        })
            # 결과 저장

            print(f"\n\n\n {results_with_data} \n\n\n")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results_with_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"매칭된 지원사업 데이터 저장 완료: {output_file}")
            
        except Exception as e:
            logger.error(f"매칭 결과 저장 실패: {e}")
            raise


    def matchig_business_support_program(self,user: User):
        """메인 실행 함수"""
        
        # 사용자 정보 생성 (예시)
        user = User(
            name="테스트 사용자",
            code="02",
            main_category=["기술", "경영"],
            main_business_summary="제 사업은 개인정보 관리실태 컨설팅입니다. 현재 AI를 활용한 자동화 사업에 도전하고 있습니다."
        )
        
        # 파일 경로 설정
        all_categories_file = "src/data/all_categories.json"
        output_file = "src/data/matched_support_programs.json"
        
        try:
            
            # 1. all_categories.json에서 pblancNm과 bsnsSumryCn 추출
            logger.info("지원사업 정보 추출 시작...")
            extracted_data = self.extract_support_programs_info(all_categories_file)

            # 2. vLLM을 사용한 매칭
            logger.info("vLLM 매칭 시작...")
            matched_programs = self.match_support_programs(user, extracted_data)
            #print(f"\n\n\n\n {matched_programs}  \n\n\n\n") 
            # 3. 매칭된 지원사업을 원본 데이터와 함께 저장
            logger.info("매칭 결과 저장 시작...")
            self.create_matched_output_file(matched_programs, all_categories_file, output_file)
            
            logger.info(f"총 {len(matched_programs)}개의 지원사업이 매칭되었습니다.")
            
        except Exception as e:
            logger.error(f"프로세스 실행 중 오류 발생: {e}")



if __name__ == "__main__":
    pass