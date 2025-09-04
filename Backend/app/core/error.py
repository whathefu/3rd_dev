from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

class ApiError(Exception):
    def __init__(self, code: str, message: str, status: int = 400, detail=None):
        self.code, self.message, self.status, self.detail = code, message, status, detail

async def api_error_handler(_: Request, exc: ApiError):
    return JSONResponse(status_code=exc.status,
                        content={"code": exc.code, "message": exc.message, "detail": exc.detail})

async def http_exception_handler(_: Request, exc: HTTPException):
    # FastAPI 기본 HTTPException도 공통 포맷으로 변환
    msg = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    return JSONResponse(status_code=exc.status_code,
                        content={"code": "HTTP_ERROR", "message": msg, "detail": None})