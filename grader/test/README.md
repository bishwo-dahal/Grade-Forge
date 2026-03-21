# Grader test (dev environment data)

All data required for the dev environment. Production will use the same folder structure.

## Layout

- **submissions1/** – Python (dessert & drink menu): student_101, 102, 103.
- **submissions2/** – Java TSP: student_201, 202, 203 (intentionally similar for plagiarism testing).
- **sample_submissions1.json** – Python assignment (dessert & drink menu). Spec: `ASSIGNMENT_MENU.md`.
- **sample_submissions2.json** – Java TSP final project.
- **run.py** – (in grader/) Runs similarity check; see Run below.
- **requirements.txt** – Minimal deps: `copydetect`.

## TSP assignment (Hamiltonian TSP)

Final project: best-first branch-and-bound TSP; input = adjacency matrix CSV (file chooser); output = tour sequence and total cost. Priority: lower bound first; tie-break by longer path.


## Run

From **grader/** (or project root with `python grader/run.py`):

```bash
pip install -r test/requirements.txt
python run.py                   # Python (submissions1 / sample_submissions1)
python run.py 2                 # Java TSP (submissions2 / sample_submissions2)
```
