"""
Plagiarism / similarity detection (e.g. copydetect).
Used by the high-level grader pipeline.
Produces per-student results and comparison pairs for frontend side-by-side view.
"""
import os
from copydetect import CopyDetector
from data_parser import Assignment
from structured_similarity import structural_similarity

# Highlight markers used by copydetect in get_copied_code_list().
# Frontend can split on these to render highlighted segments (e.g. red left, green right).
HIGHLIGHT_START = ">>"
HIGHLIGHT_END = "<<"

# Minimum similarity (0–1) to report a pair. Raise to 0.6–0.7 to reduce false positives.
# Can be overridden via environment for tuning in different environments:
#   GRADER_SIMILARITY_THRESHOLD=0.6
def _get_display_threshold() -> float:
    raw = os.environ.get("GRADER_SIMILARITY_THRESHOLD")
    if not raw:
        return 0.5
    try:
        value = float(raw)
        # Clamp to a safe range [0, 1].
        return max(0.0, min(1.0, value))
    except ValueError:
        return 0.5


def _path_matches(sub_path, reported_path):
    a = os.path.abspath(sub_path)
    b = os.path.normpath(reported_path)
    return a == b or b.endswith(a) or a in b


def _student_for_path(assignment: Assignment, reported_path):
    for sub in assignment.submissions:
        paths = sub.file_paths if isinstance(sub.file_paths, list) else [sub.file_paths]
        if any(_path_matches(p, reported_path) for p in paths):
            return sub.student_id
    return None


def run_similarity_check(assignment: Assignment):
    """
    Run plagiarism detection on an assignment.
    Returns (results, comparisons):
      - results: list of per-student dicts (student_id, final_grade, similarity_score, similarity_warning).
      - comparisons: list of pairs for side-by-side view; each has left/right with
        student_id, file_path, code (with >> << around matched regions), similarity,
        and optional overlap_tokens. Frontend can render two columns and highlight
        segments between HIGHLIGHT_START and HIGHLIGHT_END.
    """
    ext = (
        "java"
        if assignment.language.lower() == "java"
        else "py"
        if assignment.language.lower() == "python"
        else assignment.language[:2]
    )
    detector = CopyDetector(
        extensions=[ext],
        display_t=_get_display_threshold(),
        silent=True,
    )

    # Precompute structural signatures per file path (lazy: only when needed).
    struct_sim_enabled = os.environ.get("GRADER_STRUCT_SIM_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    for sub in assignment.submissions:
        paths = sub.file_paths if isinstance(sub.file_paths, list) else [sub.file_paths]
        for path in paths:
            abs_path = os.path.abspath(path)
            if not os.path.isfile(abs_path):
                raise FileNotFoundError(f"Submission file not found: {path} (resolved to {abs_path})")
            detector.add_file(abs_path)

    detector.run()
    copied_list = detector.get_copied_code_list()

    # Best match per student (student_id -> (score, match_file, partner_student_id))
    best_match = {s.student_id: (0.0, None, None) for s in assignment.submissions}
    # Count of how many suspicious matches each student appears in (as suspect).
    matches_count = {s.student_id: 0 for s in assignment.submissions}
    comparisons = []

    for item in copied_list:
        if len(item) < 4:
            continue
        test_sim, ref_sim, test_path, ref_path = item[0], item[1], item[2], item[3]

        # Only the suspect (test) gets the similarity score. Use test_sim only so the overall %
        # matches "how much did YOUR code match the other?" (same as the file-level percentages we show).
        test_student = _student_for_path(assignment, test_path)
        ref_student = _student_for_path(assignment, ref_path)

        # Build comparison entry for frontend. We want left=person we're checking (suspect),
        # right=potential source. Copydetect: test_path=file being checked, ref_path=reference.
        if len(item) >= 6:
            # item: [test_sim, ref_sim, test_path, ref_path, highlighted_test_code, highlighted_ref_code, ...]
            highlighted_test = item[4]
            highlighted_ref = item[5]
            overlap_tokens = item[6] if len(item) > 6 else None
            if overlap_tokens is not None:
                overlap_tokens = int(overlap_tokens)  # numpy int64 -> native int for JSON
            # left = suspect (test = "did they copy?"), right = source (ref)
            left_student = test_student
            right_student = ref_student

            # Optional structural similarity (AST-based) for supported languages.
            struct_sim = 0.0
            combined_test = test_sim
            combined_ref = ref_sim
            if struct_sim_enabled:
                try:
                    struct_sim = structural_similarity(test_path, ref_path, assignment.language)
                    weight = float(os.environ.get("GRADER_STRUCT_SIM_WEIGHT", "0.5"))
                    weight = max(0.0, min(1.0, weight))
                    combined_test = (1.0 - weight) * test_sim + weight * struct_sim
                    combined_ref = (1.0 - weight) * ref_sim + weight * struct_sim
                except Exception:
                    struct_sim = 0.0
                    combined_test = test_sim
                    combined_ref = ref_sim

            # Update per-student best match symmetrically so both sides can be flagged.
            if test_student is not None:
                matches_count[test_student] = matches_count.get(test_student, 0) + 1
                current_best_score, _, _ = best_match.get(test_student, (0.0, None, None))
                if combined_test > current_best_score:
                    best_match[test_student] = (combined_test, ref_path, ref_student)
            if ref_student is not None:
                matches_count[ref_student] = matches_count.get(ref_student, 0) + 1
                current_best_score, _, _ = best_match.get(ref_student, (0.0, None, None))
                if combined_ref > current_best_score:
                    best_match[ref_student] = (combined_ref, test_path, test_student)

            comparisons.append({
                "left": {
                    "student_id": left_student,
                    "file_path": test_path,
                    "code": highlighted_test,
                    "similarity": round(combined_test, 2),
                    "token_similarity": round(test_sim, 2),
                    "structural_similarity": round(struct_sim, 2),
                    "combined_similarity": round(combined_test, 2),
                },
                "right": {
                    "student_id": right_student,
                    "file_path": ref_path,
                    "code": highlighted_ref,
                    "similarity": round(ref_sim, 2),
                    "token_similarity": round(ref_sim, 2),
                    "structural_similarity": round(struct_sim, 2),
                    "combined_similarity": round(combined_ref, 2),
                },
                "overlap_tokens": overlap_tokens,
            })
        else:
            # Even if we can't build comparisons (missing highlighted code), still update best-match scoring.
            # We compute structural similarity lazily only when enabled.
            struct_sim = 0.0
            combined_test = test_sim
            combined_ref = ref_sim
            if struct_sim_enabled:
                try:
                    struct_sim = structural_similarity(test_path, ref_path, assignment.language)
                    weight = float(os.environ.get("GRADER_STRUCT_SIM_WEIGHT", "0.5"))
                    weight = max(0.0, min(1.0, weight))
                    combined_test = (1.0 - weight) * test_sim + weight * struct_sim
                    combined_ref = (1.0 - weight) * ref_sim + weight * struct_sim
                except Exception:
                    combined_test = test_sim
                    combined_ref = ref_sim

            if test_student is not None:
                matches_count[test_student] = matches_count.get(test_student, 0) + 1
                current_best_score, _, _ = best_match.get(test_student, (0.0, None, None))
                if combined_test > current_best_score:
                    best_match[test_student] = (combined_test, ref_path, ref_student)
            if ref_student is not None:
                matches_count[ref_student] = matches_count.get(ref_student, 0) + 1
                current_best_score, _, _ = best_match.get(ref_student, (0.0, None, None))
                if combined_ref > current_best_score:
                    best_match[ref_student] = (combined_ref, test_path, test_student)

    results = []
    for sub in assignment.submissions:
        score, match_file, partner_student = best_match.get(sub.student_id, (0.0, None, None))
        grade = sub.calculate_score(
            assignment.weights, assignment.public_tests, assignment.private_tests
        )
        if match_file:
            filename = os.path.basename(match_file)
        else:
            filename = None
        if partner_student and filename:
            similarity_warning = f"Match with student {partner_student} in {filename}"
        elif partner_student:
            similarity_warning = f"Match with student {partner_student}"
        elif filename:
            similarity_warning = f"Match in {filename}"
        else:
            similarity_warning = None
        results.append({
            "student_id": sub.student_id,
            "final_grade": grade,
            # Use the (possibly) combined similarity as the main score.
            "similarity_score": round(score, 2),
            "similarity_warning": similarity_warning,
            "matches_count": matches_count.get(sub.student_id, 0),
        })

    return results, comparisons
