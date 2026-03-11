"""Run all grader steps and return combined results."""
from data_parser import Assignment
from plagiarism import run_similarity_check, HIGHLIGHT_START, HIGHLIGHT_END


def run_pipeline(assignment: Assignment) -> dict:
    """Run all steps (similarity, etc.) and merge per-student results."""
    by_student = {s.student_id: {} for s in assignment.submissions}

    results, comparisons = run_similarity_check(assignment)
    for r in results:
        sid = r.pop("student_id")
        by_student[sid].update(r)

    # Attach every comparison to both students involved, so each sees "you vs other".
    # For each (left=A, right=B): A gets (you=A, other=B), B gets (you=B, other=A).
    for sid in by_student:
        out = []
        for c in comparisons:
            left_id = c["left"]["student_id"]
            right_id = c["right"]["student_id"]
            if sid == left_id:
                out.append({"left": c["left"], "right": c["right"], "overlap_tokens": c.get("overlap_tokens")})
            elif sid == right_id:
                out.append({"left": c["right"], "right": c["left"], "overlap_tokens": c.get("overlap_tokens")})
        by_student[sid]["comparisons"] = out
        # Extensible object for future AI-derived features per student (e.g. is_ai_generated, explanation).
        if "ai_features" not in by_student[sid]:
            by_student[sid]["ai_features"] = {}

    return {
        "assignment_id": assignment.assignment_id,
        "results": [{"student_id": sid, **data} for sid, data in by_student.items()],
        "highlight_markers": {"start": HIGHLIGHT_START, "end": HIGHLIGHT_END},
        # Extensible object for assignment-level AI features (e.g. model_version, run_metadata).
        "ai_features": {},
    }
