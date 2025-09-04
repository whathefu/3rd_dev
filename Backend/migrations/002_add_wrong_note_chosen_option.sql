-- 오답노트 테이블에 선택한 답안 필드 추가
-- 실행일: 2025-09-04

-- 선택한 답안 필드 추가
ALTER TABLE wrong_note 
ADD COLUMN chosen_option VARCHAR(500) NULL COMMENT '사용자가 선택한 답안';

-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_wrong_note_user_created ON wrong_note(user_id, created_at DESC);
CREATE INDEX idx_wrong_note_user_quiz ON wrong_note(user_id, wrong_quiz_id);