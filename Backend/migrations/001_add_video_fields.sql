-- 비디오 테이블 필드 추가 마이그레이션
-- 실행일: 2025-09-04

-- 1. 제목 필드 추가
ALTER TABLE video 
ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT '제목 없음';

-- 2. 썸네일 URL 필드 추가  
ALTER TABLE video 
ADD COLUMN thumbnail_url VARCHAR(500) NULL;

-- 3. 동영상 길이 필드 추가
ALTER TABLE video 
ADD COLUMN duration_sec INT NULL;

-- 4. video_url 길이 확장 (기존 제약이 있다면)
ALTER TABLE video 
MODIFY COLUMN video_url VARCHAR(500) NOT NULL;

-- 5. 기본값 제거 (이후 신규 데이터는 반드시 제목 입력)
ALTER TABLE video 
ALTER COLUMN title DROP DEFAULT;

-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_video_difficulty ON video(difficulty);
CREATE INDEX idx_video_created_at ON video(created_at);
CREATE INDEX idx_video_title ON video(title);