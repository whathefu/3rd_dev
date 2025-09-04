# app/routers/analytics.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List

from app.database import get_db
from app.core.deps import get_current_user   # ← deps 경로로 통일
from app.models.quiz import History, Quiz
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _pct(n: int, d: int) -> int:
    return int(round(100 * (n / d), 0)) if d > 0 else 0


class SummaryOut(BaseModel):
    totalSolved: int
    accuracyPct: int
    wrongPct: int
    lastActiveAt: datetime | None


@router.get("/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    사용자별 풀이 요약 (총 풀이 수 / 정답률 / 오답률 / 마지막 활동 일시)
    FK 컬럼: History.user_id  ← users.user_id 참조
    """
    # 반드시 user.user_id 사용 (History FK와 일치)
    if not hasattr(user, "user_id") or not getattr(user, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 사용자 식별자(user_id)를 확인할 수 없습니다."
        )

    rows = db.execute(
        select(History.is_correct, History.quiz_set_date)
        .where(History.user_id == user.user_id)
    ).all()

    total = len(rows)
    correct = sum(1 for r in rows if r.is_correct == 1)
    wrong = total - correct
    last_active = max((r.quiz_set_date for r in rows), default=None)

    return SummaryOut(
        totalSolved=total,
        accuracyPct=_pct(correct, total),
        wrongPct=_pct(wrong, total),
        lastActiveAt=last_active
    )


class WeeklyItem(BaseModel):
    day: str
    solved: int


class WeeklyOut(BaseModel):
    days: List[WeeklyItem]


@router.get("/weekly", response_model=WeeklyOut)
def weekly(
    days: int = Query(7, ge=1, le=31),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    최근 N일 간(기본 7일) 일별 풀이 수 집계
    """
    if not hasattr(user, "user_id") or not getattr(user, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 사용자 식별자(user_id)를 확인할 수 없습니다."
        )

    since = datetime.utcnow() - timedelta(days=days - 1)
    rows = db.execute(
        select(History.quiz_set_date)
        .where(History.user_id == user.user_id, History.quiz_set_date >= since)
    ).scalars().all()

    # 최근 N일 날짜 키(월~일 약어) 미리 구성
    by_day = defaultdict(int)
    day_keys = []
    today = datetime.utcnow().date()
    for i in range(days)[::-1]:
        d = today - timedelta(days=i)
        key = d.strftime("%a")
        day_keys.append(key)
        by_day[key] = 0

    # 실제 데이터 카운팅
    for dt in rows:
        by_day[dt.strftime("%a")] += 1

    return WeeklyOut(days=[WeeklyItem(day=k, solved=by_day[k]) for k in day_keys])


class CategoryStat(BaseModel):
    name: str
    quizCount: int
    accuracyPct: int


class CategoriesOut(BaseModel):
    categories: List[CategoryStat]


@router.get("/categories", response_model=CategoriesOut)
def categories(
    top_k: int = Query(8, ge=1, le=50),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    카테고리(서브)별 풀이 수/정답률 Top-K
    - Quiz.category_sub_name_1 기준
    """
    if not hasattr(user, "user_id") or not getattr(user, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 사용자 식별자(user_id)를 확인할 수 없습니다."
        )

    rows = db.execute(
        select(Quiz.category_sub_name_1, History.is_correct)
        .join(Quiz, Quiz.quiz_id == History.quiz_id)
        .where(History.user_id == user.user_id)
    ).all()

    agg = defaultdict(lambda: {"t": 0, "c": 0})
    for sub, ok in rows:
        name = sub or "기타"
        agg[name]["t"] += 1
        if ok == 1:
            agg[name]["c"] += 1

    ordered = sorted(agg.items(), key=lambda kv: kv[1]["t"], reverse=True)[:top_k]
    out = [
        CategoryStat(name=k, quizCount=v["t"], accuracyPct=_pct(v["c"], v["t"]))
        for k, v in ordered
    ]
    return CategoriesOut(categories=out)
