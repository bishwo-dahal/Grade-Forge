"""
Optional LLM-assisted AI-likeness signal (evidence tags).

Design goals:
- Do NOT use submission history (works on one snapshot).
- Only provide a feature signal: it can be used to adjust ranking conservatively.
- Default ON unless GRADER_LLM_AI_SIGNAL_ENABLED is false (0/false/no/off).
- GRADER_LLM_AI_SIGNAL_MAX_STUDENTS: 0 or unset default = all submissions with readable code;
  set a positive integer to cap calls per report (e.g. hosted API cost control).

Expected LLM response format (JSON):
{
  "ai_likeness": 0.0..1.0,
  "tags": ["..."],
  "uncertainty": 0.0..1.0,
  "notes": "optional string"
}
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

import urllib.error

from data_parser import Assignment


def _env_flag_enabled(key: str, default_on: bool) -> bool:
    raw = os.environ.get(key)
    if raw is None or str(raw).strip() == "":
        return default_on
    return str(raw).strip().lower() not in ("0", "false", "no", "off")


def _enabled() -> bool:
    return _env_flag_enabled("GRADER_LLM_AI_SIGNAL_ENABLED", True)


def is_llm_signal_env_enabled() -> bool:
    """True when GRADER_LLM_AI_SIGNAL_ENABLED requests the LLM layer (HTTP/parse may still fail)."""
    return _enabled()


def _get_env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _safe_json_extract(text: str) -> Optional[Dict[str, Any]]:
    t = text.strip()
    if not t:
        return None
    # Try direct parse first.
    try:
        parsed = json.loads(t)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    # Extract the first {...} JSON object.
    m = re.search(r"\{.*\}", t, flags=re.DOTALL)
    if not m:
        return None
    try:
        parsed = json.loads(m.group(0))
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None


def _read_file(path: str, max_chars: int) -> str:
    if not path or not os.path.isfile(path):
        return ""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        if len(content) <= max_chars:
            return content
        return content[: max_chars] + "\n/* ...truncated... */\n"
    except Exception:
        return ""


def _build_prompt(language: str, file_snippets: List[Dict[str, str]]) -> str:
    files_text = "\n\n".join(
        [f"FILE: {f['path']}\n```{f['language']}\n{f['code']}\n```" for f in file_snippets if f.get("code")]
    )
    return (
        "You are an academic integrity assistant helping faculty triage submissions.\n"
        "Given the code below, estimate the likelihood it was written with help from an LLM.\n"
        "Do not be certain; provide a cautious estimate.\n"
        "Return ONLY valid JSON with keys: ai_likeness (0..1), tags (array of strings), uncertainty (0..1), notes (string).\n"
        "tags must be short and come from this set when possible:\n"
        "- template_like\n"
        "- overly_uniform\n"
        "- mechanical_structure\n"
        "- explanation_commentary\n"
        "- style_marker_patterns\n"
        "- complexity_mismatch\n"
        "- low_personalization\n"
        "- other\n\n"
        f"Language: {language}\n\n"
        f"{files_text}\n"
    )


def _short_request_error(e: Exception) -> str:
    msg = str(e).strip() or type(e).__name__
    low = msg.lower()
    if "connection refused" in low or "errno 111" in low:
        return "Cannot reach the configured model endpoint (connection refused)."
    if "name or service not known" in low or "failed to resolve" in low or "errno -2" in low:
        return "Cannot resolve the configured model host (check URL / DNS)."
    if "timed out" in low or "timeout" in low:
        return "LLM request timed out. Try GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC or check server load."
    return msg[:220]


def _http_error_message(e: urllib.error.HTTPError) -> str:
    try:
        body = e.read().decode("utf-8", errors="replace")[:400]
    except Exception:
        body = ""
    if e.code == 404:
        return "The model server returned 404 (unknown model or path)."
    return f"LLM HTTP error {e.code}" + (f": {body}" if body else "")


def _call_llm(prompt: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    base = os.environ.get("GRADER_LLM_AI_SIGNAL_URL", "http://localhost:11434/api/generate")
    model = os.environ.get("GRADER_LLM_AI_SIGNAL_MODEL", "llama3")
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(base, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    timeout = int(os.environ.get("GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC", "30"))
    body = ""
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return None, _http_error_message(e)
    except Exception as e:
        return None, _short_request_error(e)

    # Ollama returns {"model","response","done",...}; graded JSON lives inside "response" as text.
    try:
        outer = json.loads(body)
        if isinstance(outer, dict) and "response" in outer:
            inner = _safe_json_extract(str(outer.get("response", "")))
            if inner is not None:
                return inner, None
    except Exception:
        pass

    # Non-Ollama servers may return the feature JSON as the raw body.
    parsed = _safe_json_extract(body)
    if parsed is not None and "ai_likeness" in parsed:
        return parsed, None
    return None, (
        "The model reply could not be used as structured LLM evidence (expected JSON with ai_likeness)."
    )


def get_llm_ai_signals(assignment: Assignment) -> Tuple[Dict[str, Dict[str, Any]], Optional[str], int]:
    """
    Returns (per_student_signals, unavailable_reason, llm_attempt_count).

    unavailable_reason is set when the LLM layer is enabled, at least one submission was sent to
    the model, and no student received a parseable result (e.g. endpoint down or bad output).

    llm_attempt_count is how many HTTP calls to the LLM were made (0 if disabled or no code sent).
    """
    if not _enabled():
        return {}, None, 0

    max_chars_total = int(os.environ.get("GRADER_LLM_AI_SIGNAL_MAX_CHARS_TOTAL", "9000"))
    max_chars_per_file = int(os.environ.get("GRADER_LLM_AI_SIGNAL_MAX_CHARS_PER_FILE", "2500"))
    max_files = int(os.environ.get("GRADER_LLM_AI_SIGNAL_MAX_FILES", "5"))
    max_students = int(os.environ.get("GRADER_LLM_AI_SIGNAL_MAX_STUDENTS", "0"))

    model = os.environ.get("GRADER_LLM_AI_SIGNAL_MODEL", "llama3")
    language = (assignment.language or "").lower() or "unknown"

    out: Dict[str, Dict[str, Any]] = {}
    llm_attempts = 0
    last_err: Optional[str] = None

    for sub in assignment.submissions:
        if max_students > 0 and len(out) >= max_students:
            break
        paths = sub.file_paths if isinstance(sub.file_paths, list) else [sub.file_paths]
        file_entries: List[Dict[str, str]] = []
        chars_used = 0
        for i, p in enumerate(paths):
            if i >= max_files:
                break
            chunk = _read_file(p, max_chars_per_file)
            if not chunk:
                continue
            if chars_used + len(chunk) > max_chars_total:
                remaining = max_chars_total - chars_used
                if remaining <= 0:
                    break
                chunk = chunk[:remaining] + "\n/* ...truncated... */\n"
            chars_used += len(chunk)
            ext_lang = "py" if language == "python" or str(p).endswith(".py") else "java" if str(p).endswith(".java") else language[:2]
            file_entries.append({"path": p, "language": ext_lang, "code": chunk})

        if not file_entries:
            continue

        prompt = _build_prompt(language, file_entries)
        llm_attempts += 1
        llm, err = _call_llm(prompt)
        if err:
            last_err = err
        if not llm:
            continue

        try:
            ai_likeness = float(llm.get("ai_likeness", 0.0))
        except Exception:
            ai_likeness = 0.0
        try:
            uncertainty = float(llm.get("uncertainty", 0.5))
        except Exception:
            uncertainty = 0.5

        tags = llm.get("tags")
        if not isinstance(tags, list):
            tags = []
        tags = [str(t) for t in tags if isinstance(t, (str, int, float))]
        ai_likeness = max(0.0, min(1.0, ai_likeness))
        uncertainty = max(0.0, min(1.0, uncertainty))

        out[str(sub.student_id)] = {
            "ai_likeness": ai_likeness,
            "tags": tags[:8],
            "uncertainty": uncertainty,
            "model": model,
            "source": "llm_ai_signal_only",
        }

    if llm_attempts > 0 and len(out) == 0:
        return {}, last_err or "No submission received usable structured output from the model.", llm_attempts
    return out, None, llm_attempts

