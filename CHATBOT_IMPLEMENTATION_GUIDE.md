# 🚀 카카오톡 챗봇 + Python AI 시스템 연동 구현 가이드

## 📋 개요

이 가이드는 기존 Python AI 시스템에 Node.js 기반 카카오톡 챗봇을 연동하는 방법을 설명합니다.

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   카카오톡 사용자   │    │  Node.js 챗봇    │    │  Python AI      │
│                 │    │     서버        │    │     시스템      │
│                 │◄──►│                 │◄──►│                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 주요 컴포넌트

1. **카카오톡 챗봇 (Node.js)**
   - 카카오톡 웹훅 처리
   - 사용자 세션 관리
   - AI 시스템과의 통신

2. **Python AI 시스템**
   - vLLM 기반 지원사업 매칭
   - 기업마당 API 데이터 처리
   - RESTful API 제공

3. **Redis**
   - 사용자 세션 저장
   - 캐싱 및 성능 최적화

---

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd kt_ai_agent_document_llm

# 환경 변수 파일 생성
cp chatbot/env.example .env

# 환경 변수 설정
nano .env
```

### 2. Docker로 전체 시스템 실행

```bash
# 전체 시스템 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

### 3. 개별 서비스 실행

#### Node.js 챗봇 서버
```bash
cd chatbot
npm install
npm start
```

#### Python AI 시스템
```bash
cd backend
pip install -r requirements.txt
python main.py
```

---

## 📁 프로젝트 구조

```
kt_ai_agent_document_llm/
├── backend/                    # Python AI 시스템
│   ├── src/                   # 기존 Python 코드
│   ├── main.py               # Flask API 서버
│   ├── requirements.txt      # Python 의존성
│   └── Dockerfile           # Python 컨테이너
├── chatbot/                   # Node.js 카카오톡 챗봇
│   ├── src/
│   │   ├── controllers/      # 컨트롤러
│   │   ├── services/        # 비즈니스 로직
│   │   ├── middleware/      # 미들웨어
│   │   ├── utils/          # 유틸리티
│   │   └── config/         # 설정
│   ├── routes/              # API 라우트
│   ├── package.json        # Node.js 의존성
│   └── Dockerfile         # Node.js 컨테이너
├── docker-compose.yml       # 전체 시스템 오케스트레이션
└── .env                    # 환경 변수
```

---

## 🔧 환경 변수 설정

### 필수 환경 변수

```bash
# 카카오톡 API 설정
KAKAO_API_KEY=your_kakao_api_key_here
KAKAO_API_URL=https://kapi.kakao.com

# AI 시스템 설정
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000

# Redis 설정
REDIS_URL=redis://localhost:6379
REDIS_TTL=86400

# 서버 설정
PORT=3000
NODE_ENV=development

# 기업마당 API 설정
BIZINFO_API_KEY=your_bizinfo_api_key_here
```

---

## 📱 카카오톡 챗봇 설정

### 1. 카카오톡 비즈니스 계정 생성

1. [카카오톡 비즈니스](https://business.kakao.com) 접속
2. 비즈니스 계정 생성
3. 챗봇 서비스 신청

### 2. 웹훅 URL 설정

```
웹훅 URL: https://your-domain.com/kakao/webhook
```

### 3. API 키 발급

1. 카카오 개발자 콘솔 접속
2. 애플리케이션 생성
3. REST API 키 발급
4. 환경 변수에 설정

---

## 🔄 통신 플로우

### 1. 사용자 메시지 수신

```javascript
// 카카오톡 웹훅 수신
POST /kakao/webhook
{
  "userRequest": {
    "utterance": "기술 분야 지원사업 추천해주세요"
  },
  "user": {
    "id": "user123"
  }
}
```

### 2. AI 시스템 요청

```javascript
// AI 시스템에 요청 전송
POST http://ai-backend:8000/api/process
{
  "userId": "user123",
  "message": "기술 분야 지원사업 추천해주세요",
  "session": {
    "category": ["기술"],
    "businessSummary": ""
  }
}
```

### 3. AI 시스템 응답

```json
{
  "success": true,
  "type": "support_programs",
  "data": {
    "programs": [
      {
        "name": "AI 기술개발 지원사업",
        "score": "9점",
        "analysis": "AI 기술 개발에 적합한 지원사업입니다.",
        "url": "https://example.com",
        "summary": "AI 기술 개발 지원"
      }
    ]
  },
  "message": "1개의 지원사업을 찾았습니다."
}
```

### 4. 카카오톡 응답

```json
{
  "version": "2.0",
  "template": {
    "outputs": [
      {
        "carousel": {
          "type": "basicCard",
          "items": [
            {
              "title": "AI 기술개발 지원사업",
              "description": "AI 기술 개발 지원",
              "buttons": [
                {
                  "label": "상세보기",
                  "action": "webLink",
                  "webLinkUrl": "https://example.com"
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

---

## 🛠️ 개발 가이드

### 1. 새로운 명령어 추가

```javascript
// chatbot/src/controllers/kakaoController.js
async handleCommand(userId, message, session) {
  const command = message.toLowerCase().trim();

  switch (command) {
    case '/newcommand':
      return await this.handleNewCommand(userId);
    // ... 기존 명령어들
  }
}
```

### 2. 새로운 AI 서비스 엔드포인트 추가

```python
# backend/main.py
@app.route('/api/new-endpoint', methods=['POST'])
def new_endpoint():
    try:
        data = request.get_json()
        # 처리 로직
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

### 3. 새로운 미들웨어 추가

```javascript
// chatbot/src/middleware/newMiddleware.js
const newMiddleware = (req, res, next) => {
  // 미들웨어 로직
  next();
};

module.exports = newMiddleware;
```

---

## 🧪 테스트

### 1. 단위 테스트

```bash
# Node.js 테스트
cd chatbot
npm test

# Python 테스트
cd backend
python -m pytest tests/
```

### 2. 통합 테스트

```bash
# 전체 시스템 테스트
docker-compose up --build
curl -X POST http://localhost:3000/kakao/webhook \
  -H "Content-Type: application/json" \
  -d '{"userRequest":{"utterance":"테스트"},"user":{"id":"test"}}'
```

### 3. 헬스체크

```bash
# 챗봇 서버 헬스체크
curl http://localhost:3000/health

# AI 시스템 헬스체크
curl http://localhost:8000/health
```

---

## 📊 모니터링

### 1. 로그 확인

```bash
# 챗봇 로그
docker-compose logs -f chatbot

# AI 시스템 로그
docker-compose logs -f ai-backend

# Redis 로그
docker-compose logs -f redis
```

### 2. 메트릭 수집

- 사용자 세션 수
- API 요청 수
- 응답 시간
- 에러율

---

## 🚀 배포

### 1. 프로덕션 환경 설정

```bash
# 환경 변수 설정
export NODE_ENV=production
export KAKAO_API_KEY=your_production_key
export AI_SERVICE_URL=https://your-ai-service.com
```

### 2. Docker 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Nginx 포함 배포
docker-compose --profile production up --build
```

### 3. Kubernetes 배포

```bash
# Kubernetes 매니페스트 생성
kubectl apply -f k8s/
```

---

## 🔒 보안 고려사항

### 1. API 키 보안

- 환경 변수로 관리
- 프로덕션에서는 시크릿 관리 시스템 사용

### 2. Rate Limiting

- 사용자별 요청 제한
- IP별 요청 제한

### 3. 입력 검증

- 사용자 입력 검증
- SQL 인젝션 방지
- XSS 방지

---

## 🐛 문제 해결

### 1. 일반적인 문제

#### AI 시스템 연결 실패
```bash
# AI 시스템 상태 확인
curl http://localhost:8000/health

# 네트워크 연결 확인
docker-compose exec chatbot ping ai-backend
```

#### Redis 연결 실패
```bash
# Redis 상태 확인
docker-compose exec redis redis-cli ping

# Redis 로그 확인
docker-compose logs redis
```

#### 카카오톡 웹훅 오류
```bash
# 챗봇 로그 확인
docker-compose logs chatbot

# 웹훅 URL 확인
curl -X POST http://localhost:3000/kakao/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. 성능 최적화

- Redis 캐싱 활용
- AI 모델 최적화
- 데이터베이스 인덱싱

---

## 📞 지원

- **문서**: 이 가이드 참조
- **이슈**: GitHub Issues 사용
- **문의**: 개발팀 연락

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
