# AI-GO 테스트 시나리오

## 🔧 환경 준비

### 1. 서비스 실행
```bash
cd /home/user/webapp
docker compose up -d --build

# 서비스 상태 확인
docker compose ps
```

**예상 결과**: 3개 서비스 모두 `Up` 상태
- `webapp-mariadb-1` (포트 3307)
- `webapp-api-1` (포트 8080) 
- `webapp-frontend-1` (포트 3005)

### 2. 초기 연결 테스트
```bash
# API 서버 헬스체크
curl http://localhost:8080/health
# 예상 응답: {"status":"ok"}

# DB 연결 확인
curl http://localhost:8080/health/db  
# 예상 응답: {"status":"ok","database":"connected"}

# 프론트엔드 확인
curl -I http://localhost:3005
# 예상 응답: HTTP/1.1 200 OK
```

## 🧪 백엔드 API 테스트

### 1. 사용자 인증 플로우

#### 1.1 회원가입 (201 Created 예상)
```bash
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ai-go.com",
    "password": "testpass123", 
    "name": "김운전",
    "phone": "010-1234-5678",
    "birth_date": "1980-01-01"
  }'
```

**예상 응답** (201):
```json
{
  "user_id": "uuid-string",
  "email": "test@ai-go.com",
  "name": "김운전"
}
```

#### 1.2 로그인 (200 OK 예상)
```bash
curl -X POST http://localhost:8080/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ai-go.com",
    "password": "testpass123"
  }'
```

**예상 응답** (200):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**토큰 저장**: 이후 API 호출에 사용할 토큰을 환경변수에 저장
```bash
export TOKEN="위에서_받은_access_token_값"
```

#### 1.3 사용자 정보 조회 (200 OK 예상)
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (200):
```json
{
  "user_id": "uuid-string",
  "email": "test@ai-go.com", 
  "name": "김운전"
}
```

#### 1.4 인증 실패 테스트 (401 Unauthorized 예상)
```bash
# 잘못된 토큰으로 요청
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer invalid-token"
```

**예상 응답** (401):
```json
{
  "code": 401,
  "message": "토큰이 유효하지 않습니다.",
  "detail": "토큰이 유효하지 않습니다."
}
```

### 2. 비디오 관리 API

#### 2.1 비디오 목록 조회 (200 OK 예상)
```bash
curl -X GET http://localhost:8080/api/v1/videos
```

**예상 응답** (200): 빈 배열 또는 기존 비디오 목록

#### 2.2 비디오 등록 (201 Created 예상)
```bash
curl -X POST http://localhost:8080/api/v1/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "교차로 상황 판단",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "difficulty": 2,
    "description": "교차로에서의 안전한 좌회전 방법",
    "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "duration_sec": 180
  }'
```

**예상 응답** (201):
```json
{
  "video_id": "uuid-string",
  "title": "교차로 상황 판단",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "difficulty": 2,
  "description": "교차로에서의 안전한 좌회전 방법",
  "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", 
  "duration_sec": 180,
  "created_at": "2025-09-04T12:00:00"
}
```

#### 2.3 비디오 상세 조회 (200 OK 예상)
```bash
# 위에서 생성한 video_id 사용
curl -X GET http://localhost:8080/api/v1/videos/{video_id}
```

#### 2.4 필터링된 비디오 목록 (200 OK 예상)
```bash
# 난이도 2(중급) 비디오만 조회, 5개 제한
curl -X GET "http://localhost:8080/api/v1/videos?level=2&limit=5"
```

#### 2.5 잘못된 URL로 비디오 등록 (422 Unprocessable Entity 예상)
```bash
curl -X POST http://localhost:8080/api/v1/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "잘못된 URL 테스트",
    "video_url": "https://malicious-site.com/video.mp4",
    "difficulty": 1,
    "description": "화이트리스트에 없는 URL"
  }'
```

**예상 응답** (422): URL 화이트리스트 검증 실패

### 3. 오답노트 API

#### 3.1 오답 저장 (201 Created 예상)
```bash
curl -X POST http://localhost:8080/api/v1/wrong-notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question_id": "quiz-uuid-1",
    "chosen_option": "좌회전 신호에서 바로 출발"
  }'
```

#### 3.2 오답노트 목록 조회 (200 OK 예상)
```bash
curl -X GET http://localhost:8080/api/v1/wrong-notes \
  -H "Authorization: Bearer $TOKEN"
```

#### 3.3 오답노트 통계 (200 OK 예상)
```bash
curl -X GET http://localhost:8080/api/v1/wrong-notes/stats?days=30 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 사용자 분석 API

#### 4.1 내 학습 분석 (200 OK 예상)
```bash
curl -X GET http://localhost:8080/api/v1/users/me/analytics?days=30 \
  -H "Authorization: Bearer $TOKEN"
```

**예상 응답** (200):
```json
{
  "total": 15,
  "accuracy": 80,
  "by_level": [
    {"level": 1, "total": 5, "accuracy": 75, "wrong_count": 1},
    {"level": 2, "total": 7, "accuracy": 85, "wrong_count": 1}, 
    {"level": 3, "total": 3, "accuracy": 66, "wrong_count": 1}
  ],
  "recent": [
    {"date": "2025-09-04", "quiz_count": 3, "accuracy": 66},
    {"date": "2025-09-03", "quiz_count": 5, "accuracy": 80}
  ]
}
```

## 🌐 프론트엔드 E2E 테스트

### 1. 회원가입 및 로그인 플로우

1. **브라우저에서 접속**
   - URL: http://localhost:3005
   - 예상: AI-GO 로그인 페이지 표시

2. **회원가입**
   - "회원가입" 버튼 클릭 → 회원가입 페이지로 이동
   - 폼 작성 후 제출
   - 예상: 회원가입 완료 후 로그인 페이지로 리다이렉트

3. **로그인**
   - 이메일/비밀번호 입력
   - "로그인" 버튼 클릭
   - 예상: 홈페이지로 리다이렉트, 사용자명 표시

### 2. 대시보드 기능 확인

1. **학습 통계 확인**
   - 완료한 퀴즈 수 표시 확인
   - 정답률 표시 확인
   - 연속 학습일 표시 확인

2. **비디오 섹션**
   - 비디오 목록 로딩 확인
   - 비디오 선택 시 재생 확인
   - YouTube 비디오 임베드 정상 작동 확인

### 3. 오답노트 페이지

1. **오답노트 접속**
   - 사이드바 또는 메뉴에서 "오답노트" 클릭
   - 예상: 오답노트 목록 페이지 표시

2. **필터링 기능**
   - 난이도별 필터 적용 테스트
   - 페이지네이션 동작 확인

### 4. 마이페이지

1. **사용자 분석 확인**
   - 마이페이지 접속
   - 학습 통계 차트/그래프 표시 확인
   - 레벨별 성취도 확인

## 🚨 에러 처리 테스트

### 1. 네트워크 에러 시뮬레이션

1. **백엔드 서버 중단**
   ```bash
   docker compose stop api
   ```
   - 프론트엔드에서 API 호출 시 에러 메시지 표시 확인

2. **데이터베이스 연결 끊김**
   ```bash
   docker compose stop mariadb
   ```
   - 백엔드 API 호출 시 500 에러 응답 확인

### 2. 인증 에러 테스트

1. **만료된 토큰**
   - 로컬스토리지에서 토큰을 임의 값으로 변경
   - API 호출 시 401 에러 및 자동 로그아웃 확인

2. **권한 없는 접근**
   - 로그아웃 상태에서 보호된 페이지 접근 시도
   - 로그인 페이지로 리다이렉트 확인

## 📊 성능 테스트

### 1. API 응답 시간

```bash
# 비디오 목록 조회 응답 시간 측정
time curl -X GET http://localhost:8080/api/v1/videos
```

**기대값**: 1초 이내 응답

### 2. 동시 접속 테스트

```bash
# Apache Bench를 사용한 부하 테스트 (있는 경우)
ab -n 100 -c 10 http://localhost:8080/api/v1/videos
```

## ✅ 성공 기준 체크리스트

### 필수 통과 항목

- [ ] `docker compose up -d --build` 실행 성공
- [ ] 백엔드 Swagger 문서 접근 가능 (http://localhost:8080/docs)
- [ ] 프론트엔드 페이지 로딩 성공 (http://localhost:3005)
- [ ] 회원가입 → 로그인 → `/users/me` API 200 응답
- [ ] 비디오 목록 조회 시 `video_url` 반환 확인
- [ ] 프론트엔드에서 YouTube 비디오 임베드 재생 확인
- [ ] 오답노트 생성 → 목록 조회 (필터링/페이지네이션) 정상 동작
- [ ] `/users/me/analytics` API 200 응답
- [ ] CORS 및 토큰 전파 문제 없음
- [ ] 브라우저/서버 콘솔 에러 0건

### 추가 검증 항목

- [ ] 비디오 URL 화이트리스트 검증 동작
- [ ] JWT 토큰 만료 시 자동 로그아웃
- [ ] 모바일 브라우저에서 UI 반응형 동작
- [ ] DB 마이그레이션 스크립트 정상 실행
- [ ] 환경변수 기반 설정 변경 가능

## 🔍 문제 해결

### 자주 발생하는 문제

1. **CORS 에러**
   - 백엔드 `ALLOWED_ORIGINS` 환경변수 확인
   - 프론트엔드 `VITE_API_BASE_URL` 확인

2. **토큰 전달 실패**
   - 브라우저 개발자 도구 → Network 탭에서 Authorization 헤더 확인
   - localStorage에 `access_token` 저장 여부 확인

3. **비디오 재생 안됨**
   - 비디오 URL이 화이트리스트에 포함되어 있는지 확인
   - YouTube URL이 올바른 형식인지 확인 (`youtu.be/ID` 또는 `youtube.com/watch?v=ID`)

4. **데이터베이스 연결 실패**
   - MariaDB 컨테이너 상태 확인
   - 데이터베이스 초기화 SQL 스크립트 확인

---

**테스트 완료 후**: 모든 체크리스트 항목이 ✅ 상태가 되면 배포 준비 완료