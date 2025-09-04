# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User as UserModel
from app.core.security import decode_token  # ✅ 발급과 동일 소스 사용

bearer_scheme = HTTPBearer()

class CurrentUser:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        uid = (
            kwargs.get("user_id")
            or kwargs.get("id")
            or kwargs.get("uuid")
            or kwargs.get("user_uuid")
        )
        # 표준 키로 보강
        self.user_id   = kwargs.get("user_id", uid)
        self.id        = kwargs.get("id", uid)
        self.uuid      = kwargs.get("uuid", uid)
        self.user_uuid = kwargs.get("user_uuid", uid)
        self.email     = kwargs.get("email")

def _unauth():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

def _extract_user_identifiers(u: UserModel) -> dict:
    data = {}
    for key in ("user_id", "id", "uuid", "user_uuid", "email"):
        if hasattr(u, key):
            data[key] = getattr(u, key)
    # user_id 보강
    uid = data.get("user_id") or data.get("id") or data.get("uuid") or data.get("user_uuid")
    if uid and "user_id" not in data:
        data["user_id"] = uid
    return data

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    # 1) 토큰 디코드(발급과 동일 키/알고리즘 사용)
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise _unauth()

    sub = payload.get("sub")
    if not sub:
        raise _unauth()

    # 2) sub로 사용자 조회 (이메일/UUID/숫자 순으로 시도)
    stmt = None
    if isinstance(sub, str) and "@" in sub and hasattr(UserModel, "email"):
        stmt = select(UserModel).where(UserModel.email == sub)
    if stmt is None and isinstance(sub, str) and len(sub) == 36 and "-" in sub and hasattr(UserModel, "user_id"):
        stmt = select(UserModel).where(UserModel.user_id == sub)
    if stmt is None:
        try:
            sub_id = int(sub)
            if hasattr(UserModel, "id"):
                stmt = select(UserModel).where(UserModel.id == sub_id)
        except (TypeError, ValueError):
            pass
    if stmt is None and isinstance(sub, str) and hasattr(UserModel, "email"):
        stmt = select(UserModel).where(UserModel.email == sub)

    if stmt is None:
        raise _unauth()

    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise _unauth()

    return CurrentUser(**_extract_user_identifiers(user))
