# AI Detection Pilot Playbook

This playbook operationalizes the pilot and governance phase.

## Pilot Scope

- 1-2 courses only.
- Faculty volunteers only.
- No automatic penalties; triage-only experience.
- Duration: 2-4 weeks.

## Success Criteria

- False positive rate below agreed threshold (example: under 10% in reviewed sample).
- Faculty reports explanations are understandable and useful.
- No unresolved appeal process gaps.

## Faculty Workflow

1. Open grader report and sort by AI risk.
2. Review top signals and evidence snippets.
3. Mark review outcome in faculty notes:
   - `confirmed_ai`
   - `false_positive`
   - `inconclusive`
4. Conduct student follow-up for medium/high cases.
5. Record final outcome and rationale.

## Governance Controls

- Keep model/signal version and timestamp in each report.
- Keep threshold settings per course term.
- Document policy statement in course syllabus or integrity policy.
- Require second reviewer for high-impact decisions when feasible.

## Feedback Loop Data (minimum)

For each reviewed student:

- assignment_id
- student_id
- risk_score
- risk_level
- top_signals
- reviewer_outcome (`confirmed_ai` | `false_positive` | `inconclusive`)
- reviewer_notes

Use this dataset for offline calibration before changing thresholds.

## Rollout Decision Gate

Move beyond pilot only if:

- metrics are stable across language/course slices,
- faculty confidence is positive,
- policy and appeal pathways are finalized,
- calibration reports are reviewed by course leads.
