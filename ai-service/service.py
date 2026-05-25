from fastapi import FastAPI
from pydantic import AliasChoices, BaseModel, Field
import joblib
import re
from pathlib import Path

from underthesea import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Vietnamese Smart Home Intent Classification API",
    description="API nhận diện ý định điều khiển thiết bị thông minh bằng tiếng Việt",
    version="1.0.0"
)


# =========================================================
# REQUEST / RESPONSE SCHEMA
# =========================================================

class SpeechInputRequest(BaseModel):
    rawtext: str = Field(validation_alias=AliasChoices("rawtext", "rawText"))


class SpeechInputResult(BaseModel):
    predictLabel: str
    confidence: float


# =========================================================
# TEXT PREPROCESSING
# =========================================================

def normalize_text(text: str) -> str:
    """
    Chuẩn hóa văn bản:
    - Chuyển thành chữ thường
    - Loại bỏ khoảng trắng dư thừa
    """
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_punctuation(text: str) -> str:
    """
    Loại bỏ ký tự đặc biệt nhưng vẫn giữ lại tiếng Việt.
    """
    return re.sub(r"[^\w\sà-ỹÀ-Ỹ]", "", text)


SLANG_DICTIONARY = {
    "ko": "không",
    "k": "không",
    "hok": "không",
    "vl": "rất",
    "giùm": "giúp",
    "dum": "giúp"
}


def normalize_slang(text: str) -> str:
    """
    Chuẩn hóa từ lóng / từ viết tắt.
    """
    words = text.split()
    normalized_words = [
        SLANG_DICTIONARY.get(word, word)
        for word in words
    ]
    return " ".join(normalized_words)


def preprocess_text(text: str) -> str:
    """
    Pipeline tiền xử lý văn bản hoàn chỉnh.
    """
    text = normalize_text(text)
    text = remove_punctuation(text)
    text = normalize_slang(text)

    tokens = word_tokenize(text)

    return " ".join(tokens)


# =========================================================
# LOAD TRAINED MODELS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

vectorizer: TfidfVectorizer = joblib.load(MODEL_DIR / "vectorizer.pkl")

selector = joblib.load(MODEL_DIR / "selector.pkl")

classification_model = joblib.load(MODEL_DIR / "model_v1.pkl")


# =========================================================
# LABEL MAPPING
# =========================================================

LABEL_MAPPING = {
    "bat_quat": "TURN_ON_FAN",
    "tat_quat": "TURN_OFF_FAN",
    "bat_den": "TURN_ON_LIGHT",
    "tat_den": "TURN_OFF_LIGHT"
}


# =========================================================
# PREDICTION LOGIC
# =========================================================

def predict_text(text: str):
    """
    Thực hiện dự đoán nhãn cho câu lệnh đầu vào.
    """

    # Tiền xử lý dữ liệu
    processed_text = preprocess_text(text)

    # Vector hóa dữ liệu bằng TF-IDF
    text_tfidf = vectorizer.transform([processed_text])

    # Chọn đặc trưng quan trọng
    selected_features = selector.transform(text_tfidf)

    # Dự đoán nhãn
    predicted_label = classification_model.predict(
        selected_features
    )[0]

    if hasattr(classification_model, "predict_proba"):
        confidence_score = classification_model.predict_proba(
            selected_features
        ).max()
    else:
        confidence_score = 1.0

    return predicted_label, float(confidence_score)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# =========================================================
# API ENDPOINT
# =========================================================

@app.post(
    "/predict",
    response_model=SpeechInputResult,
    tags=["Prediction"]
)
def predict(request: SpeechInputRequest):

    # Thực hiện dự đoán
    label, confidence = predict_text(request.rawtext)

    # Mapping nhãn nội bộ sang nhãn hệ thống
    label = LABEL_MAPPING.get(label, "UNKNOWN")

    # Ngưỡng độ tin cậy
    if confidence < 0.7:
        label = "UNKNOWN"

    return SpeechInputResult(
        predictLabel=label,
        confidence=confidence
    )
