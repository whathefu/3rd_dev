from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/inference", tags=["Inference"])

@router.post("/")
async def run_inference(file: UploadFile = File(...)):
    # TODO: 모델 로딩 및 추론
    return {
        "result": "보행자 감지",
        "action": "감속 및 정지 권장",
        "risk_level": "high"
    }
