# app/routers/wrong_note.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.core.deps import get_current_user
from app.models.wrong_note import WrongNote
from app.models.quiz import Quiz
from app.models.video import Video

from pydantic import BaseModel

router = APIRouter(prefix="/wrong-notes", tags=["Wrong Notes"])

# --- Schemas ---
class WrongNoteCreate(BaseModel):
    question_id: str  # quiz_id
    chosen_option: str  # 사용자가 선택한 답안

class WrongNoteDetail(BaseModel):
    wrong_note_id: str
    user_id: str
    quiz_id: str
    question: str
    chosen_option: str
    correct_answer: str
    video_title: str | None = None
    difficulty: int | None = None
    created_at: str

class WrongNoteOut(BaseModel):
    wrong_note_id: str
    user_id: str
    wrong_quiz_id: str
    chosen_option: str | None = None
    created_at: str

class WrongNoteStats(BaseModel):
    total_wrong: int
    by_difficulty: dict
    recent_count: int

# --- API Endpoints ---

@router.post("", response_model=WrongNoteOut, status_code=201)
def create_wrong_note(
    payload: WrongNoteCreate,
    db: Session = Depends(get_db), 
    user = Depends(get_current_user)
):
    """
    오답 노트 생성 - 퀴즈 답안이 틀렸을 때 호출
    """
    user_id = user.user_id
    
    # 퀴즈 존재 확인
    quiz = db.get(Quiz, payload.question_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # 중복 오답 체크 (같은 사용자, 같은 퀴즈)
    existing = db.execute(
        select(WrongNote).where(
            and_(
                WrongNote.user_id == user_id,
                WrongNote.wrong_quiz_id == payload.question_id
            )
        )
    ).scalar_one_or_none()
    
    if existing:
        # 기존 오답이 있으면 선택한 답안만 업데이트
        existing.chosen_option = payload.chosen_option
        existing.created_at = func.now()
        db.commit()
        db.refresh(existing)
        return WrongNoteOut(
            wrong_note_id=existing.wrong_note_id,
            user_id=existing.user_id,
            wrong_quiz_id=existing.wrong_quiz_id,
            chosen_option=existing.chosen_option,
            created_at=existing.created_at.isoformat()
        )
    
    # 새 오답 생성
    w = WrongNote(
        user_id=user_id, 
        wrong_quiz_id=payload.question_id,
        chosen_option=payload.chosen_option
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    
    return WrongNoteOut(
        wrong_note_id=w.wrong_note_id,
        user_id=w.user_id,
        wrong_quiz_id=w.wrong_quiz_id,
        chosen_option=w.chosen_option,
        created_at=w.created_at.isoformat()
    )

@router.get("", response_model=List[WrongNoteDetail])
def list_wrong_notes(
    offset: int = Query(0, ge=0, description="페이지네이션 오프셋"),
    limit: int = Query(20, ge=1, le=100, description="최대 결과 수"),
    level: Optional[int] = Query(None, ge=1, le=3, description="난이도 필터 (1=상, 2=중, 3=하)"),
    db: Session = Depends(get_db), 
    user = Depends(get_current_user)
):
    """
    사용자의 오답노트 목록 조회 (상세 정보 포함)
    - 퀴즈 문제, 선택한 답안, 정답, 비디오 제목 등 포함
    - level: 난이도 필터
    - offset/limit: 페이지네이션
    """
    user_id = user.user_id
    
    # JOIN 쿼리로 모든 정보 한번에 가져오기
    stmt = (
        select(WrongNote, Quiz, Video)
        .join(Quiz, WrongNote.wrong_quiz_id == Quiz.quiz_id)
        .join(Video, Quiz.video_id == Video.video_id, isouter=True)  # LEFT JOIN
        .where(WrongNote.user_id == user_id)
    )
    
    if level is not None:
        stmt = stmt.where(Video.difficulty == level)
    
    stmt = stmt.offset(offset).limit(limit).order_by(WrongNote.created_at.desc())
    
    results = db.execute(stmt).all()
    
    return [
        WrongNoteDetail(
            wrong_note_id=wn.wrong_note_id,
            user_id=wn.user_id,
            quiz_id=wn.wrong_quiz_id,
            question=quiz.question,
            chosen_option=wn.chosen_option or "미기록",
            correct_answer=quiz.correct_answer,
            video_title=video.title if video else None,
            difficulty=video.difficulty if video else None,
            created_at=wn.created_at.isoformat()
        )
        for wn, quiz, video in results
    ]

@router.get("/stats", response_model=WrongNoteStats)
def get_wrong_note_stats(
    days: int = Query(30, ge=1, le=365, description="최근 N일간의 통계"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    사용자의 오답노트 통계
    - 총 오답 수
    - 난이도별 오답 분포
    - 최근 N일간 오답 수
    """
    user_id = user.user_id
    
    # 총 오답 수
    total_stmt = select(func.count(WrongNote.wrong_note_id)).where(WrongNote.user_id == user_id)
    total_wrong = db.execute(total_stmt).scalar() or 0
    
    # 난이도별 오답 수 (비디오 테이블과 JOIN)
    difficulty_stmt = (
        select(Video.difficulty, func.count(WrongNote.wrong_note_id))
        .join(Quiz, WrongNote.wrong_quiz_id == Quiz.quiz_id)
        .join(Video, Quiz.video_id == Video.video_id)
        .where(WrongNote.user_id == user_id)
        .group_by(Video.difficulty)
    )
    
    difficulty_results = db.execute(difficulty_stmt).all()
    by_difficulty = {
        "level_1": 0,  # 상
        "level_2": 0,  # 중  
        "level_3": 0   # 하
    }
    
    for diff, count in difficulty_results:
        by_difficulty[f"level_{diff}"] = count
    
    # 최근 N일간 오답 수
    recent_stmt = (
        select(func.count(WrongNote.wrong_note_id))
        .where(
            and_(
                WrongNote.user_id == user_id,
                WrongNote.created_at >= func.date_sub(func.now(), func.interval(days, "day"))
            )
        )
    )
    recent_count = db.execute(recent_stmt).scalar() or 0
    
    return WrongNoteStats(
        total_wrong=total_wrong,
        by_difficulty=by_difficulty,
        recent_count=recent_count
    )

@router.get("/{wrong_note_id}", response_model=WrongNoteDetail)
def get_wrong_note(
    wrong_note_id: str, 
    db: Session = Depends(get_db), 
    user = Depends(get_current_user)
):
    """
    특정 오답노트 상세 조회
    """
    user_id = user.user_id
    
    # JOIN 쿼리로 상세 정보 가져오기
    stmt = (
        select(WrongNote, Quiz, Video)
        .join(Quiz, WrongNote.wrong_quiz_id == Quiz.quiz_id)
        .join(Video, Quiz.video_id == Video.video_id, isouter=True)
        .where(
            and_(
                WrongNote.wrong_note_id == wrong_note_id,
                WrongNote.user_id == user_id
            )
        )
    )
    
    result = db.execute(stmt).first()
    if not result:
        raise HTTPException(status_code=404, detail="Wrong note not found")
    
    wn, quiz, video = result
    
    return WrongNoteDetail(
        wrong_note_id=wn.wrong_note_id,
        user_id=wn.user_id,
        quiz_id=wn.wrong_quiz_id,
        question=quiz.question,
        chosen_option=wn.chosen_option or "미기록",
        correct_answer=quiz.correct_answer,
        video_title=video.title if video else None,
        difficulty=video.difficulty if video else None,
        created_at=wn.created_at.isoformat()
    )

@router.delete("/{wrong_note_id}")
def delete_wrong_note(
    wrong_note_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    오답노트 삭제
    """
    user_id = user.user_id
    
    w = db.get(WrongNote, wrong_note_id)
    if not w or w.user_id != user_id:
        raise HTTPException(status_code=404, detail="Wrong note not found")
    
    db.delete(w)
    db.commit()
    
    return {"message": "Wrong note deleted successfully"}
