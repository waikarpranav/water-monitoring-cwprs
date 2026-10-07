import joblib
import numpy as np
from pathlib import Path

_MODEL_PATH = Path(__file__).parent.parent / "ml" / "model.pkl"
_pipeline = joblib.load(_MODEL_PATH)

def predict_pollution(ph: float, turbidity_ntu: float, h2s_ppm: float) -> tuple[str, float]:
    """
    Returns (label, confidence) — label is 'Safe' or 'Not Safe'.
    NOTE: placeholder model, trained on only 3 proxy features (59% accuracy).
    Needs revisiting before final submission — see ml/train.py notes.
    """
    X = np.array([[ph, turbidity_ntu, h2s_ppm]])
    pred = _pipeline.predict(X)[0]
    proba = _pipeline.predict_proba(X)[0]

    label = "Safe" if pred == 1 else "Not Safe"
    confidence = float(proba[pred])
    return label, confidence