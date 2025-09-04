# AI-GO (아이고) - 스마트 운전 교육 플랫폼

> 고령운전자를 위한 AI 기반 도로상황 퀴즈 서비스

## 🚗 프로젝트 개요

AI-GO는 실제 도로 상황을 담은 영상을 AI로 분석하여, 운전 중 발생할 수 있는 다양한 교통 시나리오를 퀴즈로 제공하는 교육 서비스입니다.

### 주요 기능
- 🎥 **외부 비디오 링크 재생**: YouTube, Vimeo, Google Drive 등 외부 플랫폼 비디오 지원
- 📝 **맞춤형 퀴즈**: 난이도별(상/중/하) 퀴즈 제공
- 📊 **학습 분석**: 개인별 학습 통계 및 오답노트 관리
- 🏆 **진도 관리**: 일일/주간 학습 현황 추적

## 🏗️ 시스템 아키텍처

```
Frontend (React/Vite) ←→ Backend (FastAPI) ←→ Database (MariaDB)
     ↓ Port 3005           ↓ Port 8080         ↓ Port 3307
```

## 🚀 빠른 시작

### 필수 요구사항
- Docker & Docker Compose
- Node.js 18+ (개발 시)
- Python 3.11+ (개발 시)

### 1. 전체 서비스 실행 (권장)

```bash
# 레포지토리 클론
git clone [repo-url]
cd webapp

# Docker Compose로 전체 실행
docker compose up -d --build

# 서비스 상태 확인
docker compose ps
```

**접속 URL:**
- 프론트엔드: http://localhost:3005
- 백엔드 API: http://localhost:8080
- API 문서: http://localhost:8080/docs

### 2. 개발 모드 (선택사항)

```bash
# 백엔드 개발
cd Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# 프론트엔드 개발 (별도 터미널)
cd Frontend  
npm install
npm run dev
```

## 📁 프로젝트 구조

```
webapp/
├── Backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── routers/      # API 라우터
│   │   ├── core/         # 인증, 보안, 공통 기능
│   │   └── main.py       # FastAPI 애플리케이션
│   ├── migrations/       # DB 마이그레이션
│   └── docker-compose-new.yml
├── Frontend/             # React/Vite 프론트엔드
│   ├── src/
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── services/     # API 서비스
│   │   └── store/        # Redux 상태 관리
│   └── package.json
├── docker-compose.yml    # 전체 서비스 컴포즈
└── README.md
```

## 🔧 환경 설정

### Backend 환경변수 (.env)
```env
SECRET_KEY=ai-go-secret-key-2025
DATABASE_URL=mysql+pymysql://app_user:app_pass@localhost:3307/ai_go
ALLOWED_ORIGINS=http://localhost:3005,http://localhost:8080
VIDEO_URL_WHITELIST=youtube.com,youtu.be,vimeo.com,drive.google.com
```

### Frontend 환경변수 (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=AI-GO
```

## 📚 API 문서

### 주요 엔드포인트

#### 인증
- `POST /api/v1/users/register` - 회원가입
- `POST /api/v1/users/login` - 로그인 (JWT 토큰 발급)
- `GET /api/v1/users/me` - 사용자 정보 조회

#### 비디오 (외부 URL 기반)
- `GET /api/v1/videos` - 비디오 목록 조회
- `POST /api/v1/videos` - 비디오 메타데이터 등록 (관리자)
- `GET /api/v1/videos/{video_id}` - 비디오 상세 조회

#### 오답노트
- `GET /api/v1/wrong-notes` - 오답노트 목록 (필터링, 페이지네이션 지원)
- `POST /api/v1/wrong-notes` - 오답 저장
- `GET /api/v1/wrong-notes/stats` - 오답 통계

#### 사용자 분석
- `GET /api/v1/users/{user_id}/analytics` - 사용자 학습 분석
- `GET /api/v1/users/me/analytics` - 내 학습 분석

## 🧪 테스트

### 백엔드 API 테스트

```bash
# 회원가입
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "테스트 사용자",
    "phone": "010-1234-5678",
    "birth_date": "1990-01-01"
  }'

# 로그인
curl -X POST http://localhost:8080/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# 비디오 목록 조회
curl -X GET http://localhost:8080/api/v1/videos
```

### 프론트엔드 테스트
1. http://localhost:3005 접속
2. 회원가입 → 로그인 → 대시보드 확인
3. 비디오 재생 → 퀴즈 풀이 → 오답노트 확인

## 🔒 보안

- JWT 기반 인증 시스템
- CORS 정책 적용
- 비디오 URL 화이트리스트 검증
- SQL 인젝션 방지 (SQLAlchemy ORM)

## 📊 모니터링

### 헬스체크 엔드포인트
- `GET /health` - 서버 상태
- `GET /health/db` - 데이터베이스 연결 상태
- `GET /admin/debug/requests` - 최근 요청 로그

## 🚧 배포

### Production 환경 변수 예시
```env
# Backend
SECRET_KEY=your-production-secret-key
DATABASE_URL=mysql+pymysql://user:pass@prod-db:3306/ai_go
ALLOWED_ORIGINS=https://ai-go.com,https://www.ai-go.com

# Frontend  
VITE_API_BASE_URL=https://api.ai-go.com
NODE_ENV=production
```

## 🤝 기여

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🏷️ 버전

- **v1.0.0** - 초기 릴리즈
  - JWT 인증 시스템
  - 외부 비디오 링크 재생
  - 오답노트 및 학습 분석
  - Docker 컴포즈 지원

---

**문의사항**: [팀 도로지킴이]