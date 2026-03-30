import json
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class TestResults:
    public_pass: int
    private_pass: int

@dataclass
class Submission:
    student_id: str
    student_name: str | None
    file_paths: List[str]  # Changed to list to support multi-file
    test_results: TestResults
    
    # This helper calculates the final grade based on weights
    def calculate_score(self, weights: Dict[str, float], total_pub: int, total_priv: int) -> float:
        pub_score = (self.test_results.public_pass / total_pub) * weights['public']
        priv_score = (self.test_results.private_pass / total_priv) * weights['private']
        return round((pub_score + priv_score) * 100, 2)

@dataclass
class Assignment:
    assignment_id: str
    public_tests: int
    private_tests: int
    language: str
    weights: Dict[str, float]
    submissions: List[Submission] = field(default_factory=list)

    @classmethod
    def from_json(cls, data: dict):
        """Create an Assignment from a dictionary (e.g. parsed JSON)."""
        subs = [
            Submission(
                student_id=s['student_id'],
                student_name=s.get('student_name'),
                file_paths=[s['file_path']] if isinstance(s.get('file_path'), str) else (s.get('file_path') or s.get('file_paths') or []),
                test_results=TestResults(**s['test_results'])
            ) for s in data['submissions']
        ]
        return cls(
            assignment_id=data['assignment_id'],
            public_tests=data['public_tests'],
            private_tests=data['private_tests'],
            language=data['language'],
            weights=data['weights'],
            submissions=subs
        )

    @classmethod
    def from_file(cls, path: str):
        """Load an Assignment from a JSON file path (relative to cwd or absolute)."""
        with open(path) as f:
            return cls.from_json(json.load(f))