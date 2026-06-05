import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

from .config import MIN_CONFIDENCE, MODEL_DIR
from .preprocessing import preprocess_text


LABEL_MAPPING = {
    "bat_quat": "TURN_ON_FAN",
    "tat_quat": "TURN_OFF_FAN",
    "bat_den": "TURN_ON_LIGHT",
    "tat_den": "TURN_OFF_LIGHT",
}


vectorizer: TfidfVectorizer = joblib.load(MODEL_DIR / "vectorizer.pkl")
selector = joblib.load(MODEL_DIR / "selector.pkl")
classification_model = joblib.load(MODEL_DIR / "model_v1.pkl")


def predict_text(text: str) -> tuple[str, float]:
    processed_text = preprocess_text(text)
    text_tfidf = vectorizer.transform([processed_text])
    selected_features = selector.transform(text_tfidf)
    predicted_label = classification_model.predict(selected_features)[0]

    if hasattr(classification_model, "predict_proba"):
        confidence_score = classification_model.predict_proba(selected_features).max()
    else:
        confidence_score = 1.0

    return predicted_label, float(confidence_score)


def predict_system_label(text: str) -> tuple[str, float]:
    label, confidence = predict_text(text)
    system_label = LABEL_MAPPING.get(label, "UNKNOWN")

    if confidence < MIN_CONFIDENCE:
        system_label = "UNKNOWN"

    return system_label, confidence
