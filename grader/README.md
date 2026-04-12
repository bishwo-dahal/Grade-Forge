# Grader

Similarity and AI tool to grade student assignments

## Quick start

From the **grader/** directory:

```bash
pip install -r requirements.txt
python run.py
```

Change the default input by editing `DEFAULT_INPUT_FILE` in `run.py`, or pass a path: `python run.py test/sample_submissions2.json`. Pipe to a file if you need: `python run.py > out.json`.

## Backend / Docker invocation

When the backend runs the grader (e.g. for grader reports), it can pass the input file path so the pipeline reads the JSON it generated:

- **CLI:** `python run.py /path/to/input.json` (absolute or relative to grader dir)
- **Env:** `GRADER_INPUT_PATH=/path/to/input.json python run.py`

The script writes the full pipeline JSON to **stdout** and errors to **stderr**; exit code **0** on success, **1** on failure. The backend should run the script with working directory set to the grader directory (so `data_parser`, `pipeline`, `plagiarism` import correctly) and pass an absolute path to the input file, or a path relative to the grader dir.

For Docker: ensure the runtime image has Python 3 and the grader code (e.g. copy `grader/` into the image and install `requirements.txt`). The backend then invokes `python run.py <input_path>` where `<input_path>` is where it wrote the input JSON (e.g. in a temp or mounted volume). No database migrations are required for the grader script itself.

## Layout

| File | Role |
|------|------|
| **run.py** | Entry point. Sets input file, loads assignment, runs pipeline, prints JSON. |
| **pipeline.py** | Runs all steps (similarity, etc.) and merges results per student. |
| **ai_detection.py** | Deterministic AI authorship risk heuristics (explainable signals + reasons). |
| **llm_rationale.py** | Optional LLM explanation layer for signal summaries (never sets scores). |
| **data_parser.py** | Assignment / submission models; `from_json`, `from_file`. |
| **plagiarism.py** | Similarity step (copydetect). Produces scores and comparison snippets. |
| **evaluate_ai_detection.py** | Offline calibration script (precision/recall/FPR by language/course). |
| **test/** | Sample assignments and submissions. See `test/README.md`. |

---

## Output format

The pipeline returns a single JSON object. Use it to update grades in your DB and to drive the plagiarism UI (e.g. side-by-side diff).

### Top level

- **`assignment_id`** – Which assignment this run was for.
- **`results`** – One object per student. Each has grades, similarity info, and a **`comparisons`** array. Each comparison is attached only to the student who is the **subject** (the one whose code was tested, i.e. the “right” side in the pair). So a similarity between student A and B appears in exactly one report—the one for the student who was the subject in that comparison—not in both. That avoids duplicate pairs; the viewer shows “You” (subject) vs “Other”.
- **`highlight_markers`** – `{ "start": ">>", "end": "<<" }`. Code in comparisons uses these to mark copied regions so the frontend can highlight them.
- **`ai_features`** – Assignment-level AI metadata (`authorship_risk_summary`, `model_info`, `disclaimer`, `rationale_mode`).

### Per-student result

Every item in `results` looks like this:

| Field | Meaning |
|-------|--------|
| `student_id` | Your student identifier. |
| `final_grade` | Computed grade from test weights. |
| `similarity_score` | 0–1; how much of this submission matched others. |
| `similarity_warning` | If there was a match, a short message (e.g. path to the other file); otherwise `null`. |
| `ai_features` | Per-student AI risk object (`risk_score`, `risk_level`, `signals`, `top_reasons`, optional `llm_rationale`). |
| `comparisons` | List of pairs for this student. Each has `left` (you), `right` (other), and `overlap_tokens`. |

**Backend:** You can take each element of `results`, update the grade (and any flags) for that `student_id`, and persist that same object’s `comparisons` in one go (e.g. one row or document per student with a JSON column or related table for comparisons).

**Frontend:** For a given student, use `result.comparisons` to show side-by-side code. In each pair, **`left`** = you (current student), **`right`** = other. Each side has `student_id`, `file_path`, `code`, and `similarity`. The `code` strings may contain HTML `<span class='highlight-…'>` or `>>`/`<<` markers for matched regions.

---

## Full output sample

Below is a realistic payload for two students: one with no plagiarism, one with a single comparison pair. Code snippets use `>>` and `<<` so the UI can highlight the overlapping parts.

```json
{
  "assignment_id": "menu_assignment_01",
  "results": [
    {
      "student_id": "student_101",
      "final_grade": 92,
      "similarity_score": 0,
      "similarity_warning": null,
      "ai_features": {},
      "comparisons": []
    },
    {
      "student_id": "student_102",
      "final_grade": 88,
      "similarity_score": 0.67,
      "similarity_warning": "Match: /home/proj/grader/test/submissions1/student_101/main.py",
      "ai_features": {},
      "comparisons": [
        {
          "left": {
            "student_id": "student_101",
            "file_path": "/home/proj/grader/test/submissions1/student_101/main.py",
            "code": "def total_price(dessert, drink):\n  >>base = dessert + drink\n  tax = base * 0.08\n  return round(base + tax, 2)<<",
            "similarity": 0.65
          },
          "right": {
            "student_id": "student_102",
            "file_path": "/home/proj/grader/test/submissions1/student_102/main.py",
            "code": "def total_price(dessert, drink):\n  >>base = dessert + drink\n  tax = base * 0.08\n  return round(base + tax, 2)<<",
            "similarity": 0.67
          },
          "overlap_tokens": 24
        }
      ]
    }
  ],
  "highlight_markers": {
    "start": ">>",
    "end": "<<"
  },
  "ai_features": {}
}
```

To render a comparison: show `left.code` in one column and `right.code` in the other. Any substring between `>>` and `<<` is the matched region—style it with a background color so it matches your diff/similarity UI.

## Optional LLM rationale mode

Default mode is deterministic-only. To enable optional LLM explanations:

```bash
export GRADER_LLM_RATIONALE_ENABLED=true
export GRADER_LLM_RATIONALE_MODEL=llama3
export GRADER_LLM_RATIONALE_URL=http://localhost:11434/api/generate
python run.py test/sample_submissions1.json
```

LLM mode only writes explanation text under `result.ai_features.llm_rationale` and does not alter `risk_score`.

## Offline calibration

Run calibration with labeled outcomes:

```bash
python evaluate_ai_detection.py test/ai_labels_sample.json
```

This prints selected threshold plus confusion/precision/recall/FPR overall and by language/course.
