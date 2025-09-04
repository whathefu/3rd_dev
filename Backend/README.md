# AI-GO Backend API

FastAPI 기반 백엔드 서비스

## 🚀 빠른 시작

### Docker를 사용한 실행 (권장)
```bash
cd /home/user/webapp
docker compose up -d --build
```

### 로컬 개발 환경
```bash
cd Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

## 📚 API 문서

### Swagger UI
- 개발: http://localhost:8080/docs
- 프로덕션: https://api.ai-go.com/docs

### 주요 엔드포인트

#### 인증
- `POST /api/v1/users/register` - 회원가입
- `POST /api/v1/users/login` - 로그인
- `GET /api/v1/users/me` - 사용자 정보

#### 비디오
- `GET /api/v1/videos` - 목록 조회
- `POST /api/v1/videos` - 등록 (관리자)
- `GET /api/v1/videos/{id}` - 상세 조회

#### 오답노트
- `GET /api/v1/wrong-notes` - 목록 조회
- `POST /api/v1/wrong-notes` - 저장
- `GET /api/v1/wrong-notes/stats` - 통계

#### 분석
- `GET /api/v1/users/me/analytics` - 학습 분석

## 🔧 환경 설정

### 환경 변수
```env
SECRET_KEY=your-secret-key
DATABASE_URL=mysql+pymysql://user:pass@host:port/db
ALLOWED_ORIGINS=http://localhost:3005
VIDEO_URL_WHITELIST=youtube.com,vimeo.com
```

## 🗄️ 데이터베이스

### 마이그레이션
```bash
# 마이그레이션 실행
mysql -u app_user -p ai_go < migrations/001_add_video_fields.sql
mysql -u app_user -p ai_go < migrations/002_add_wrong_note_chosen_option.sql

# 롤백
mysql -u app_user -p ai_go < migrations/001_rollback.sql
```

### 주요 테이블
- `users` - 사용자 정보
- `video` - 비디오 메타데이터 
- `quiz` - 퀴즈 문제
- `wrong_note` - 오답 기록

## 🧪 테스트

```bash
# API 헬스체크
curl http://localhost:8080/health

# 사용자 등록
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"테스트","phone":"010-1234-5678","birth_date":"1990-01-01"}'

# 로그인
curl -X POST http://localhost:8080/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

## 🔒 보안

- JWT 토큰 기반 인증
- 비밀번호 bcrypt 해싱
- CORS 정책 적용
- SQL 인젝션 방지 (SQLAlchemy ORM)

## 📊 모니터링

### 로그
- 요청/응답 로그 자동 기록
- `/admin/debug/requests` - 최근 100개 요청 확인

### 헬스체크
- `/health` - 서버 상태
- `/health/db` - 데이터베이스 연결

## 🔧 개발

### 프로젝트 구조
```
app/
├── main.py           # FastAPI 앱
├── database.py       # DB 연결
├── models/           # SQLAlchemy 모델
├── routers/          # API 라우터
├── core/             # 공통 기능
│   ├── auth.py       # 인증
│   ├── deps.py       # 의존성
│   └── security.py   # 보안
```

### 새 API 추가
1. `models/`에 SQLAlchemy 모델 추가
2. `routers/`에 라우터 추가  
3. `main.py`에 라우터 등록
4. 테스트 코드 작성