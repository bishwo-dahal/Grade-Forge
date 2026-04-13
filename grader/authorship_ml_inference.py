"""
Load university-trained authorship triage model (joblib from train_authorship.py) and apply a small
bounded adjustment to the heuristic risk score. Disabled when GRADER_AUTHORSHIP_MODEL_PATH is unset,
the file is missing, or GRADER_AUTHORSHIP_ML_ENABLED is false.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple

_bundle: Optional[Dict[str, Any]] = None
_bundle_path_loaded: Optional[str] = None
_load_error: Optional[str] = None

_session_stats = {"adjusted": 0, "skipped_no_model": 0}


def reset_session_stats() -> None:
    global _session_stats
    _session_stats = {"adjusted": 0, "skipped_no_model": 0}


def session_stats() -> Dict[str, int]:
    return dict(_session_stats)


def _enabled() -> bool:
    v = (os.environ.get("GRADER_AUTHORSHIP_ML_ENABLED", "true") or "").strip().lower()
    return v not in ("0", "false", "no", "off")


def _weight() -> float:
    try:
        return max(0.0, float(os.environ.get("GRADER_AUTHORSHIP_ML_WEIGHT", "0.12")))
    except ValueError:
        return 0.12


def _get_bundle() -> Optional[Dict[str, Any]]:
    global _bundle, _bundle_path_loaded, _load_error
    path = (os.environ.get("GRADER_AUTHORSHIP_MODEL_PATH") or "").strip()
    if not path:
        _bundle = None
        _bundle_path_loaded = None
        _load_error = None
        return None
    if _bundle is not None and _bundle_path_loaded == path:
        return _bundle
    _bundle = None
    _bundle_path_loaded = path
    _load_error = None
    try:
        import joblib

        raw = joblib.load(path)
    except Exception as e:
        _load_error = str(e)[:300]
        _bundle = None
        return None
    if not isinstance(raw, dict) or raw.get("model") is None:
        _load_error = "bundle missing 'model'"
        _bundle = None
        return None
    _bundle = raw
    return _bundle


def bundle_debug() -> Dict[str, Any]:
    """Assignment-level diagnostics for JSON model_info."""
    path = (os.environ.get("GRADER_AUTHORSHIP_MODEL_PATH") or "").strip()
    b = _get_bundle() if path else None
    return {
        "enabled": _enabled(),
        "path_set": bool(path),
        "loaded": b is not None,
        "weight": _weight(),
        "load_error": _load_error,
        "feature_count": len(b.get("feature_names") or []) if b else 0,
    }


def trained_authorship_contribution(
    risk_clamped: float,
    similarity: float,
    m: Any,
    llm: Dict[str, Any],
) -> Tuple[float, Optional[Dict[str, object]]]:
    """
    risk_clamped: heuristic composite risk in [0,1] before this adjustment (matches training export).
    """
    global _session_stats
    if not _enabled():
        return 0.0, None
    w = _weight()
    if w <= 0:
        return 0.0, None
    bundle = _get_bundle()
    if bundle is None:
        p = (os.environ.get("GRADER_AUTHORSHIP_MODEL_PATH") or "").strip()
        if p:
            _session_stats["skipped_no_model"] += 1
        return 0.0, None

    model = bundle["model"]
    names: List[str] = list(bundle.get("feature_names") or [])
    label_names: List[str] = list(bundle.get("label_names") or ["AI_ASSISTED", "HUMAN_WRITTEN", "UNCLEAR"])
    if not names:
        return 0.0, None

    try:
        llm_like = float(llm.get("ai_likeness", 0.0) or 0.0)
    except (TypeError, ValueError):
        llm_like = 0.0
    try:
        llm_unc = float(llm.get("uncertainty", 0.5) or 0.5)
    except (TypeError, ValueError):
        llm_unc = 0.5

    feat_map: Dict[str, float] = {
        "similarity_score": float(similarity),
        "risk_score": float(risk_clamped),
        "code_lines": float(m.code_lines),
        "comment_ratio": float(m.comment_ratio),
        "long_identifier_ratio": float(m.long_identifier_ratio),
        "marker_hits": float(m.marker_hits),
        "avg_line_length": float(m.avg_line_len),
        "line_length_std": float(m.line_len_std),
        "llm_ai_likeness": llm_like,
        "llm_uncertainty": llm_unc,
    }

    try:
        import numpy as np

        row = [float(feat_map.get(n, 0.0)) for n in names]
        x = np.asarray([row], dtype=np.float64)
        proba = model.predict_proba(x)[0]
    except Exception:
        return 0.0, None

    def idx(label: str) -> int:
        try:
            return label_names.index(label)
        except ValueError:
            return -1

    i_ai = idx("AI_ASSISTED")
    i_hum = idx("HUMAN_WRITTEN")
    if i_ai < 0 or i_hum < 0 or len(proba) <= max(i_ai, i_hum):
        return 0.0, None

    p_ai = float(proba[i_ai])
    p_hum = float(proba[i_hum])
    delta = w * (p_ai - p_hum)
    _session_stats["adjusted"] += 1

    proba_map = {str(label_names[i]): round(float(proba[i]), 4) for i in range(len(proba))}
    signal: Dict[str, object] = {
        "kind": "trained_authorship_model",
        "weight": round(delta, 3),
        "value": round(p_ai, 3),
        "reason": (
            "University-trained authorship model adjustment from instructor-labeled data "
            f"(P(AI-assisted)={round(p_ai, 2)}, P(human-written)={round(p_hum, 2)}; not a finding)."
        ),
        "proba": proba_map,
    }
    return delta, signal
