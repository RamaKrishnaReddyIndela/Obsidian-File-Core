# obsidiancore-backend/ml/utils.py
import json
import os
from typing import Dict, Any, List

# Fallback keyword lists if no ML model is bundled yet
SENSITIVE_KEYWORDS = {
    "pii": [
        "ssn", "passport", "aadhaar", "pan card", "credit card", "debit card",
        "dob", "date of birth", "mother's maiden name", "bank account",
        "ifsc", "upi", "address", "phone number", "email"
    ],
    "confidential": [
        "proprietary", "nda", "confidential", "secret", "internal only",
        "do not distribute", "restricted"
    ],
    "health": [
        "diagnosis", "prescription", "medical record", "hipaa", "patient id",
        "lab result", "blood group", "allergy"
    ],
    "financial": [
        "invoice", "salary", "payslip", "statement", "gst", "balance sheet",
        "revenue", "profit", "loss", "loan", "emi"
    ],
}

DEFAULT_LABELS = ["public", "internal", "confidential", "pii", "financial", "health"]

def softmax(xs: List[float]) -> List[float]:
    import math
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]

def keyword_scores(text: str) -> Dict[str, float]:
    t = (text or "").lower()
    scores = {k: 0.0 for k in SENSITIVE_KEYWORDS.keys()}
    for label, kws in SENSITIVE_KEYWORDS.items():
        for kw in kws:
            if kw in t:
                scores[label] += 1.0
    return scores

def rule_based_predict(text: str) -> Dict[str, Any]:
    scores = keyword_scores(text)
    # map to labels
    features = [
        0.2,  # public base
        0.4,  # internal base
        0.5 if (scores["confidential"] > 0) else 0.0,
        float(scores["pii"]),
        float(scores["financial"]),
        float(scores["health"]),
    ]
    probs = softmax(features)
    result = {label: prob for label, prob in zip(DEFAULT_LABELS, probs)}
    label = max(result, key=result.get)
    flags = [k for k, v in scores.items() if v > 0]
    return {
        "label": label,
        "probabilities": result,
        "flags": flags,
    }

def safe_json_input() -> Dict[str, Any]:
    try:
        raw = input()
        return json.loads(raw or "{}")
    except Exception:
        return {}

def emit_json(obj: Dict[str, Any]):
    print(json.dumps(obj, ensure_ascii=False))
