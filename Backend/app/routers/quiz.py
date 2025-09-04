# app/routers/quiz.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.core.deps import get_current_user
from app.models.quiz import Quiz, Option, History
from app.models.wrong_note import WrongNote

from pydantic import BaseModel, conint

from app.models.video import Video

router = APIRouter(prefix="/quizzes", tags=["Quiz"])

# --- Schemas ---
class OptionOut(BaseModel):
    option_id: str
    label: conint(ge=1, le=4)
    option_text: str
    explanation_text: str | None = None
    is_answer: conint(ge=0, le=1)

class QuizOut(BaseModel):
    quiz_id: str
    video_id: str
    question_text: str
    options: List[OptionOut]

class SubmitIn(BaseModel):
    quiz_id: str
    selected_label: conint(ge=1, le=4)
    # 세트 개념 유지 원하면 프론트에서 넘겨주세요
    quiz_set_no: int = 1
    time_spent_sec: int = 0

class SubmitOut(BaseModel):
    is_correct: bool
    correct_label: int

def _quiz_with_options(db: Session, quiz_id: str) -> QuizOut:
    q = db.get(Quiz, quiz_id)
    if not q:
        raise HTTPException(404, "quiz not found")
    opts = db.execute(select(Option).where(Option.quiz_id == quiz_id).order_by(Option.label.asc())).scalars().all()
    return QuizOut(
        quiz_id=q.quiz_id,
        video_id=q.video_id,
        question_text=q.question_text,
        options=[
            OptionOut(
                option_id=o.option_id,
                label=o.label,
                option_text=o.option_text,
                explanation_text=o.explanation_text,
                is_answer=o.is_answer,
            )
            for o in opts
        ],
    )

@router.get("/by-video/{video_id}", response_model=List[QuizOut])
def list_quizzes_by_video(
    video_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    qs = db.execute(
        select(Quiz).where(Quiz.video_id == video_id).limit(limit)
    ).scalars().all()
    return [_quiz_with_options(db, q.quiz_id) for q in qs]

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: str, db: Session = Depends(get_db)):
    return _quiz_with_options(db, quiz_id)

@router.post("/submit", response_model=SubmitOut)
def submit_answer(payload: SubmitIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # 정답 label 구하기
    correct_label = db.execute(
        select(Option.label).where(Option.quiz_id == payload.quiz_id, Option.is_answer == 1)
    ).scalar()
    if correct_label is None:
        raise HTTPException(500, "no correct option configured")

    is_correct = (payload.selected_label == correct_label)

    # history 적재
    h = History(
        user_id=user.id,
        quiz_set_no=payload.quiz_set_no,
        quiz_set_date=datetime.utcnow(),
        quiz_id=payload.quiz_id,
        is_correct=1 if is_correct else 0,
        time_spent_sec=max(0, payload.time_spent_sec),
    )
    db.add(h)

    # 오답일 경우 wrong_note 생성
    if not is_correct:
        db.add(WrongNote(user_id=user.id, wrong_quiz_id=payload.quiz_id))

    db.commit()
    return SubmitOut(is_correct=is_correct, correct_label=correct_label)


def _map_level(level: str | int) -> int:
    """
    정의서: Video.difficulty 1~3, (1=상, 2=중, 3=하)
    프론트: 'easy' | 'medium' | 'hard' 또는 1/2/3 로 들어올 수 있음
    """
    if isinstance(level, int):
        return level
    lv = str(level).lower()
    if lv in ("hard", "상"):   return 1
    if lv in ("medium", "중"): return 2
    if lv in ("easy", "하"):   return 3
    # 예외 입력은 기본 중(2)
    return 2

@router.get("/by-difficulty", response_model=List[QuizOut])
def list_quizzes_by_difficulty(
    level: str = Query(..., description="easy|medium|hard 또는 1|2|3"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    lv_num = _map_level(level)
    q = (
        select(Quiz)
        .join(Video, Video.video_id == Quiz.video_id)
        .where(Video.difficulty == lv_num)
        .limit(size)
        .offset((page - 1) * size)
    )
    quizzes = db.execute(q).scalars().all()
    return [_quiz_with_options(db, it.quiz_id) for it in quizzes]
