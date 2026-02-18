# Grader

Similarity and AI tool to grade student assignments

## Quick start

From the **grader/** directory:

```bash
pip install -r requirements.txt
python run.py
```

Change `INPUT_FILE` at the top of `run.py` to point at another assignment (e.g. `test/sample_submissions2.json` for the Java TSP assignment). Pipe to a file if you need: `python run.py > out.json`.

## Layout

| File | Role |
|------|------|
| **run.py** | Entry point. Sets input file, loads assignment, runs pipeline, prints JSON. |
| **pipeline.py** | Runs all steps (similarity, etc.) and merges results per student. |
| **data_parser.py** | Assignment / submission models; `from_json`, `from_file`. |
| **plagiarism.py** | Similarity step (copydetect). Produces scores and comparison snippets. |
| **test/** | Sample assignments and submissions. See `test/README.md`. |

---

## Output format

The pipeline returns a single JSON object. Use it to update grades in your DB and to drive the plagiarism UI (e.g. side-by-side diff).

### Top level

- **`assignment_id`** – Which assignment this run was for.
- **`results`** – One object per student. Each has grades, similarity info, and a **`comparisons`** array. Each comparison is attached only to the student who is the **subject** (the one whose code was tested, i.e. the “right” side in the pair). So a similarity between student A and B appears in exactly one report—the one for the student who was the subject in that comparison—not in both. That avoids duplicate pairs; the viewer shows “You” (subject) vs “Other”.
- **`highlight_markers`** – `{ "start": ">>", "end": "<<" }`. Code in comparisons uses these to mark copied regions so the frontend can highlight them.

### Per-student result

Every item in `results` looks like this:

| Field | Meaning |
|-------|--------|
| `student_id` | Your student identifier. |
| `final_grade` | Computed grade from test weights. |
| `similarity_score` | 0–1; how much of this submission matched others. |
| `similarity_warning` | If there was a match, a short message (e.g. path to the other file); otherwise `null`. |
| `ai_flag` | Reserved for future AI-generated detection; `null` for now. |
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
      "ai_flag": null,
      "comparisons": []
    },
    {
      "student_id": "student_102",
      "final_grade": 88,
      "similarity_score": 0.67,
      "similarity_warning": "Match: /home/proj/grader/test/submissions1/student_101/main.py",
      "ai_flag": null,
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
  }
}
```

To render a comparison: show `left.code` in one column and `right.code` in the other. Any substring between `>>` and `<<` is the matched region—style it with a background color so it matches your diff/similarity UI.
