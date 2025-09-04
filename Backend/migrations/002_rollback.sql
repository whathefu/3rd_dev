-- 오답노트 선택한 답안 필드 롤백
-- 사용법: 마이그레이션을 되돌리고 싶을 때 실행

-- 인덱스 제거
DROP INDEX IF EXISTS idx_wrong_note_user_quiz;
DROP INDEX IF EXISTS idx_wrong_note_user_created;

-- 추가된 컬럼 제거
ALTER TABLE wrong_note DROP COLUMN IF EXISTS chosen_option;