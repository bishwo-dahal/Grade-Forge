import type {
  AssignmentDescription,
  AssignmentDetail,
  AssignmentSummary,
  EditorCodeExamples,
  GradingAssignmentContext,
  RecentAssignmentItem,
  UpcomingAssignment,
} from "../types/assignment";
import type { RubricCategory } from "../types/grade";
import type { PublicTestCase } from "../types/submission";

// NOTE: Centralized mock assignment data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

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

export function getAssignmentDetailById(id: string): Promise<AssignmentDetail> {
  // NOTE: id is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...assignmentDetail, id });
}

export function getGradingAssignmentContext(assignmentId: string): Promise<GradingAssignmentContext> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...gradingAssignmentContext, id: assignmentId || gradingAssignmentContext.id });
}

export function listUpcomingAssignments(): Promise<UpcomingAssignment[]> {
  return Promise.resolve(upcomingAssignments);
}

export function listCourseAssignments(courseId: string): Promise<AssignmentSummary[]> {
  // NOTE: courseId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(courseAssignments);
}

export function listRecentAssignments(): Promise<RecentAssignmentItem[]> {
  return Promise.resolve(recentAssignments);
}

export function getAssignmentDescription(assignmentId: string): Promise<AssignmentDescription> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(assignmentDescription);
}

export function listRubricCategories(assignmentId: string): Promise<RubricCategory[]> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(rubricCategories);
}

export function listPublicTestCases(assignmentId: string): Promise<PublicTestCase[]> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(publicTestCases);
}

export function getEditorCodeExamples(assignmentId: string): Promise<EditorCodeExamples> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(editorCodeExamples);
}
