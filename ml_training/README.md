# Authorship triage → ML training

Instructor labels are stored in Grade-Forge and used to **train and improve our own AI authorship models**.

## Train from the app (university admin)

Training is **asynchronous** so the UI can show progress.

1. **POST** `/api/v1/university_admin/run-authorship-training/start` → `202 Accepted` with `{ "runId": "<uuid>" }` (or **409** if a run is already in progress).
2. **GET** `/api/v1/university_admin/run-authorship-training/status/{runId}` → `{ "state": "RUNNING" | "SUCCEEDED" | "FAILED", "phase": "…", … }` until finished.

The server then:

- Loads all triage labels.
- For each assignment, reads the **latest completed** Plagiarism & AI report and pulls per-student features (`risk_score`, `similarity_score`, heuristic metrics, LLM likeness when present).
- Matches students to labeled submissions, writes temp JSON, runs **`train_authorship.py`** with the same Python as the grader (`grader.python-cmd`, usually the grader venv).
- Writes **`joblib`** to **`ml.authorship-model.path`**.

**Defaults:** `~/.grade-forge/authorship-model.joblib` when running locally; Docker image sets **`ML_AUTHORSHIP_MODEL_PATH=/app/authorship-model.joblib`**. Override with env if you want another path. Parent dirs are created on first train.

Requirements:

- At least **10** labeled submissions that still have a matching row in that assignment’s latest completed report.
- Server has **`pip install -r ml_training/requirements-train.txt`** (Dockerfile does this in the grader venv).

UI: **University admin → ML training data → Train model**.

The **Plagiarism & AI grader** loads that joblib when **`ml.authorship-model.path`** points to an existing file (same path as training output): it builds the same numeric feature row and applies **`weight × (P(AI-assisted) − P(human-written))`** to the risk score (default weight **`grader.authorship-ml.weight` / `GRADER_AUTHORSHIP_ML_WEIGHT` = 0.12**). Set **`GRADER_AUTHORSHIP_ML_ENABLED=false`** to disable inference without moving the file.

## University admin (read-only list)

`GET /api/v1/university_admin/authorship-triage-training` — metadata table in the UI.

`GET /api/v1/university_admin/authorship-model` — download the configured model file when it exists (same path as training output).

## Offline scripts (same math as the server)

| Script | Purpose |
|--------|---------|
| `fetch_labels.py` | Pull labels with a JWT (stdlib). |
| `train_authorship.py` | Train from your own `labels.json` + `features.json`. |

```bash
pip install -r requirements-train.txt
export GRADE_FORGE_TOKEN='…'
python fetch_labels.py --out labels_snapshot.json
python train_authorship.py --labels labels_snapshot.json --features features.json --out model.joblib
```

## Live grader integration

The Python grader reads `authorship_triage` from `input.json` when present and applies bounded score deltas before clamping. See `grader.faculty-triage.*` and `GRADER_FACULTY_TRIAGE_*` in `Server/src/main/resources/application.properties`.

## Future work

- Load `joblib` inside `grader/` behind a feature flag for inference.
- Async training job + progress UI if runs exceed HTTP timeouts.
