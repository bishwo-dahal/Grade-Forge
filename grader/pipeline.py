"""Run all grader steps and return combined results."""
from data_parser import Assignment
from ai_detection import analyze_ai_risk
from plagiarism import run_similarity_check, HIGHLIGHT_START, HIGHLIGHT_END


def run_pipeline(assignment: Assignment) -> dict:
    """Run all steps (similarity, etc.) and merge per-student results."""
    by_student = {s.student_id: {} for s in assignment.submissions}
    similarity_by_student = {}

    results, comparisons = run_similarity_check(assignment)
    for r in results:
        similarity_by_student[r["student_id"]] = r.get("similarity_score", 0.0)
        sid = r.pop("student_id")
        by_student[sid].update(r)

    ai_analysis = analyze_ai_risk(assignment, similarity_by_student)
    ai_by_student = ai_analysis.get("by_student", {})

    # Simple assignment-level summary for quick frontend visuals / risk overview.
    total_students = len(by_student)
    flagged_students = sum(1 for data in by_student.values() if (data.get("similarity_score") or 0) > 0)
    max_similarity_overall = max(
        (data.get("similarity_score") or 0) for data in by_student.values()
    ) if by_student else 0.0

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
        by_student[sid]["ai_features"] = ai_by_student.get(sid, {})

    return {
        "assignment_id": assignment.assignment_id,
        "results": [{"student_id": sid, **data} for sid, data in by_student.items()],
        "highlight_markers": {"start": HIGHLIGHT_START, "end": HIGHLIGHT_END},
        # Extensible object for assignment-level AI features (e.g. model_version, run_metadata).
        "ai_features": {
            "summary": {
                "total_students": total_students,
                "flagged_students": flagged_students,
                "max_similarity": round(max_similarity_overall, 2),
            },
            "authorship_risk_summary": ai_analysis.get("summary", {}),
            "model_info": ai_analysis.get("model_info", {}),
            "disclaimer": ai_analysis.get("disclaimer"),
        },
    }
