import type {
  ClassSubmissionItem,
  FacultyAssignmentSubmissionRow,
  PendingSubmissionItem,
  SubmissionFileItem,
  SubmissionConsoleData,
  SubmissionDetail,
  SubmissionSummary,
} from "../types/submission";
import api from "../api/axios";

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

interface AssignmentApiResponse {
  id: number;
  courseId: number;
  name: string;
}

interface FacultySubmissionApiResponse {
  id: number;
  assignmentId: number;
  assignmentName: string;
  studentName: string;
  submittedAt: string;
  marks: number | null;
  files: SubmissionFileApiResponse[] | null;
}

interface SubmissionFileApiResponse {
  id: number;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  downloadUrl: string | null;
}

function formatSubmissionDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseAssignmentId(rawAssignmentId: string): number {
  const parsedAssignmentId = Number(rawAssignmentId.trim());
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }
  return parsedAssignmentId;
}

function normalizeUploadFileType(file: File): File {
  if (file.type) {
    return file;
  }

  const lowerFileName = file.name.toLowerCase();
  const fallbackType = lowerFileName.endsWith(".java")
    ? "text/x-java-source"
    : lowerFileName.endsWith(".py")
      ? "text/x-python"
      : "application/octet-stream";
  // FIX: Backend validation requires fileType, so we provide a safe fallback MIME when browser omits it.
  return new File([file], file.name, { type: fallbackType });
}

function mapSubmissionFiles(files: SubmissionFileApiResponse[] | null | undefined): SubmissionFileItem[] {
  if (!files?.length) {
    return [];
  }

  return files.map((file, index) => ({
    // FIX: Keep file row keys stable in UI even when backend ids are temporarily missing.
    id: Number.isFinite(file.id) ? String(file.id) : `file-${index}`,
    fileName: file.fileName || "uploaded-file",
    fileType: file.fileType ?? null,
    fileSize: typeof file.fileSize === "number" ? file.fileSize : null,
    downloadUrl: file.downloadUrl ?? null,
  }));
}

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

export async function submitStudentAssignmentFile(assignmentId: string, file: File): Promise<void> {
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".py") && !fileName.endsWith(".java")) {
    throw new Error("Only .py or .java files are allowed.");
  }

  const formData = new FormData();
  const normalizedUploadFile = normalizeUploadFileType(file);
  // NOTE: Backend submission endpoint expects multipart files under `files`.
  formData.append("files", normalizedUploadFile, normalizedUploadFile.name);
  await api.post(`/api/v1/student/submissions?assignmentId=${parsedAssignmentId}`, formData);
}

export async function listClassSubmissions(classId: string): Promise<ClassSubmissionItem[]> {
  const parsedClassId = Number(classId);
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    throw new Error("Invalid class id.");
  }

  // NOTE: Faculty submissions table now aggregates real submissions for all assignments in the selected class.
  const { data: assignments } = await api.get<AssignmentApiResponse[]>(
    `/api/v1/faculty/assignments/course/${parsedClassId}`,
  );

  const submissionGroups = await Promise.all(
    assignments.map(async (assignment) => {
      const { data } = await api.get<FacultySubmissionApiResponse[]>(
        `/api/v1/faculty/submissions?assignmentId=${assignment.id}`,
      );
      return data;
    }),
  );

  return submissionGroups
    .flat()
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    .map((submission) => {
      const mappedFiles = mapSubmissionFiles(submission.files);
      const primaryFile = mappedFiles[0] ?? null;
      return {
        id: String(submission.id),
        student: submission.studentName,
        assignment: submission.assignmentName,
        submittedAt: formatSubmissionDate(submission.submittedAt),
        status: submission.marks === null ? "ungraded" : "graded",
        score: submission.marks ?? undefined,
        files: mappedFiles,
        primaryFileName: primaryFile?.fileName ?? null,
        additionalFileCount: Math.max(0, mappedFiles.length - 1),
        primaryDownloadUrl: primaryFile?.downloadUrl ?? null,
      } satisfies ClassSubmissionItem;
    });
}

export async function listFacultyAssignmentSubmissionFiles(
  assignmentId: string,
): Promise<FacultyAssignmentSubmissionRow[]> {
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const { data } = await api.get<FacultySubmissionApiResponse[]>(
    `/api/v1/faculty/submissions?assignmentId=${parsedAssignmentId}`,
  );

  // NOTE: Faculty results tab requires full file lists per submission for direct downloads.
  return data
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    .map((submission) => ({
      submissionId: String(submission.id),
      studentName: submission.studentName,
      submittedAt: formatSubmissionDate(submission.submittedAt),
      files: mapSubmissionFiles(submission.files),
    }));
}

export function listPendingSubmissions(): Promise<PendingSubmissionItem[]> {
  return Promise.resolve(pendingSubmissions);
}
