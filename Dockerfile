# Python 3.12 기반 Docker 이미지
FROM python:3.12-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사
COPY requirements.txt .

# NumPy 호환성 문제 해결을 위해 numpy<2 설치 (따옴표로 감싸기)
RUN pip install --no-cache-dir "numpy<2"

# Python 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 포트 설정 (필요시)
EXPOSE 8000

# 기본 명령어 설정
CMD ["python", "main.py"]
