import type {
  AssignmentCreateFormData,
  AssignmentCreateOption,
  AssignmentDescription,
  AssignmentDetail,
  AssignmentSummary,
  EditorCodeExamples,
  FacultyAssignmentCreatePageData,
  FacultyAssignmentCreatePageHeader,
  GradingAssignmentContext,
  RecentAssignmentItem,
  StudentAssignmentListItem,
  UpcomingAssignment,
} from "../types/assignment";
import type { RubricCategory } from "../types/grade";
import type { PublicTestCase } from "../types/submission";
import api from "../api/axios";

// NOTE: This service keeps assignment data access centralized for both live API endpoints and remaining mock-only views.
// TODO(backend): Migrate remaining mock-only helper sections to backend endpoints while keeping return shapes stable.

const assignmentDetail: AssignmentDetail = {
  id: "assignment-8",
  title: "Binary Search Tree Implementation",
  course: "Data Structures & Algorithms",
  courseCode: "CS 301",
  dueDate: "October 24, 2023 at 11:59 PM",
  status: "not_submitted",
  points: { earned: null, total: 100 },
  submissionsUsed: 2,
  submissionsAllowed: null,
  language: "Python",
  hasStarterCode: true,
};

// NOTE: Added grading header context for faculty workflows.
const gradingAssignmentContext: GradingAssignmentContext = {
  id: "assignment-8",
  title: "Binary Search Tree Implementation",
  courseName: "CS 341: Data Structures",
  section: "Section 02",
};

const upcomingAssignments: UpcomingAssignment[] = [
  {
    id: 1,
    title: "Binary Search Tree Implementation",
    course: "Data Structures & Algorithms \u2022 Assignment 8",
    dueDate: "Oct 24, 2023",
    daysLeft: "Due in 2 days",
    urgent: true,
    icon: "\u{1F4BB}",
    iconBg: "bg-[#FEB05D]/10",
  },
  {
    id: 2,
    title: "REST API with Authentication",
    course: "Web Development \u2022 Assignment 5",
    dueDate: "Oct 28, 2023",
    daysLeft: "Due in 6 days",
    urgent: false,
    icon: "\u{1F310}",
    iconBg: "bg-[#5A7ACD]/10",
  },
  {
    // NOTE: Added third row to match current dashboard preview layout expectations.
    id: 3,
    title: "Database Schema Design",
    course: "Database Systems \u2022 Assignment 4",
    dueDate: "Nov 2, 2023",
    daysLeft: "Due in 11 days",
    urgent: false,
    icon: "\u{1F5C4}\uFE0F",
    iconBg: "bg-[#5A7ACD]/10",
  },
];

const courseAssignments: AssignmentSummary[] = [
  {
    id: 1,
    title: "Binary Search Tree Implementation",
    number: 8,
    dueDate: "Oct 24, 2023",
    status: "not_submitted",
    points: 100,
  },
  {
    id: 2,
    title: "Graph Traversal Algorithms",
    number: 9,
    dueDate: "Oct 31, 2023",
    status: "not_submitted",
    points: 100,
  },
  {
    id: 3,
    title: "Dynamic Programming - Knapsack",
    number: 7,
    dueDate: "Oct 17, 2023",
    status: "graded",
    points: 95,
    totalPoints: 100,
  },
];

const recentAssignments: RecentAssignmentItem[] = [
  {
    name: "Binary Search Trees",
    className: "CS 201",
    dueDate: "Feb 6, 2026",
    status: "pending",
    statusColor: "text-orange-500",
    statusBg: "bg-orange-100",
    iconKey: "clock",
  },
  {
    name: "React Router Implementation",
    className: "CS 340",
    dueDate: "Feb 8, 2026",
    status: "in progress",
    statusColor: "text-purple-600",
    statusBg: "bg-[#E0DBFF]",
    iconKey: "circle",
  },
  {
    name: "SQL Query Optimization",
    className: "CS 370",
    dueDate: "Feb 10, 2026",
    status: "pending",
    statusColor: "text-orange-500",
    statusBg: "bg-orange-100",
    iconKey: "clock",
  },
  {
    name: "Algorithm Analysis",
    className: "CS 301",
    dueDate: "Feb 2, 2026",
    status: "completed",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
    iconKey: "check",
  },
  {
    name: "UML Diagrams",
    className: "CS 410",
    dueDate: "Feb 1, 2026",
    status: "completed",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
    iconKey: "check",
  },
];

const assignmentDescription: AssignmentDescription = {
  problemDescription: [
    "In this assignment, you will implement a Binary Search Tree (BST) data structure with all fundamental operations. Your implementation should support insertion, deletion, searching, and tree traversal methods.",
    "A Binary Search Tree is a node-based binary tree data structure with the following properties:",
  ],
  requiredMethods: [
    { name: "insert(value)", description: "Insert a new node with the given value" },
    { name: "delete(value)", description: "Remove a node with the given value" },
    { name: "search(value)", description: "Find and return a node with the given value" },
    { name: "inorder()", description: "Return in-order traversal as an array" },
    { name: "preorder()", description: "Return pre-order traversal as an array" },
    { name: "postorder()", description: "Return post-order traversal as an array" },
  ],
  exampleCode: `bst = BinarySearchTree()
bst.insert(50)
bst.insert(30)
bst.insert(70)
bst.insert(20)
bst.insert(40)

print(bst.inorder())   # Output: [20, 30, 40, 50, 70]
print(bst.search(30))  # Output: TreeNode(30)
bst.delete(30)
print(bst.inorder())   # Output: [20, 40, 50, 70]`,
  inputOutput: {
    input: "Integer values ranging from -10,000 to 10,000",
    output:
      "Traversal methods should return arrays of integers in the correct order. Search should return the node or null if not found.",
  },
  rubric: [
    { category: "Correctness", description: "All test cases pass", points: "60 pts" },
    { category: "Code Quality", description: "Clean, readable, well-structured", points: "20 pts" },
    { category: "Efficiency", description: "Optimal time complexity", points: "15 pts" },
    { category: "Documentation", description: "Comments and docstrings", points: "5 pts" },
  ],
  constraints: [
    "You must implement the BST from scratch (no built-in tree libraries)",
    "Your solution should handle edge cases (empty tree, single node, etc.)",
    "Time limit: 2 seconds per test case",
    "Memory limit: 256 MB",
  ],
};

const rubricCategories: RubricCategory[] = [
  {
    name: "Correctness",
    points: 50,
    criteria: [
      { description: "All test cases pass", points: 20 },
      { description: "Edge cases handled correctly", points: 15 },
      { description: "Correct algorithm implementation", points: 15 },
    ],
  },
  {
    name: "Code Quality",
    points: 25,
    criteria: [
      { description: "Clean, readable code with proper naming conventions", points: 10 },
      { description: "Appropriate use of data structures", points: 10 },
      { description: "No unnecessary code or redundancy", points: 5 },
    ],
  },
  {
    name: "Efficiency",
    points: 15,
    criteria: [
      { description: "Time complexity meets requirements (O(log n) for search)", points: 10 },
      { description: "Space complexity is optimal", points: 5 },
    ],
  },
  {
    name: "Documentation",
    points: 10,
    criteria: [
      { description: "Functions have clear docstrings/comments", points: 5 },
      { description: "Complex logic is explained", points: 3 },
      { description: "Proper file header with name and date", points: 2 },
    ],
  },
];

const publicTestCases: PublicTestCase[] = [
  {
    id: 1,
    name: "Basic Insert and In-order Traversal",
    passed: true,
    input: "insert(50), insert(30), insert(70), inorder()",
    expectedOutput: "[30, 50, 70]",
    actualOutput: "[30, 50, 70]",
    executionTime: "0.002s",
  },
  {
    id: 2,
    name: "Search Existing Node",
    passed: true,
    input: "insert(50), insert(30), search(30)",
    expectedOutput: "TreeNode(30)",
    actualOutput: "TreeNode(30)",
    executionTime: "0.001s",
  },
  {
    id: 3,
    name: "Delete Node with Two Children",
    passed: false,
    input: "insert(50), insert(30), insert(70), insert(20), insert(40), delete(30)",
    expectedOutput: "[20, 40, 50, 70]",
    actualOutput: "[20, 30, 50, 70]",
    executionTime: "0.003s",
  },
  {
    id: 4,
    name: "Pre-order Traversal",
    passed: true,
    input: "insert(50), insert(30), insert(70), preorder()",
    expectedOutput: "[50, 30, 70]",
    actualOutput: "[50, 30, 70]",
    executionTime: "0.002s",
  },
  {
    id: 5,
    name: "Search Non-existing Node",
    passed: true,
    input: "insert(50), search(99)",
    expectedOutput: "null",
    actualOutput: "null",
    executionTime: "0.001s",
  },
];

const editorCodeExamples: EditorCodeExamples = {
  Python: `class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        """Insert a new node with the given value"""
        if self.root is None:
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
        """Find and return a node with the given value"""
        return self._search_recursive(self.root, value)
    
    def _search_recursive(self, node, value):
        if node is None or node.value == value:
            return node
        if value < node.value:
            return self._search_recursive(node.left, value)
        return self._search_recursive(node.right, value)
    
    def delete(self, value):
        """Remove a node with the given value"""
        # TODO: Implement delete operation
        pass
    
    def inorder(self):
        """Return in-order traversal as an array"""
        result = []
        self._inorder_recursive(self.root, result)
        return result
    
    def _inorder_recursive(self, node, result):
        if node:
            self._inorder_recursive(node.left, result)
            result.append(node.value)
            self._inorder_recursive(node.right, result)`,
  Java: `public class TreeNode {
    int value;
    TreeNode left;
    TreeNode right;
    
    public TreeNode(int value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

public class BinarySearchTree {
    private TreeNode root;
    
    public BinarySearchTree() {
        this.root = null;
    }
    
    public void insert(int value) {
        // Insert implementation
        if (root == null) {
            root = new TreeNode(value);
        } else {
            insertRecursive(root, value);
        }
    }
    
    private void insertRecursive(TreeNode node, int value) {
        if (value < node.value) {
            if (node.left == null) {
                node.left = new TreeNode(value);
            } else {
                insertRecursive(node.left, value);
            }
        } else {
            if (node.right == null) {
                node.right = new TreeNode(value);
            } else {
                insertRecursive(node.right, value);
            }
        }
    }
    
    // TODO: Implement other methods
}`,
};

const defaultCreateAssignmentHeader: FacultyAssignmentCreatePageHeader = {
  classId: "1",
  courseCode: "CS 2400",
  courseName: "Data Structures & Algorithms",
};

const defaultCreateAssignmentForm: AssignmentCreateFormData = {
  title: "",
  description: "",
  dueDate: "",
  dueTime: "23:59",
  languageId: "",
  totalPoints: 100,
};

interface AssignmentApiResponse {
  id: number;
  courseId: number;
  courseName: string;
  languageId: number;
  languageName: string;
  name: string;
  description: string | null;
  totalPoints: number;
  submissionType: string;
  starterCodeUrl: string | null;
  availableFrom: string | null;
  dueDate: string | null;
  lateDueDate: string | null;
}

interface SubmissionApiResponse {
  id: number;
  assignmentId: number;
  marks: number | null;
  submittedAt: string;
}

interface StudentEnrolledCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
}

interface FacultyCourseHeaderApiResponse {
  id: number;
  name: string;
  courseCode: string;
}

interface ProgrammingLanguageApiResponse {
  id: number;
  name: string;
  isActive: boolean;
}

interface StudentAssignmentWorkspaceSource {
  course: StudentEnrolledCourseApiResponse;
  assignment: AssignmentApiResponse;
  submissions: SubmissionApiResponse[];
}

const studentAssignmentWorkspaceCache = new Map<string, Promise<StudentAssignmentWorkspaceSource>>();

function formatDate(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No due date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDueDateTime(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No due date";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveAssignmentIcon(courseCode: string): { icon: string; iconBg: string } {
  const normalizedCode = courseCode.toUpperCase();
  if (normalizedCode.includes("WEB")) {
    return { icon: "\u{1F310}", iconBg: "bg-[#FEB05D]/10" };
  }
  if (normalizedCode.includes("DB")) {
    return { icon: "\u{1F5C4}\uFE0F", iconBg: "bg-[#FEB05D]/10" };
  }
  return { icon: "\u{1F4BB}", iconBg: "bg-[#5A7ACD]/10" };
}

function resolveStudentAssignmentStatus(
  dueDate: string | null,
  hasSubmission: boolean,
  isGraded: boolean,
): StudentAssignmentListItem["status"] {
  if (isGraded) {
    return "completed";
  }
  if (hasSubmission) {
    return "active";
  }

  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN;
  if (Number.isFinite(dueTimestamp) && dueTimestamp < Date.now()) {
    return "overdue";
  }
  return "upcoming";
}

function parseClassId(rawClassId: string): number {
  const parsedClassId = Number(rawClassId.trim());
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    throw new Error("Invalid class id.");
  }
  return parsedClassId;
}

function parseAssignmentId(rawAssignmentId: string): number {
  const parsedAssignmentId = Number(rawAssignmentId.trim());
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }
  return parsedAssignmentId;
}

function getLatestSubmission(submissions: SubmissionApiResponse[]): SubmissionApiResponse | undefined {
  return [...submissions].sort((left, right) => {
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  })[0];
}

function mapAssignmentDetailStatus(
  dueDate: string | null,
  submissions: SubmissionApiResponse[],
): AssignmentDetail["status"] {
  const latestSubmission = getLatestSubmission(submissions);
  if (latestSubmission?.marks !== null && latestSubmission?.marks !== undefined) {
    return "graded";
  }
  if (submissions.length > 0) {
    return "submitted";
  }

  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN;
  if (Number.isFinite(dueTimestamp) && dueTimestamp < Date.now()) {
    return "late";
  }
  return "not_submitted";
}

async function loadStudentAssignmentWorkspaceSource(assignmentId: string): Promise<StudentAssignmentWorkspaceSource> {
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const cacheKey = String(parsedAssignmentId);
  const cachedPromise = studentAssignmentWorkspaceCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loaderPromise = (async () => {
    // NOTE: Student assignment route only provides assignmentId, so we resolve course ownership from enrolled classes.
    const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");

    const assignmentsByCourse = await Promise.all(
      enrolledCourses.map(async (course) => {
        const { data: assignments } = await api.get<AssignmentApiResponse[]>(`/api/v1/student/assignments/course/${course.id}`);
        return { course, assignments };
      }),
    );

    for (const group of assignmentsByCourse) {
      const matchedAssignment = group.assignments.find((assignment) => assignment.id === parsedAssignmentId);
      if (!matchedAssignment) {
        continue;
      }

      const { data: submissions } = await api.get<SubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${parsedAssignmentId}`,
      );

      return {
        course: group.course,
        assignment: matchedAssignment,
        submissions,
      } satisfies StudentAssignmentWorkspaceSource;
    }

    throw new Error("Assignment not found.");
  })();

  studentAssignmentWorkspaceCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}

function buildDueDateTimePayload(dateValue: string, timeValue: string): string {
  // NOTE: Backend expects LocalDateTime for dueDate; keep `YYYY-MM-DDTHH:mm:ss` shape stable.
  const dueDateTime = `${dateValue}T${timeValue}:00`;
  const parsedDueDateTime = new Date(dueDateTime);
  if (Number.isNaN(parsedDueDateTime.getTime())) {
    throw new Error("Invalid due date or time.");
  }
  return dueDateTime;
}

export async function getAssignmentDetailById(id: string): Promise<AssignmentDetail> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(id);
  const latestSubmission = getLatestSubmission(workspaceSource.submissions);
  const status = mapAssignmentDetailStatus(workspaceSource.assignment.dueDate, workspaceSource.submissions);
  const earnedPoints = latestSubmission?.marks ?? null;

  return {
    id: String(workspaceSource.assignment.id),
    title: workspaceSource.assignment.name,
    course: workspaceSource.course.name || workspaceSource.assignment.courseName || "placeholder text",
    courseCode: workspaceSource.course.courseCode || "placeholder text",
    dueDate: formatDueDateTime(workspaceSource.assignment.dueDate),
    status,
    points: {
      earned: earnedPoints,
      total: workspaceSource.assignment.totalPoints,
    },
    submissionsUsed: workspaceSource.submissions.length,
    // TODO(backend): Replace placeholder with real attempt limit once backend exposes this field.
    submissionsAllowed: null,
    language: workspaceSource.assignment.languageName || "placeholder text",
    hasStarterCode: Boolean(workspaceSource.assignment.starterCodeUrl),
  };
}

export function getGradingAssignmentContext(assignmentId: string): Promise<GradingAssignmentContext> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...gradingAssignmentContext, id: assignmentId || gradingAssignmentContext.id });
}

export function listUpcomingAssignments(): Promise<UpcomingAssignment[]> {
  return Promise.resolve(upcomingAssignments);
}

export async function listCourseAssignments(courseId: string): Promise<AssignmentSummary[]> {
  const parsedCourseId = Number(courseId);
  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    throw new Error("Invalid course id.");
  }

  // NOTE: Course page assignments now load from backend, with student submission state mapped into UI statuses.
  const { data: assignments } = await api.get<AssignmentApiResponse[]>(
    `/api/v1/student/assignments/course/${parsedCourseId}`,
  );

  const assignmentSummaries = await Promise.all(
    assignments.map(async (assignment, index) => {
      const { data: submissions } = await api.get<SubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
      );
      const latestSubmission = [...submissions].sort((left, right) => {
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      })[0];
      const gradedScore = latestSubmission?.marks ?? null;
      const hasSubmission = submissions.length > 0;
      const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
      const isLate = typeof dueAt === "number" && Number.isFinite(dueAt) && dueAt < Date.now() && !hasSubmission;

      return {
        id: assignment.id,
        title: assignment.name,
        number: index + 1,
        dueDate: formatDate(assignment.dueDate),
        status: gradedScore !== null ? "graded" : isLate ? "late" : hasSubmission ? "submitted" : "not_submitted",
        points: gradedScore !== null ? gradedScore : assignment.totalPoints,
        totalPoints: assignment.totalPoints,
      } satisfies AssignmentSummary;
    }),
  );

  return assignmentSummaries;
}

export function listRecentAssignments(): Promise<RecentAssignmentItem[]> {
  return Promise.resolve(recentAssignments);
}

export async function listStudentAssignments(): Promise<StudentAssignmentListItem[]> {
  // NOTE: Student assignments page now loads real assignments from enrolled classes so new faculty-created work is visible.
  const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");

  const assignmentGroups = await Promise.all(
    enrolledCourses.map(async (course) => {
      const { data: assignments } = await api.get<AssignmentApiResponse[]>(
        `/api/v1/student/assignments/course/${course.id}`,
      );

      const mappedRows = await Promise.all(
        assignments.map(async (assignment) => {
          const { data: submissions } = await api.get<SubmissionApiResponse[]>(
            `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
          );
          const latestSubmission = [...submissions].sort((left, right) => {
            return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
          })[0];
          const hasSubmission = submissions.length > 0;
          const isGraded = latestSubmission?.marks !== null && latestSubmission?.marks !== undefined;
          const status = resolveStudentAssignmentStatus(assignment.dueDate, hasSubmission, isGraded);
          const iconData = resolveAssignmentIcon(course.courseCode || assignment.courseName);

          return {
            id: String(assignment.id),
            title: assignment.name,
            courseCode: course.courseCode || "N/A",
            courseName: assignment.courseName || course.name || "Course",
            points: assignment.totalPoints,
            dueAt: formatDueDateTime(assignment.dueDate),
            status,
            // NOTE: Completion bar is hidden in UI; keep stable placeholder for components that still read this field.
            progressPercent: status === "completed" ? 100 : status === "active" ? 50 : null,
            icon: iconData.icon,
            iconBg: iconData.iconBg,
          } satisfies StudentAssignmentListItem;
        }),
      );

      return mappedRows;
    }),
  );

  return assignmentGroups
    .flat()
    .sort((left, right) => {
      const leftDue = new Date(left.dueAt).getTime();
      const rightDue = new Date(right.dueAt).getTime();
      if (!Number.isFinite(leftDue) && !Number.isFinite(rightDue)) {
        return 0;
      }
      if (!Number.isFinite(leftDue)) {
        return 1;
      }
      if (!Number.isFinite(rightDue)) {
        return -1;
      }
      return leftDue - rightDue;
    });
}

export async function getAssignmentDescription(assignmentId: string): Promise<AssignmentDescription> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(assignmentId);

  // NOTE: Backend currently returns only one description string; all detailed sections are explicit placeholders for future APIs.
  return {
    problemDescription: [
      workspaceSource.assignment.description?.trim() || "placeholder text",
    ],
    requiredMethods: [
      {
        name: "placeholder text",
        description: "placeholder text",
      },
    ],
    exampleCode: "placeholder text",
    inputOutput: {
      input: "placeholder text",
      output: "placeholder text",
    },
    rubric: [
      {
        category: "placeholder text",
        description: "placeholder text",
        points: "placeholder text",
      },
    ],
    constraints: ["placeholder text"],
  };
}

export async function listRubricCategories(assignmentId: string): Promise<RubricCategory[]> {
  await loadStudentAssignmentWorkspaceSource(assignmentId);
  // TODO(backend): Replace this placeholder rubric structure when rubric-by-assignment endpoint is available.
  return [
    {
      name: "placeholder text",
      points: 0,
      criteria: [
        {
          description: "placeholder text",
          points: 0,
        },
      ],
    },
  ];
}

export async function listPublicTestCases(assignmentId: string): Promise<PublicTestCase[]> {
  await loadStudentAssignmentWorkspaceSource(assignmentId);
  // TODO(backend): Replace this placeholder test-case row when test-case endpoint is integrated.
  return [
    {
      id: 1,
      name: "placeholder text",
      passed: false,
      input: "placeholder text",
      expectedOutput: "placeholder text",
      actualOutput: "placeholder text",
      executionTime: "placeholder text",
    },
  ];
}

export async function getEditorCodeExamples(assignmentId: string): Promise<EditorCodeExamples> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(assignmentId);
  const languageKey = workspaceSource.assignment.languageName || "placeholder text";
  // TODO(backend): Replace placeholder code when starter/template endpoint is available.
  return {
    [languageKey]: "placeholder text",
  };
}

export async function getFacultyAssignmentCreatePageData(classId: string): Promise<FacultyAssignmentCreatePageData> {
  // NOTE: Create-assignment page data stays centralized here so the page remains presentation-focused.
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const [courseResponse, languagesResponse] = await Promise.all([
    api.get<FacultyCourseHeaderApiResponse>(`/api/v1/faculty/courses/${parsedClassId}`),
    api.get<ProgrammingLanguageApiResponse[]>("/api/v1/faculty/programming-languages/all"),
  ]);

  const languageOptions: AssignmentCreateOption[] = languagesResponse.data
    // NOTE: Inactive languages should not appear for new assignment creation.
    .filter((language) => language.isActive !== false)
    .map((language) => ({
      id: String(language.id),
      label: language.name,
    }));

  return {
    header: {
      classId: String(courseResponse.data.id),
      courseCode: courseResponse.data.courseCode,
      courseName: courseResponse.data.name,
    },
    languageOptions,
    initialForm: { ...defaultCreateAssignmentForm },
  };
}

export async function createFacultyAssignmentDraft(
  classId: string,
  form: AssignmentCreateFormData,
): Promise<{ assignmentId: string }> {
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const parsedLanguageId = Number(form.languageId);
  if (!Number.isFinite(parsedLanguageId) || parsedLanguageId <= 0) {
    throw new Error("Select a programming language.");
  }

  const payload = {
    // IMPORTANT: Keep this payload aligned with backend AssignmentRequest to avoid create failures.
    courseId: parsedClassId,
    languageId: parsedLanguageId,
    name: form.title.trim(),
    description: form.description.trim(),
    totalPoints: form.totalPoints,
    submissionType: "INDIVIDUAL" as const,
    dueDate: buildDueDateTimePayload(form.dueDate, form.dueTime),
  };

  // NOTE: Creation now calls backend directly so the assignment is persisted and visible to enrolled students.
  const { data } = await api.post<AssignmentApiResponse>("/api/v1/faculty/assignments", payload);
  return { assignmentId: String(data.id) };
}
