from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    # 과거 프론트와 하위호환: 옵션으로 전환
    phone: Optional[str] = None
    birth_date: Optional[date] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    accessToken: str

class UserOut(BaseModel):
    user_id: str
    email: EmailStr
    name: str
