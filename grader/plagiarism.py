"""
Plagiarism / similarity detection (e.g. copydetect).
Used by the high-level grader pipeline.
Produces per-student results and comparison pairs for frontend side-by-side view.
"""
import os
from copydetect import CopyDetector
from data_parser import Assignment

# Highlight markers used by copydetect in get_copied_code_list().
# Frontend can split on these to render highlighted segments (e.g. red left, green right).
HIGHLIGHT_START = ">>"
HIGHLIGHT_END = "<<"

# Minimum similarity (0–1) to report a pair. Raise to 0.6–0.7 to reduce false positives.
DISPLAY_THRESHOLD = 0.5


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
        display_t=DISPLAY_THRESHOLD,
        silent=True,
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

    # Best match per student (student_id -> (score, match_file))
    best_match = {s.student_id: (0.0, None) for s in assignment.submissions}
    comparisons = []

    for item in copied_list:
        if len(item) < 4:
            continue
        test_sim, ref_sim, test_path, ref_path = item[0], item[1], item[2], item[3]
        score = max(test_sim, ref_sim)

        # Only the suspect (test) gets the similarity score — "how much did YOUR code match someone else".
        # The source (ref) still sees the comparison in their report but won't get a high % in the summary.
        test_student = _student_for_path(assignment, test_path)
        if test_student is not None and score > best_match[test_student][0]:
            best_match[test_student] = (score, ref_path)

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
            left_student = _student_for_path(assignment, test_path)
            right_student = _student_for_path(assignment, ref_path)
            comparisons.append({
                "left": {
                    "student_id": left_student,
                    "file_path": test_path,
                    "code": highlighted_test,
                    "similarity": round(test_sim, 2),
                },
                "right": {
                    "student_id": right_student,
                    "file_path": ref_path,
                    "code": highlighted_ref,
                    "similarity": round(ref_sim, 2),
                },
                "overlap_tokens": overlap_tokens,
            })

    results = []
    for sub in assignment.submissions:
        score, match_file = best_match.get(sub.student_id, (0.0, None))
        grade = sub.calculate_score(
            assignment.weights, assignment.public_tests, assignment.private_tests
        )
        results.append({
            "student_id": sub.student_id,
            "final_grade": grade,
            "similarity_score": round(score, 2),
            "similarity_warning": f"Match: {match_file}" if match_file else None,
        })

    return results, comparisons
