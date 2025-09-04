-- 비디오 테이블 필드 추가 롤백
-- 사용법: 마이그레이션을 되돌리고 싶을 때 실행

-- 인덱스 제거
DROP INDEX IF EXISTS idx_video_title;
DROP INDEX IF EXISTS idx_video_created_at;  
DROP INDEX IF EXISTS idx_video_difficulty;

-- 추가된 컬럼 제거
ALTER TABLE video DROP COLUMN IF EXISTS duration_sec;
ALTER TABLE video DROP COLUMN IF EXISTS thumbnail_url;
ALTER TABLE video DROP COLUMN IF EXISTS title;

-- video_url 길이 원복 (필요한 경우)
-- ALTER TABLE video MODIFY COLUMN video_url VARCHAR(255) NOT NULL;