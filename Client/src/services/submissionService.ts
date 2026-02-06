import type {
  ClassSubmissionItem,
  PendingSubmissionItem,
  SubmissionConsoleData,
  SubmissionDetail,
  SubmissionSummary,
} from "../types/submission";

// NOTE: Centralized mock submission data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const submissionDetail: SubmissionDetail = {
  id: "sub-001",
  studentName: "Emma Rodriguez",
  studentId: "emma.rodriguez@university.edu",
  submittedAt: "October 24, 2023 at 11:42 PM",
  isLate: false,
  daysLate: 0,
  language: "Python",
  attemptNumber: 2,
  status: "auto-graded",
  autoScore: 85,
  manualScore: null,
  totalPoints: 100,
  code: `class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        """Insert a value into the BST"""
        if not self.root:
            self.root = TreeNode(value)
        else:
            self._insert_recursive(self.root, value)
    
    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = TreeNode(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = TreeNode(value)
            else:
                self._insert_recursive(node.right, value)
    
    def search(self, value):
        """Search for a value in the BST"""
        return self._search_recursive(self.root, value)
    
    def _search_recursive(self, node, value):
        if node is None:
            return False
        if node.value == value:
            return True
        elif value < node.value:
            return self._search_recursive(node.left, value)
        else:
            return self._search_recursive(node.right, value)`,
  publicTestResults: [
    {
      name: "Basic Insert and In-order Traversal",
      passed: true,
      input: "[50, 30, 70, 20, 40]",
      expected: "[20, 30, 40, 50, 70]",
      actual: "[20, 30, 40, 50, 70]",
    },
    {
      name: "Search Existing Node",
      passed: true,
      input: "search(30)",
      expected: "True",
      actual: "True",
    },
    {
      name: "Delete Node with Two Children",
      passed: false,
      input: "delete(30)",
      expected: "[20, 40, 50, 70]",
      actual: "[20, 30, 50, 70]",
    },
    {
      name: "Pre-order Traversal",
      passed: true,
      input: "preorder()",
      expected: "[50, 30, 20, 40, 70]",
      actual: "[50, 30, 20, 40, 70]",
    },
    {
      name: "Search Non-existing Node",
      passed: true,
      input: "search(100)",
      expected: "False",
      actual: "False",
    },
  ],
  privateTestResults: {
    passed: 8,
    total: 10,
  },
  rubric: [
    {
      id: "r1",
      category: "Logic & Correctness",
      description: "Correct implementation of BST operations",
      maxPoints: 40,
      autoPoints: 32,
      manualPoints: null,
      feedback: "",
    },
    {
      id: "r2",
      category: "Performance & Optimization",
      description: "Efficient algorithms with proper time complexity",
      maxPoints: 40,
      autoPoints: 38,
      manualPoints: null,
      feedback: "",
    },
    {
      id: "r3",
      category: "Documentation",
      description: "Clear comments and docstrings",
      maxPoints: 20,
      autoPoints: 15,
      manualPoints: null,
      feedback: "",
    },
  ],
  instructorFeedback: "",
  similarityScore: 12,
  aiLikelihood: 8,
};

const allSubmissions: SubmissionSummary[] = [
  { id: "sub-001", studentName: "Emma Rodriguez", status: "auto-graded", score: 85 },
  { id: "sub-002", studentName: "James Chen", status: "finalized", score: 92 },
  { id: "sub-003", studentName: "Sofia Martinez", status: "not-graded", score: null },
  { id: "sub-004", studentName: "Michael Brown", status: "manually-adjusted", score: 78 },
];

const classSubmissions: ClassSubmissionItem[] = [
  {
    id: "sub-1",
    student: "Alex Thompson",
    assignment: "Assignment 8: BST Implementation",
    submittedAt: "Oct 23, 2023 10:45 PM",
    status: "ungraded",
  },
  {
    id: "sub-2",
    student: "Morgan Davis",
    assignment: "Assignment 8: BST Implementation",
    submittedAt: "Oct 23, 2023 8:20 PM",
    status: "ungraded",
  },
  {
    id: "sub-3",
    student: "Jamie Park",
    assignment: "Assignment 7: Hash Table",
    submittedAt: "Oct 17, 2023 11:30 PM",
    status: "graded",
    score: 88,
  },
];

const pendingSubmissions: PendingSubmissionItem[] = [
  {
    id: "sub-001",
    assignmentId: "a1",
    studentName: "Emma Rodriguez",
    assignmentTitle: "Binary Search Tree",
    courseCode: "CS 301",
  },
  {
    id: "sub-002",
    assignmentId: "a2",
    studentName: "James Chen",
    assignmentTitle: "REST API Design",
    courseCode: "CS 402",
  },
  {
    id: "sub-003",
    assignmentId: "a3",
    studentName: "Sofia Martinez",
    assignmentTitle: "Introduction to Python",
    courseCode: "CS 101",
  },
];

// NOTE: Added console output bundle so grading panels can pull from a single service.
// NOTE: Use Unicode escapes for console symbols to avoid mojibake in non-UTF8 environments.
const submissionConsoleData: SubmissionConsoleData = {
  output: `Running public tests...

Test 1: Basic Insert and In-order Traversal - PASSED \u2713
Test 2: Search Existing Node - PASSED \u2713
Test 3: Delete Node with Two Children - FAILED \u2715
  Expected: [20, 40, 50, 70]
  Got: [20, 30, 50, 70]
Test 4: Pre-order Traversal - PASSED \u2713
Test 5: Search Non-existing Node - PASSED \u2713

4/5 public tests passed
8/10 private tests passed

Total Score: 85/100`,
  errors: `Test 3: Delete Node with Two Children
  AttributeError: 'NoneType' object has no attribute 'value'
  at line 45 in _delete_recursive()`,
  executionLog: `[2023-10-24 23:42:15] Submission received
[2023-10-24 23:42:16] Code compilation successful
[2023-10-24 23:42:17] Running public tests...
[2023-10-24 23:42:18] Public tests completed: 4/5 passed
[2023-10-24 23:42:19] Running private tests...
[2023-10-24 23:42:21] Private tests completed: 8/10 passed
[2023-10-24 23:42:21] Auto-grading complete: 85/100`,
};

export function getSubmissionDetailById(submissionId: string): Promise<SubmissionDetail> {
  // NOTE: submissionId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...submissionDetail, id: submissionId });
}

export function getSubmissionConsoleData(submissionId: string): Promise<SubmissionConsoleData> {
  // NOTE: submissionId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(submissionConsoleData);
}

export function listSubmissionsForAssignment(assignmentId: string): Promise<SubmissionSummary[]> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(allSubmissions);
}

export function listClassSubmissions(classId: string): Promise<ClassSubmissionItem[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classSubmissions);
}

export function listPendingSubmissions(): Promise<PendingSubmissionItem[]> {
  return Promise.resolve(pendingSubmissions);
}
