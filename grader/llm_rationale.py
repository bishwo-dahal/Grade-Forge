"""
Optional LLM-assisted rationale generation for AI risk output.

Design constraints:
- Never decide risk score in this module.
- Only explain deterministic signals already computed.
- Safe fallback to deterministic-only mode when unavailable.
"""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Dict, List


def _enabled() -> bool:
    return os.environ.get("GRADER_LLM_RATIONALE_ENABLED", "false").lower() in ("1", "true", "yes")


def _build_prompt(signals: List[Dict[str, object]], risk_level: str) -> str:
    top = signals[:4]
    return (
        "You are helping faculty interpret AI-authorship triage signals.\n"
        "Do not claim certainty. Do not accuse students.\n"
        "Given these signals, produce JSON with keys: summary (string), caveats (string array, 2 items).\n"
        f"Risk level: {risk_level}\n"
        f"Signals: {json.dumps(top)}"
    )


def _call_ollama(prompt: str) -> Dict[str, object] | None:
    base = os.environ.get("GRADER_LLM_RATIONALE_URL", "http://localhost:11434/api/generate")
    model = os.environ.get("GRADER_LLM_RATIONALE_MODEL", "llama3")
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(base, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
        parsed = json.loads(body)
        text = str(parsed.get("response", "")).strip()
        if not text:
            return None
        # Try direct JSON parse first.
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
        return {"summary": text, "caveats": ["LLM output not strictly structured.", "Manual review required."]}
    except Exception:
        return None


def generate_llm_rationales(by_student: Dict[str, Dict[str, object]]) -> str:
    """
    Mutates by_student in place and returns rationale mode.
    """
    if not _enabled():
        return "deterministic_only"

    model = os.environ.get("GRADER_LLM_RATIONALE_MODEL", "llama3")
    any_success = False
    for student_id, features in by_student.items():
        signals = features.get("signals")
        if not isinstance(signals, list) or not signals:
            continue
        risk_level = str(features.get("risk_level", "none"))
        prompt = _build_prompt(signals, risk_level)
        llm_data = _call_ollama(prompt)
        if not llm_data:
            continue
        any_success = True
        features["llm_rationale"] = {
            "summary": str(llm_data.get("summary", "")).strip(),
            "caveats": llm_data.get("caveats", ["Manual review required."]),
            "model": model,
            "source": "llm_explanation_only",
        }

    return "llm_assisted" if any_success else "deterministic_only"
