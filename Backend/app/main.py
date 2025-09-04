# app/main.py
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
from collections import deque
from datetime import datetime

from app.database import get_db, engine, Base
from app.core.error import ApiError, api_error_handler
from app.routers import user as user_router
from app.routers import quiz as quiz_router
from app.routers import health as health_router
from app.routers import wrong_note, analytics
from app.routers import video as video_router
# 필요 시 추론 라우터도:
# from app.routers import inference as inference_router

async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )

app = FastAPI(
    title="AI_GO Backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

origins = [
    "http://localhost:3005",
    "http://127.0.0.1:3005",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # 필요 시 사내/LAN IP 추가
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(FastAPIHTTPException, http_exception_handler)

@app.on_event("startup")
def on_startup():
    # 팀 DB를 받아 쓰므로, 테이블 자동 생성은 비활성
    # Base.metadata.create_all(bind=engine)
    pass

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# 간단 요청 로거
last_requests = deque(maxlen=100)

@app.middleware("http")
async def access_recorder(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    took_ms = int((time.time() - start) * 1000)

    path = request.url.path
    skip = {"/docs", "/openapi.json", "/redoc", "/health", "/health/db", "/favicon.ico"}
    if not any(path.startswith(s) for s in skip):
        entry = {
            "ts": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "client": getattr(request.client, "host", "?"),
            "method": request.method,
            "path": path,
            "status": response.status_code,
            "ms": took_ms,
            "ua": request.headers.get("user-agent", "")[:120],
            "from": request.headers.get("x-debug-from", None),
        }
        last_requests.appendleft(entry)
    return response

@app.get("/admin/debug/requests", tags=["Debug"])
def recent_requests():
    return list(last_requests)

# 라우터 등록
app.include_router(health_router.router, prefix="/api/v1")
app.include_router(user_router.router,   prefix="/api/v1")
app.include_router(quiz_router.router,   prefix="/api/v1")
app.include_router(wrong_note.router,    prefix="/api/v1")
app.include_router(analytics.router,     prefix="/api/v1")
app.include_router(video_router.router,  prefix="/api/v1")
# app.include_router(inference_router.router, prefix="/api/v1")  # 필요 시 활성화
