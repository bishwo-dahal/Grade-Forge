#!/usr/bin/env python3
"""Run the grader pipeline. Change INPUT_FILE to use the other assignment."""
import json
import os
import sys

GRADER_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(GRADER_DIR)
if GRADER_DIR not in sys.path:
    sys.path.insert(0, GRADER_DIR)

# Change this to run a different assignment:
#   test/sample_submissions1.json  (Python)
#   test/sample_submissions2.json  (Java TSP)
INPUT_FILE = "test/sample_submissions1.json"

from data_parser import Assignment
from pipeline import run_pipeline

path = os.path.join(GRADER_DIR, INPUT_FILE)
assignment = Assignment.from_file(path)
result = run_pipeline(assignment)
print(json.dumps(result, indent=2))
