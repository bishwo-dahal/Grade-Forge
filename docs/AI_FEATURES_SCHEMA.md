# AI Features Schema (Stage 1)

This schema defines how AI authorship signals are encoded in grader report JSON.

## Assignment-Level Fields

Stored in `payload.ai_features`:

- `summary`
  - existing similarity summary.
- `authorship_risk_summary`
  - `total_students` (number)
  - `high_risk_students` (number)
  - `medium_risk_students` (number)
  - `max_risk_score` (number, 0..1)
- `model_info`
  - `name` (string)
  - `type` (string)
  - `uses_training_data` (boolean)
- `disclaimer` (string)
- `rationale_mode` (optional string)
  - `deterministic_only` or `llm_assisted`.

## Student-Level Fields

Stored in each `result.ai_features`:

- `risk_score` (number, 0..1)
- `risk_level` (`none` | `low` | `medium` | `high`)
- `top_reasons` (string[])
- `signals` (array)
  - each signal contains:
    - `kind` (string)
    - `weight` (number, contribution toward risk score)
    - `value` (number|string, optional)
    - `cohort_median` (number, optional)
    - `reason` (string)
- `metrics` (object)
  - debug/audit metrics used by deterministic signals.
- `llm_rationale` (optional object)
  - `summary` (string)
  - `caveats` (string[])
  - `model` (string)

## Example

```json
{
  "student_id": "42",
  "ai_features": {
    "risk_score": 0.58,
    "risk_level": "medium",
    "top_reasons": [
      "Comment density is an outlier compared to this assignment cohort.",
      "Average line length is an outlier for this cohort."
    ],
    "signals": [
      {
        "kind": "comment_density_outlier",
        "weight": 0.22,
        "value": 0.27,
        "cohort_median": 0.08,
        "reason": "Comment density is an outlier compared to this assignment cohort."
      }
    ],
    "metrics": {
      "code_lines": 240,
      "comment_ratio": 0.27
    }
  }
}
```
