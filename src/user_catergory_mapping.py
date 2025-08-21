import user
import parsing



def map_user_category(user: user.User):
    # 사용자 정보를 기반으로 분야 매핑
    main_business = user.main_business_summary
    

def scrapping_business_list(user: user.User, category: str):
    parsing.BizInfoAPI().basic_search()


if __name__ == "__main__":
    user = user.User("test", "02", ["기술", "경영"],"제 사업은 개인정보 관리실태 컨설팅입니다. 현재 AI 를 활용한 자동화 사업에 도전하고 있습니다.")
    print(user)

    parsing.BizInfoAPI().categories_list_search(user.category)
