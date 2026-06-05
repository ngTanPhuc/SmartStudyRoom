from fastapi import APIRouter

from .model import predict_system_label
from .schemas import SpeechInputRequest, SpeechInputResult

router = APIRouter()


@router.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@router.post("/predict", response_model=SpeechInputResult, tags=["Prediction"])
def predict(request: SpeechInputRequest):
    label, confidence = predict_system_label(request.rawtext)
    return SpeechInputResult(
        predictLabel=label,
        confidence=confidence,
    )
