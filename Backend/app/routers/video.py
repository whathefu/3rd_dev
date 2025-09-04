# app/routers/video.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.video import Video
from app.models.quiz import Quiz
from app.core.deps import get_current_user

from pydantic import BaseModel, HttpUrl, conint, validator
import os

router = APIRouter(prefix="/videos", tags=["Video"])

# --- Schemas ---
class VideoCreate(BaseModel):
    title: str
    video_url: HttpUrl
    difficulty: conint(ge=1, le=3)
    description: str
    thumbnail_url: HttpUrl | None = None
    duration_sec: int | None = None
    
    @validator('video_url')
    def validate_video_url(cls, v):
        allowed_hosts = os.getenv('VIDEO_URL_WHITELIST', 'youtube.com,youtu.be,vimeo.com,drive.google.com,s3.amazonaws.com,cloudfront.net').split(',')
        url_str = str(v).lower()
        if not any(host.strip() in url_str for host in allowed_hosts):
            raise ValueError(f'Video URL must be from allowed hosts: {", ".join(allowed_hosts)}')
        return v

class VideoOut(BaseModel):
    video_id: str
    title: str
    video_url: str
    difficulty: int
    description: str
    thumbnail_url: str | None = None
    duration_sec: int | None = None
    created_at: str

class VideoListOut(BaseModel):
    videos: List[VideoOut]
    total: int

# --- API Endpoints ---

@router.post("", response_model=VideoOut, status_code=201)
def create_video(
    payload: VideoCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # 관리자 권한 확인용
):
    """
    비디오 메타데이터 등록 (외부 URL 링크 방식)
    - 파일 업로드가 아닌 YouTube/Vimeo/Drive/S3 등의 외부 URL 링크 등록
    - 관리자 권한 필요 (현재는 로그인 사용자 모두 허용)
    """
    v = Video(
        title=payload.title,
        video_url=str(payload.video_url), 
        difficulty=payload.difficulty, 
        description=payload.description,
        thumbnail_url=str(payload.thumbnail_url) if payload.thumbnail_url else None,
        duration_sec=payload.duration_sec
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    
    return VideoOut(
        video_id=v.video_id,
        title=v.title,
        video_url=v.video_url,
        difficulty=v.difficulty,
        description=v.description,
        thumbnail_url=v.thumbnail_url,
        duration_sec=v.duration_sec,
        created_at=v.created_at.isoformat()
    )

@router.get("", response_model=List[VideoOut])
def list_videos(
    level: Optional[int] = Query(None, ge=1, le=3, description="난이도 필터 (1=상, 2=중, 3=하)"),
    active: Optional[bool] = Query(None, description="활성 상태 필터 (미사용)"),
    offset: int = Query(0, ge=0, description="페이지네이션 오프셋"),
    limit: int = Query(20, ge=1, le=100, description="최대 결과 수"),
    db: Session = Depends(get_db),
):
    """
    비디오 목록 조회 (외부 URL 링크 방식)
    - level: 난이도 필터 (1=상, 2=중, 3=하)
    - active: 향후 확장용 (현재 무시)
    - offset/limit: 페이지네이션
    """
    stmt = select(Video)
    if level is not None:
        stmt = stmt.where(Video.difficulty == level)
    
    stmt = stmt.offset(offset).limit(limit).order_by(Video.created_at.desc())
    rows = db.execute(stmt).scalars().all()
    
    return [
        VideoOut(
            video_id=r.video_id,
            title=r.title,
            video_url=r.video_url,
            difficulty=r.difficulty,
            description=r.description,
            thumbnail_url=r.thumbnail_url,
            duration_sec=r.duration_sec,
            created_at=r.created_at.isoformat()
        ) for r in rows
    ]

@router.get("/{video_id}", response_model=VideoOut)
def get_video(video_id: str, db: Session = Depends(get_db)):
    """
    특정 비디오 상세 조회
    """
    v = db.get(Video, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return VideoOut(
        video_id=v.video_id,
        title=v.title,
        video_url=v.video_url,
        difficulty=v.difficulty,
        description=v.description,
        thumbnail_url=v.thumbnail_url,
        duration_sec=v.duration_sec,
        created_at=v.created_at.isoformat()
    )

# 기존 업로드 엔드포인트들을 410 Gone으로 처리
@router.post("/upload", status_code=410)
def upload_video_deprecated():
    """
    **DEPRECATED**: 비디오 파일 업로드는 더 이상 지원하지 않습니다.
    대신 외부 URL 링크를 사용하여 POST /api/v1/videos 엔드포인트를 이용하세요.
    """
    raise HTTPException(
        status_code=410,
        detail="비디오 파일 업로드는 더 이상 지원되지 않습니다. 외부 URL 링크를 사용하세요."
    )

@router.post("/file")
def upload_file_deprecated():
    """
    **DEPRECATED**: 파일 업로드는 더 이상 지원하지 않습니다.
    """
    raise HTTPException(
        status_code=410,
        detail="파일 업로드는 더 이상 지원되지 않습니다. 외부 URL 링크를 사용하세요."
    )

# 퀴즈 연동 엔드포인트 (기존 로직 유지)
@router.get("/{video_id}/questions")
def list_questions_by_video(
    video_id: str,
    level: Optional[str] = Query(None, description="easy|medium|hard 또는 1|2|3 (선택)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    특정 비디오의 퀴즈 문제 목록 조회
    """
    # 비디오 존재 확인
    v = db.get(Video, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")

    # 퀴즈 조회
    stmt = select(Quiz).where(Quiz.video_id == video_id).offset(offset).limit(limit)
    qs = db.execute(stmt).scalars().all()
    
    # 퀴즈 옵션과 함께 반환 (quiz.py의 함수 사용)
    try:
        from app.routers.quiz import _quiz_with_options
        return [_quiz_with_options(db, q.quiz_id) for q in qs]
    except ImportError:
        # 간단한 퀴즈 정보만 반환
        return [{"quiz_id": q.quiz_id, "question": q.question, "video_id": q.video_id} for q in qs]