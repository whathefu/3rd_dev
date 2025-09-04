# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user

from pydantic import BaseModel, EmailStr
from datetime import date

router = APIRouter(prefix="/users", tags=["User"])

# --- Schemas ---
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    birth_date: date

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    user_id: str
    email: EmailStr
    name: str


@router.post("/register", status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    # 기본값 보정 (DB 제약 대비)
    phone = payload.phone or "010-0000-0000"
    birth = payload.birth_date or date(2000, 1, 1)

    user = User(
        email=payload.email,
        name=payload.name,
        phone=phone,
        birth_date=birth,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.user_id, "email": user.email, "name": user.name}


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    ok = False
    try:
        ok = verify_password(payload.password, user.password_hash)
    except Exception:
        ok = False

    # 하위호환: 과거 평문 저장 케이스
    if not ok and user.password_hash == payload.password:
        ok = True
        user.password_hash = hash_password(payload.password)
        db.add(user)
        db.commit()
        db.refresh(user)

    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # ✅ sub은 반드시 users.user_id(UUID)
    token = create_access_token(sub=user.user_id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return {"user_id": user.user_id, "email": user.email, "name": user.name}


@router.post("/logout")
def logout(user=Depends(get_current_user)):
    return {"message": "success"}
