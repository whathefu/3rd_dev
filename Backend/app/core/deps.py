# app/core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models.user import User as UserModel
from app.core.security import decode_token
import logging

logger = logging.getLogger("auth")

bearer_scheme = HTTPBearer()

def _unauth(detail="인증 정보가 유효하지 않습니다."):
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )

def _fetch_user_by_sub(db: Session, sub: str):
    # 1) UUID(user_id) 우선
    if isinstance(sub, str) and len(sub) == 36 and "-" in sub and hasattr(UserModel, "user_id"):
        u = db.execute(select(UserModel).where(UserModel.user_id == sub)).scalar_one_or_none()
        if u:
            return u
        # ORM 방식도 한번 더 시도(드물게 드라이버/버전 차이로 select 결과가 안 나오는 경우 대비)
        u = db.query(UserModel).filter(UserModel.user_id == sub).first()
        if u:
            return u

    # 2) 이메일
    if isinstance(sub, str) and "@" in sub and hasattr(UserModel, "email"):
        u = db.execute(select(UserModel).where(UserModel.email == sub)).scalar_one_or_none()
        if u:
            return u
        u = db.query(UserModel).filter(UserModel.email == sub).first()
        if u:
            return u

    # 3) 숫자 id
    try:
        sid = int(sub)
        if hasattr(UserModel, "id"):
            u = db.execute(select(UserModel).where(UserModel.id == sid)).scalar_one_or_none()
            if u:
                return u
            u = db.query(UserModel).filter(UserModel.id == sid).first()
            if u:
                return u
    except (TypeError, ValueError):
        pass

    # 4) 마지막으로 문자열로 email 한 번 더
    if isinstance(sub, str) and hasattr(UserModel, "email"):
        u = db.query(UserModel).filter(UserModel.email == sub).first()
        if u:
            return u

    return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserModel:
    try:
        payload = decode_token(credentials.credentials)
        logger.info("JWT payload decoded successfully: sub=%s", payload.get("sub"))
    except Exception as e:
        logger.error("JWT decode fail: %s", e)
        raise _unauth("토큰이 유효하지 않습니다.")

    sub = payload.get("sub")
    if not sub:
        logger.error("JWT payload without sub: %s", payload)
        raise _unauth("토큰에 사용자 정보가 없습니다.")

    user = _fetch_user_by_sub(db, sub)
    if not user:
        logger.error("User not found by sub=%r", sub)
        raise _unauth("사용자를 찾을 수 없습니다.")

    # user.user_id가 비어있지 않도록 보강
    if not getattr(user, "user_id", None):
        uid = getattr(user, "id", None) or getattr(user, "uuid", None)
        if uid:
            setattr(user, "user_id", uid)
        else:
            logger.error("User has no user_id field: %s", user)
            raise _unauth("사용자 ID 정보가 없습니다.")

    logger.info("User authenticated successfully: user_id=%s", user.user_id)
    return user
