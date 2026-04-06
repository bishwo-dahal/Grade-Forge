# Authorship triage → ML training

Instructor labels are stored in Grade-Forge and used to **train and improve our own AI authorship models**.

## University admin

### Label dataset (metadata only)

`GET /api/v1/university_admin/authorship-triage-training`

Lists every labeled submission with course, assignment, instructor, and student **metadata** (no source code). UI: **University admin → ML training data** (`/university-admin/training-data`).

### Current model file (optional)

`GET /api/v1/university_admin/authorship-model`

Streams the file at **`ml.authorship-model.path`** (env **`ML_AUTHORSHIP_MODEL_PATH`**) as an attachment. Returns **404** with a JSON `message` if the path is unset or the file is missing. Configure this once you ship a binary artifact (e.g. `.pt`, `.onnx`, `.pkl`).

**Faculty** cannot bulk-download labels; they set triage per submission in the grading UI.

## Live grader integration

The Python grader reads `authorship_triage` from `input.json` when present and applies bounded score deltas before clamping. See `grader.faculty-triage.*` and `GRADER_FACULTY_TRIAGE_*` in `Server/src/main/resources/application.properties`.

## Future work

- Training scripts that join labels to features for a new model version, then deploy the artifact path above.
- Version the model filename or add a manifest endpoint if needed.
