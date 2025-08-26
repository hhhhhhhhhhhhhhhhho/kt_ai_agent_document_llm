
'''
🤔 INPUT : 내 사업분야의 지원사업 데이터 가져와줘
🤖 OUTPUT : 미리 설정한 사업분야의 지원사업 데이터 출력

🤔 INPUT : (내 사업은 금융이지만 ) 확장할 수 있는 기술분야로의 지원사업 데이터 가져와줘
🤖 OUTPUT : 사업과 연계 된 기술분야 (AI, 핀테크) 기술분야로의 지원사업 데이터 출력

🤔 INPUT : 내 사업분야에 적용가능한 지원사업 데이터 가져오고 사업계획서 작성해줘
🤖 OUTPUT : 데이터 가져오는중...
🤖 OUTPUT : 사업계획서 작성 중...

'''

from src.vllm_matcher import VLLMMatcher
from src.user import User
from src.parsing import BizInfoAPI

if __name__ == "__main__":
    
    biz_parser = BizInfoAPI() ## API 클라이언트 초기화
    ####################
    ###테스트 유저셋 생성###
    user = User("test", "02", ["기술", "경영"],"제 사업은 개인정보 관리실태 컨설팅입니다. 현재 AI 를 활용한 자동화 사업에 도전하고 있습니다.")
    ####################
    
    ####지원사업 파싱 -> json 파일로 출력####
    biz_parser.categories_list_search(user.category_list)

    #### vLLM 객체 생성 ###
    vllm_matcher = VLLMMatcher()

    #### vLLM 매칭 실행 ###
    ### OUTPUT -> json 파일로 출력""""
    vllm_matcher.matchig_business_support_program(User("test", "02", ["기술", "경영"],"제 사업은 개인정보 관리실태 컨설팅입니다. 현재 AI 를 활용한 자동화 사업에 도전하고 있습니다."))
    ###############################


    ### JSON 파일 기반 신청서 작성 ###
    print("✅ write_support_program() 실행 중 ")
    #write_support_program()
    
    
    
    