#!/usr/bin/env python3
"""
Train a simple authorship-triage classifier from labels + per-submission features.

Labels come from fetch_labels.py (or the university admin API). Features are YOUR
responsibility: e.g. export metrics from grader reports (risk_score, similarity, …)
or compute from submission text offline. This script only joins on submissionId.

Features file (JSON object keyed by submission id as string):
  {
    "42": { "risk_score": 0.35, "similarity_score": 0.12, "code_lines": 80 },
    "43": { "risk_score": 0.71, "similarity_score": 0.45, "code_lines": 120 }
  }

All numeric values are used as columns (union of keys across rows; missing -> 0.0).

Usage:
  pip install -r requirements-train.txt
  python train_authorship.py --labels labels_snapshot.json --features features.json --out model.joblib
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import Any

LABEL_ORDER = ("AI_ASSISTED", "HUMAN_WRITTEN", "UNCLEAR")


def _as_float(v: Any) -> float:
    if isinstance(v, bool):
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    return 0.0


def main() -> int:
    try:
        import joblib
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import classification_report
        from sklearn.model_selection import train_test_split
    except ImportError:
        print("error: install dependencies: pip install -r requirements-train.txt", file=sys.stderr)
        return 1

    p = argparse.ArgumentParser(description="Train authorship triage model from labels + features JSON.")
    p.add_argument("--labels", required=True, help="JSON array from fetch_labels.py / API")
    p.add_argument("--features", required=True, help="JSON object: submissionId -> { feature_name: number, ... }")
    p.add_argument("--out", default="authorship_triage_model.joblib", help="Output joblib path")
    p.add_argument("--test-size", type=float, default=0.2, help="Holdout fraction for metrics")
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    with open(args.labels, encoding="utf-8") as f:
        labels_raw = json.load(f)
    with open(args.features, encoding="utf-8") as f:
        features_raw = json.load(f)

    if not isinstance(labels_raw, list):
        print("error: labels file must be a JSON array", file=sys.stderr)
        return 1
    if not isinstance(features_raw, dict):
        print("error: features file must be a JSON object keyed by submission id", file=sys.stderr)
        return 1

    # Collect all feature names
    feat_names: set[str] = set()
    for sid, row in features_raw.items():
        if not isinstance(row, dict):
            continue
        for k, v in row.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                feat_names.add(str(k))
    feat_names_sorted = sorted(feat_names)
    if not feat_names_sorted:
        print("error: no numeric features found in --features", file=sys.stderr)
        return 1

    X_list: list[list[float]] = []
    y_list: list[int] = []
    used_ids: list[str] = []

    for row in labels_raw:
        if not isinstance(row, dict):
            continue
        sid = row.get("submissionId")
        lab = row.get("label")
        if sid is None or lab not in LABEL_ORDER:
            continue
        key = str(int(sid)) if isinstance(sid, (int, float)) else str(sid).strip()
        fr = features_raw.get(key)
        if not isinstance(fr, dict):
            continue
        vec = [_as_float(fr.get(name)) for name in feat_names_sorted]
        X_list.append(vec)
        y_list.append(LABEL_ORDER.index(str(lab)))
        used_ids.append(key)

    if len(X_list) < 10:
        print(
            f"error: need more labeled rows with matching features (got {len(X_list)}); "
            "collect more triage labels and align feature export.",
            file=sys.stderr,
        )
        return 1

    X = np.asarray(X_list, dtype=np.float64)
    y = np.asarray(y_list, dtype=np.int64)

    unique, counts = np.unique(y, return_counts=True)
    can_stratify = len(unique) > 1 and int(counts.min()) >= 2

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed, stratify=y if can_stratify else None
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=args.seed,
        class_weight="balanced_subsample",
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    # Some datasets/splits may not include all 3 classes in the holdout set (e.g. no "UNCLEAR").
    # Force a stable label ordering so the report prints consistently and doesn't error.
    print(
        classification_report(
            y_test,
            y_pred,
            labels=list(range(len(LABEL_ORDER))),
            target_names=list(LABEL_ORDER),
            zero_division=0,
        )
    )

    bundle = {
        "model": clf,
        "feature_names": feat_names_sorted,
        "label_names": list(LABEL_ORDER),
    }
    joblib.dump(bundle, args.out)
    print(f"wrote {args.out} ({len(used_ids)} training rows used)")
    print("Deploy: point ml.authorship-model.path / ML_AUTHORSHIP_MODEL_PATH at this file (defaults exist in application.properties).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
