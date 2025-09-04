# app/routers/video.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models.video import Video
from app.models.quiz import Quiz

from pydantic import BaseModel, AnyUrl, conint
from app.routers.quiz import _quiz_with_options, _map_level
router = APIRouter(prefix="/videos", tags=["Video"])

# --- Schemas ---
class VideoCreate(BaseModel):
    video_url: AnyUrl | str
    difficulty: conint(ge=1, le=3)
    description: str

class VideoOut(BaseModel):
    video_id: str
    video_url: str
    difficulty: int
    description: str

@router.post("", response_model=VideoOut, status_code=201)
def create_video(payload: VideoCreate, db: Session = Depends(get_db)):
    v = Video(video_url=str(payload.video_url), difficulty=payload.difficulty, description=payload.description)
    db.add(v); db.commit(); db.refresh(v)
    return VideoOut.model_validate(v.__dict__)

@router.get("", response_model=List[VideoOut])
def list_videos(
    difficulty: Optional[int] = Query(None, ge=1, le=3),
    db: Session = Depends(get_db),
):
    stmt = select(Video)
    if difficulty is not None:
        stmt = stmt.where(Video.difficulty == difficulty)
    rows = db.execute(stmt).scalars().all()
    return [VideoOut.model_validate(r.__dict__) for r in rows]

@router.get("/{video_id}", response_model=VideoOut)
def get_video(video_id: str, db: Session = Depends(get_db)):
    v = db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "video not found")
    return VideoOut.model_validate(v.__dict__)

@router.get("/{video_id}/question")
def list_questions_by_video_compat(
    video_id: str,
    level: Optional[str] = Query(None, description="easy|medium|hard 또는 1|2|3 (선택)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    # 비디오 존재 확인
    v = db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "video not found")

    # (선택) level 파라미터가 오면 비디오 난이도와 일치 확인
    if level is not None and _map_level(level) != v.difficulty:
        # 레벨을 강제하고 싶지 않다면 이 블록을 제거하세요.
        raise HTTPException(400, "level and video's difficulty mismatch")

    qs = db.execute(
        select(Quiz).where(Quiz.video_id == video_id).limit(limit).offset(offset)
    ).scalars().all()

    return [_quiz_with_options(db, q.quiz_id) for q in qs]