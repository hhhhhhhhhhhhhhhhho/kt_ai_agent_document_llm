#!/bin/bash

# Docker 빌드 스크립트

echo "🐳 Docker 이미지 빌드 시작..."

# 이미지 태그 설정
IMAGE_NAME="kt-ai-agent"
TAG="latest"

# Docker 빌드 실행
docker build -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Docker 이미지 빌드 완료: ${IMAGE_NAME}:${TAG}"
else
    echo "❌ Docker 이미지 빌드 실패"
    exit 1
fi
