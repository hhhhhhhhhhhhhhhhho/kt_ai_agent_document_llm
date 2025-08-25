#!/bin/bash

# 개발용 Docker 실행 스크립트

echo "🔧 개발용 Docker 컨테이너 실행 시작..."

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. 기본 환경 변수를 사용합니다."
    echo "BIZINFO_API_KEY=your_api_key_here" > .env
fi

# 개발용 서비스 실행
docker-compose --profile dev up --build

echo "✅ 개발용 Docker 컨테이너 실행 완료"
