# app/routers/health.py  (새 파일)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db


router = APIRouter(tags=["Health"])

@router.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    # 단순 핑 + 버전/시간 조회
    ver = db.execute(text("SELECT VERSION()")).scalar()
    now = db.execute(text("SELECT NOW()")).scalar()
    # 선택: 있는 테이블 하나 카운트(없으면 주석 처리)
    # users_cnt = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    return {"db": "ok", "version": ver, "now": str(now)}
