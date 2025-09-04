# app/core/security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# ✅ 키/알고리즘 환경변수 호환
JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "change-me"
JWT_ALG    = os.getenv("ALGORITHM") or os.getenv("JWT_ALG") or "HS256"
ACCESS_TOKEN_EXPIRE_MIN = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MIN") or os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES") or "60"
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str) -> str:
    return pwd.hash(pw)

def verify_password(pw: str, pw_hash: str) -> bool:
    return pwd.verify(pw, pw_hash)

def create_access_token(sub: str) -> str:
    """
    sub에는 users.user_id(문자열 UUID)를 넣는 것을 권장합니다.
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MIN)
    payload = {
        "sub": sub,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": "access",  # 기존 필드명 유지
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict:
    # 시계 오차 허용 60초
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG], options={"verify_exp": True}, leeway=60)
