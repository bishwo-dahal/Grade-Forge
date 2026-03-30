#!/usr/bin/env python3
"""
Offline calibration helper for AI authorship risk signals.

Input format (JSON):
[
  {
    "assignment_id": "1",
    "course_id": "CSE101",
    "language": "python",
    "students": [
      {"student_id": "10", "label": 1, "risk_score": 0.71},
      {"student_id": "11", "label": 0, "risk_score": 0.22}
    ]
  }
]

label: 1 = confirmed AI-assisted, 0 = non-AI / false positive.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from typing import Dict, Iterable, List, Tuple


def _confusion(rows: Iterable[Tuple[int, float]], threshold: float) -> Dict[str, int]:
    tp = fp = tn = fn = 0
    for label, score in rows:
        pred = 1 if score >= threshold else 0
        if pred == 1 and label == 1:
            tp += 1
        elif pred == 1 and label == 0:
            fp += 1
        elif pred == 0 and label == 0:
            tn += 1
        else:
            fn += 1
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn}


def _metrics(conf: Dict[str, int]) -> Dict[str, float]:
    tp, fp, tn, fn = conf["tp"], conf["fp"], conf["tn"], conf["fn"]
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    accuracy = (tp + tn) / max(1, (tp + tn + fp + fn))
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "fpr": round(fpr, 4),
        "accuracy": round(accuracy, 4),
    }


def _best_threshold(rows: List[Tuple[int, float]]) -> float:
    candidates = [i / 100.0 for i in range(20, 91, 5)]
    best_t = 0.5
    best_score = -1.0
    for t in candidates:
        m = _metrics(_confusion(rows, t))
        # Conservative objective: reward precision heavily and penalize FPR.
        score = (m["precision"] * 0.65) + (m["recall"] * 0.25) - (m["fpr"] * 0.6)
        if score > best_score:
            best_score = score
            best_t = t
    return best_t


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python evaluate_ai_detection.py <labels_json> [threshold]")
        return 1
    path = sys.argv[1]
    threshold = float(sys.argv[2]) if len(sys.argv) >= 3 else None

    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    overall: List[Tuple[int, float]] = []
    by_lang: Dict[str, List[Tuple[int, float]]] = defaultdict(list)
    by_course: Dict[str, List[Tuple[int, float]]] = defaultdict(list)

    for assignment in payload:
        language = str(assignment.get("language", "unknown")).lower()
        course = str(assignment.get("course_id", "unknown"))
        for s in assignment.get("students", []):
            label = int(s.get("label", 0))
            score = float(s.get("risk_score", 0.0))
            row = (label, score)
            overall.append(row)
            by_lang[language].append(row)
            by_course[course].append(row)

    if not overall:
        print("No data rows found.")
        return 1

    t = threshold if threshold is not None else _best_threshold(overall)
    print(json.dumps({"selected_threshold": round(t, 3)}, indent=2))

    print("\n== Overall ==")
    conf = _confusion(overall, t)
    print(json.dumps({"confusion": conf, "metrics": _metrics(conf), "rows": len(overall)}, indent=2))

    print("\n== By Language ==")
    for language, rows in sorted(by_lang.items()):
        conf = _confusion(rows, t)
        print(json.dumps({"language": language, "rows": len(rows), "confusion": conf, "metrics": _metrics(conf)}, indent=2))

    print("\n== By Course ==")
    for course, rows in sorted(by_course.items()):
        conf = _confusion(rows, t)
        print(json.dumps({"course_id": course, "rows": len(rows), "confusion": conf, "metrics": _metrics(conf)}, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
