#!/bin/bash

echo "EC2 서버 배포 시작..."

# 필요한 디렉토리 생성
mkdir -p data/mariadb

# 기존 컨테이너 중지 및 제거
echo "기존 컨테이너 정리..."
docker-compose -f docker-compose-ec2.yml down

# 이미지 빌드 및 컨테이너 시작
echo "컨테이너 빌드 및 시작..."
docker-compose -f docker-compose-ec2.yml up --build -d

# 컨테이너 상태 확인
echo "컨테이너 상태 확인..."
docker-compose -f docker-compose-ec2.yml ps

echo "배포 완료!"
echo "FastAPI 서비스: http://3.39.47.238:8000"
echo "MariaDB: 3.39.47.238:3306" 