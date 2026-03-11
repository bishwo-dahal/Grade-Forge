#!/usr/bin/env python3
"""
Run the grader pipeline.

Input file can be set by:
  1. First CLI argument:  python run.py /path/to/input.json
  2. Environment GRADER_INPUT_PATH:  GRADER_INPUT_PATH=/path/to/input.json python run.py
  3. Default (dev):  test/sample_submissions1.json

Output: full pipeline JSON to stdout. Errors to stderr; exit code 1 on failure.
"""
import json
import os
import sys

GRADER_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(GRADER_DIR)
if GRADER_DIR not in sys.path:
    sys.path.insert(0, GRADER_DIR)

# Default for local dev (no arg, no env)
DEFAULT_INPUT_FILE = "test/sample_submissions1.json"


def _resolve_input_path() -> str:
    """Resolve input path: CLI arg > env GRADER_INPUT_PATH > default. Relative paths are relative to GRADER_DIR."""
    raw = None
    if len(sys.argv) >= 2 and sys.argv[1].strip():
        raw = sys.argv[1].strip()
    elif os.environ.get("GRADER_INPUT_PATH", "").strip():
        raw = os.environ.get("GRADER_INPUT_PATH", "").strip()
    else:
        raw = DEFAULT_INPUT_FILE

    if os.path.isabs(raw):
        return raw
    return os.path.normpath(os.path.join(GRADER_DIR, raw))


def main() -> int:
    input_path = _resolve_input_path()
    if not os.path.isfile(input_path):
        print(f"Grader input file not found: {input_path}", file=sys.stderr)
        return 1

    try:
        from data_parser import Assignment
        from pipeline import run_pipeline

        assignment = Assignment.from_file(input_path)
        result = run_pipeline(assignment)
        print(json.dumps(result, indent=2))
        return 0
    except Exception as e:
        print(f"Grader pipeline failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
