# 로컬 개발 환경 실행 가이드

Docker가 없는 환경에서 AI-GO를 실행하는 방법입니다.

## 📋 필수 요구사항

- Python 3.11+
- Node.js 18+
- MariaDB 또는 MySQL 서버

## 🗄️ 데이터베이스 설정

### 1. MariaDB 설치 및 설정

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

**macOS (Homebrew):**
```bash
brew install mariadb
brew services start mariadb
```

**Windows:**
MariaDB 공식 사이트에서 설치: https://mariadb.org/download/

### 2. 데이터베이스 생성

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ai_go CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_pass';
GRANT ALL PRIVILEGES ON ai_go.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 초기 데이터 로드 (옵션)

```bash
cd /home/user/webapp/Backend
mysql -u app_user -p ai_go < db_demofile/Database_ai_go.sql
```

## 🚀 백엔드 실행

### 1. 가상환경 생성 및 활성화

```bash
cd /home/user/webapp/Backend
python3 -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
# venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 환경변수 설정

`.env` 파일을 생성하거나 수정:

```env
SECRET_KEY=ai-go-secret-key-2025
DATABASE_URL=mysql+pymysql://app_user:app_pass@localhost:3306/ai_go?charset=utf8mb4
ALLOWED_ORIGINS=http://localhost:3005,http://127.0.0.1:3005
VIDEO_URL_WHITELIST=youtube.com,youtu.be,vimeo.com,drive.google.com
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. 데이터베이스 마이그레이션

```bash
# 테이블이 없는 경우 SQLAlchemy로 자동 생성됨
# 또는 수동으로 마이그레이션 실행:
mysql -u app_user -p ai_go < migrations/001_add_video_fields.sql
mysql -u app_user -p ai_go < migrations/002_add_wrong_note_chosen_option.sql
```

### 5. 백엔드 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

**확인:** http://localhost:8080/docs 에서 API 문서 접근 가능

## 🌐 프론트엔드 실행

### 1. 새 터미널에서 프론트엔드 디렉토리로 이동

```bash
cd /home/user/webapp/Frontend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 확인

`.env` 파일이 올바르게 설정되어 있는지 확인:

```env
VITE_API_BASE_URL=http://localhost:8080
NODE_ENV=development
VITE_NODE_ENV=development
VITE_DEBUG=true
```

### 4. 프론트엔드 개발 서버 실행

```bash
npm run dev
```

**확인:** http://localhost:3005 에서 AI-GO 웹사이트 접근 가능

## 🧪 동작 확인

### 1. API 헬스체크

```bash
curl http://localhost:8080/health
# 예상 응답: {"status":"ok"}

curl http://localhost:8080/health/db
# 예상 응답: {"status":"ok","database":"connected"}
```

### 2. 프론트엔드 접속

브라우저에서 http://localhost:3005 접속하여:
- 회원가입 페이지 확인
- 로그인 기능 테스트
- 대시보드 표시 확인

## 🔧 문제 해결

### 백엔드 에러

1. **DB 연결 실패**
   - MariaDB 서비스 상태 확인: `sudo systemctl status mariadb`
   - DB 권한 재설정
   - `.env` 파일의 `DATABASE_URL` 확인

2. **모듈 없음 에러**
   - 가상환경 활성화 확인
   - `pip install -r requirements.txt` 재실행

3. **포트 충돌**
   - 8080 포트 사용 중인 프로세스 확인: `lsof -i :8080`
   - 다른 포트 사용: `uvicorn app.main:app --port 8081`

### 프론트엔드 에러

1. **API 연결 실패**
   - 백엔드 서버 실행 상태 확인
   - `.env` 파일의 `VITE_API_BASE_URL` 확인
   - CORS 에러: 백엔드 `ALLOWED_ORIGINS` 설정 확인

2. **npm 모듈 에러**
   - `npm cache clean --force`
   - `rm -rf node_modules package-lock.json`
   - `npm install`

## 🎯 성공 기준

모든 것이 정상적으로 실행되면:

- ✅ 백엔드: http://localhost:8080/docs (API 문서)
- ✅ 프론트엔드: http://localhost:3005 (웹사이트)
- ✅ 회원가입/로그인 정상 동작
- ✅ 비디오 목록 조회 가능
- ✅ 브라우저 콘솔에 에러 없음

---

**문제가 지속되면 각 단계별로 로그를 확인하고 에러 메시지를 공유해주세요!**