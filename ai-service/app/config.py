import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / os.getenv("AI_MODEL_DIR", "models")
MIN_CONFIDENCE = float(os.getenv("AI_MIN_CONFIDENCE", "0.7"))
