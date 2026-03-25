"""
Stage-1 AI authorship risk heuristics.

This module intentionally uses deterministic and explainable signals.
It does NOT make a definitive accusation; it produces a risk score and
reason snippets for faculty triage.
"""
from __future__ import annotations

import os
import re
import statistics
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Tuple

from data_parser import Assignment, Submission


IDENT_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")

# Tokens and style markers commonly over-represented in generated explanations/comments.
COMMENT_MARKERS = (
    "in summary",
    "overall",
    "this function",
    "step by step",
    "edge case",
    "time complexity",
    "space complexity",
    "helper function",
)


@dataclass
class SubmissionMetrics:
    student_id: str
    code_lines: int
    comment_lines: int
    avg_line_len: float
    line_len_std: float
    long_identifier_ratio: float
    non_ascii_count: int
    em_dash_count: int
    marker_hits: int
    approx_cyclomatic_markers: int
    template_cluster_size: int
    test_pass_ratio: float

    @property
    def comment_ratio(self) -> float:
        if self.code_lines <= 0:
            return 0.0
        return self.comment_lines / float(self.code_lines)


def _is_comment_line(line: str, language: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    lang = (language or "").lower()
    if lang == "python":
        return stripped.startswith("#")
    if lang == "java":
        return stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*")
    return stripped.startswith("#") or stripped.startswith("//")


def _extract_metrics(submission: Submission, language: str) -> SubmissionMetrics:
    code_lines = 0
    comment_lines = 0
    line_lengths: List[int] = []
    long_identifier_count = 0
    identifier_count = 0
    non_ascii_count = 0
    em_dash_count = 0
    marker_hits = 0
    complexity_markers = 0
    normalized_hashes: List[str] = []

    paths = submission.file_paths if isinstance(submission.file_paths, list) else [submission.file_paths]
    for path in paths:
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        non_ascii_count += sum(1 for ch in content if ord(ch) > 127)
        em_dash_count += content.count("—")
        lowered = content.lower()
        marker_hits += sum(lowered.count(token) for token in COMMENT_MARKERS)
        complexity_markers += sum(
            lowered.count(token)
            for token in (" if ", " elif ", " else", " for ", " while ", " case ", " catch ", "&&", "||", " try ")
        )
        normalized = re.sub(r"\d+", "0", content)
        normalized = IDENT_RE.sub("id", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        if normalized:
            normalized_hashes.append(hashlib.sha1(normalized.encode("utf-8", errors="ignore")).hexdigest())

        for ident in IDENT_RE.findall(content):
            identifier_count += 1
            if len(ident) >= 18:
                long_identifier_count += 1

        for raw in content.splitlines():
            stripped = raw.strip()
            if not stripped:
                continue
            code_lines += 1
            line_lengths.append(len(raw))
            if _is_comment_line(raw, language):
                comment_lines += 1

    avg_line_len = statistics.fmean(line_lengths) if line_lengths else 0.0
    line_len_std = statistics.pstdev(line_lengths) if len(line_lengths) > 1 else 0.0
    long_identifier_ratio = (long_identifier_count / identifier_count) if identifier_count else 0.0

    raw_passes = int(getattr(submission.test_results, "public_pass", 0)) + int(getattr(submission.test_results, "private_pass", 0))
    # test_pass_ratio gets normalized in analyze_ai_risk using assignment totals.
    submission_hash = min(normalized_hashes) if normalized_hashes else ""

    metrics = SubmissionMetrics(
        student_id=submission.student_id,
        code_lines=code_lines,
        comment_lines=comment_lines,
        avg_line_len=avg_line_len,
        line_len_std=line_len_std,
        long_identifier_ratio=long_identifier_ratio,
        non_ascii_count=non_ascii_count,
        em_dash_count=em_dash_count,
        marker_hits=marker_hits,
        approx_cyclomatic_markers=complexity_markers,
        template_cluster_size=0,
        test_pass_ratio=float(max(0, raw_passes)),
    )
    setattr(metrics, "_template_hash", submission_hash)
    return metrics


def _compute_template_cluster_sizes(metrics: List[SubmissionMetrics]) -> None:
    clusters: Dict[str, int] = {}
    for m in metrics:
        key = getattr(m, "_template_hash", "")
        if not key:
            continue
        clusters[key] = clusters.get(key, 0) + 1
    for m in metrics:
        key = getattr(m, "_template_hash", "")
        m.template_cluster_size = clusters.get(key, 1 if key else 0)


def _cohort_stats(values: List[float]) -> Tuple[float, float]:
    if not values:
        return 0.0, 0.0
    med = statistics.median(values)
    deviations = [abs(v - med) for v in values]
    mad = statistics.median(deviations)
    robust_scale = mad * 1.4826
    return med, robust_scale


def _robust_outlier_strength(value: float, median: float, scale: float, threshold: float = 2.0) -> float:
    if scale <= 1e-9:
        return 0.0
    z = abs(value - median) / scale
    if z <= threshold:
        return 0.0
    # Smoothly grows to 1.0; capped to keep score bounded.
    return min(1.0, (z - threshold) / 3.0)


def _level_from_score(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    if score >= 0.2:
        return "low"
    return "none"


def analyze_ai_risk(assignment: Assignment, similarity_by_student: Dict[str, float]) -> Dict[str, object]:
    """
    Returns:
      {
        "by_student": { student_id: {risk_score, risk_level, signals, ...} },
        "summary": { ... },
        "model_info": { ... },
        "disclaimer": "...",
      }
    """
    metrics = [_extract_metrics(sub, assignment.language) for sub in assignment.submissions]
    _compute_template_cluster_sizes(metrics)
    total_assignment_tests = max(1, int(assignment.public_tests) + int(assignment.private_tests))
    for m in metrics:
        m.test_pass_ratio = min(1.0, m.test_pass_ratio / float(total_assignment_tests))
    by_student: Dict[str, Dict[str, object]] = {}

    comment_values = [m.comment_ratio for m in metrics]
    line_len_values = [m.avg_line_len for m in metrics]
    line_std_values = [m.line_len_std for m in metrics]
    ident_values = [m.long_identifier_ratio for m in metrics]
    complexity_values = [m.approx_cyclomatic_markers / max(1, m.code_lines) for m in metrics]

    comment_med, comment_scale = _cohort_stats(comment_values)
    line_med, line_scale = _cohort_stats(line_len_values)
    std_med, std_scale = _cohort_stats(line_std_values)
    ident_med, ident_scale = _cohort_stats(ident_values)
    complexity_med, complexity_scale = _cohort_stats(complexity_values)

    high_count = 0
    medium_count = 0
    max_score = 0.0

    for m in metrics:
        signals: List[Dict[str, object]] = []
        score = 0.0

        # Outlier-driven style signals (cohort-relative).
        comment_strength = _robust_outlier_strength(m.comment_ratio, comment_med, comment_scale)
        if comment_strength > 0:
            weight = 0.22 * comment_strength
            score += weight
            signals.append(
                {
                    "kind": "comment_density_outlier",
                    "weight": round(weight, 3),
                    "value": round(m.comment_ratio, 3),
                    "cohort_median": round(comment_med, 3),
                    "reason": "Comment density is an outlier compared to this assignment cohort.",
                }
            )

        line_strength = _robust_outlier_strength(m.avg_line_len, line_med, line_scale)
        if line_strength > 0:
            weight = 0.18 * line_strength
            score += weight
            signals.append(
                {
                    "kind": "line_length_outlier",
                    "weight": round(weight, 3),
                    "value": round(m.avg_line_len, 2),
                    "cohort_median": round(line_med, 2),
                    "reason": "Average line length is an outlier for this cohort.",
                }
            )

        # Very low line-length variance can indicate over-uniform generated formatting.
        # We score only if standard deviation is unusually low relative to peers.
        low_var_strength = _robust_outlier_strength(m.line_len_std, std_med, std_scale)
        if m.line_len_std < std_med and low_var_strength > 0:
            weight = 0.12 * low_var_strength
            score += weight
            signals.append(
                {
                    "kind": "line_uniformity_outlier",
                    "weight": round(weight, 3),
                    "value": round(m.line_len_std, 2),
                    "cohort_median": round(std_med, 2),
                    "reason": "Line formatting is unusually uniform compared to peers.",
                }
            )

        ident_strength = _robust_outlier_strength(m.long_identifier_ratio, ident_med, ident_scale)
        if ident_strength > 0:
            weight = 0.16 * ident_strength
            score += weight
            signals.append(
                {
                    "kind": "long_identifier_outlier",
                    "weight": round(weight, 3),
                    "value": round(m.long_identifier_ratio, 3),
                    "cohort_median": round(ident_med, 3),
                    "reason": "Very long identifier usage is an outlier for this cohort.",
                }
            )

        complexity_density = m.approx_cyclomatic_markers / max(1, m.code_lines)
        complexity_strength = _robust_outlier_strength(complexity_density, complexity_med, complexity_scale)
        if complexity_strength > 0 and m.test_pass_ratio < 0.35:
            weight = 0.14 * complexity_strength
            score += weight
            signals.append(
                {
                    "kind": "complexity_mismatch",
                    "weight": round(weight, 3),
                    "value": round(complexity_density, 3),
                    "cohort_median": round(complexity_med, 3),
                    "reason": "Code complexity appears unusually high relative to low test performance.",
                }
            )

        if m.template_cluster_size >= 3:
            # Shared normalized scaffolds across many students can indicate generated/template-heavy code.
            cluster_weight = min(0.2, 0.05 + (m.template_cluster_size - 2) * 0.03)
            score += cluster_weight
            signals.append(
                {
                    "kind": "template_fingerprint_cluster",
                    "weight": round(cluster_weight, 3),
                    "value": m.template_cluster_size,
                    "reason": "Submission belongs to a repeated scaffold cluster across the cohort.",
                }
            )

        # Absolute markers (small weights; never decisive alone).
        if m.non_ascii_count > 0:
            ascii_weight = min(0.1, 0.02 + m.non_ascii_count * 0.002)
            score += ascii_weight
            signals.append(
                {
                    "kind": "non_ascii_marker",
                    "weight": round(ascii_weight, 3),
                    "value": m.non_ascii_count,
                    "reason": "Non-ASCII characters appear in source/comments; review context.",
                }
            )
        if m.em_dash_count > 0:
            em_weight = min(0.08, 0.02 + m.em_dash_count * 0.01)
            score += em_weight
            signals.append(
                {
                    "kind": "em_dash_marker",
                    "weight": round(em_weight, 3),
                    "value": m.em_dash_count,
                    "reason": "Em dash usage appears in source/comments; review writing style context.",
                }
            )
        if m.marker_hits > 0:
            marker_weight = min(0.12, 0.03 + m.marker_hits * 0.01)
            score += marker_weight
            signals.append(
                {
                    "kind": "generic_explanatory_markers",
                    "weight": round(marker_weight, 3),
                    "value": m.marker_hits,
                    "reason": "Generic explanatory phrases occur repeatedly in comments/text.",
                }
            )

        # Cross-signal: high similarity boosts risk slightly, but should not dominate.
        similarity = float(similarity_by_student.get(m.student_id, 0.0) or 0.0)
        if similarity >= 0.7:
            sim_weight = 0.14
            score += sim_weight
            signals.append(
                {
                    "kind": "high_similarity_context",
                    "weight": sim_weight,
                    "value": round(similarity, 2),
                    "reason": "High code similarity context increases manual review priority.",
                }
            )

        # Clamp and classify.
        score = max(0.0, min(1.0, score))
        level = _level_from_score(score)
        if level == "high":
            high_count += 1
        elif level == "medium":
            medium_count += 1
        max_score = max(max_score, score)

        signals = sorted(signals, key=lambda s: float(s.get("weight", 0)), reverse=True)
        top_reasons = [str(s.get("reason", "")) for s in signals[:3]]

        by_student[m.student_id] = {
            "risk_score": round(score, 3),
            "risk_level": level,
            "signals": signals,
            "top_reasons": top_reasons,
            "metrics": {
                "code_lines": m.code_lines,
                "comment_ratio": round(m.comment_ratio, 3),
                "avg_line_length": round(m.avg_line_len, 2),
                "line_length_std": round(m.line_len_std, 2),
                "long_identifier_ratio": round(m.long_identifier_ratio, 3),
                "non_ascii_count": m.non_ascii_count,
                "em_dash_count": m.em_dash_count,
                "marker_hits": m.marker_hits,
                "approx_complexity_markers": m.approx_cyclomatic_markers,
                "template_cluster_size": m.template_cluster_size,
                "test_pass_ratio": round(m.test_pass_ratio, 3),
            },
        }

    total = len(metrics)
    return {
        "by_student": by_student,
        "summary": {
            "total_students": total,
            "high_risk_students": high_count,
            "medium_risk_students": medium_count,
            "max_risk_score": round(max_score, 3),
        },
        "model_info": {
            "name": "heuristic-ai-risk-v1",
            "type": "deterministic-signals",
            "uses_training_data": False,
        },
        "disclaimer": (
            "AI authorship score is probabilistic triage support. "
            "It includes a small similarity-context signal in this version. "
            "Do not use as sole evidence; require faculty review and student follow-up."
        ),
    }
