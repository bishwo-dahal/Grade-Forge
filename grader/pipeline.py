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

    # Attach only the comparisons that involve each student (left or right)
    for sid in by_student:
        by_student[sid]["comparisons"] = [
            c for c in comparisons
            if c["left"]["student_id"] == sid or c["right"]["student_id"] == sid
        ]
        if "ai_flag" not in by_student[sid]:
            by_student[sid]["ai_flag"] = None

    return {
        "assignment_id": assignment.assignment_id,
        "results": [{"student_id": sid, **data} for sid, data in by_student.items()],
        "highlight_markers": {"start": HIGHLIGHT_START, "end": HIGHLIGHT_END},
    }
