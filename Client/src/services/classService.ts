import type {
  ClassAnnouncement,
  ClassAssignment,
  ClassCreateFormData,
  ClassHeader,
  ClassImportantDate,
  ClassOverviewItem,
  ClassOverviewStat,
  ClassRecentActivity,
  ClassResource,
  ClassStudent,
  CourseCard,
  CourseDetail,
  FacultyRosterStudentRow,
  FacultyRosterStats,
  FacultyStudentEmailSuggestion,
  FacultyStudentSearchResult,
  FacultyCourseCreatePayload,
  FacultySemesterOption,
  FacultyDashboardStat,
  FacultyAssignment,
  FacultyMyClassItem,
  FacultyCourseCard,
  InstructorProfile,
  TeachingAssistantProfile,
} from "../types/class";
import api from "../api/axios";

// NOTE: Centralized mock class/course data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const enrolledCourses: CourseCard[] = [
  // NOTE: Expanded to six cards so the My Courses grid can mirror the current UI design density.
  {
    id: "cs-2400",
    courseCode: "CS 2400",
    credits: 3,
    title: "Data Structures & Algorithms",
    instructor: "Dr. Sarah Miller",
    semester: "Fall 2024",
    completed: 7,
    total: 12,
    icon: "\u{1F4BB}",
    iconBg: "bg-[#5A7ACD]/10",
    progressColor: "bg-[#5A7ACD]",
  },
  {
    id: "web-dev-301",
    courseCode: "CS 301",
    credits: 4,
    title: "Web Development",
    instructor: "Prof. James Wilson",
    semester: "Fall 2024",
    completed: 3,
    total: 8,
    icon: "\u{1F310}",
    iconBg: "bg-[#FEB05D]/10",
    progressColor: "bg-[#FEB05D]",
  },
  {
    id: "ml-401",
    courseCode: "CS 401",
    credits: 3,
    title: "Machine Learning",
    instructor: "Dr. Emily Chen",
    semester: "Fall 2024",
    completed: 11,
    total: 12,
    icon: "\u{1F916}",
    iconBg: "bg-[#5A7ACD]/10",
    progressColor: "bg-[#5A7ACD]",
  },
  {
    id: "db-350",
    courseCode: "CS 350",
    credits: 3,
    title: "Database Systems",
    instructor: "Prof. Michael Brown",
    semester: "Fall 2024",
    completed: 5,
    total: 10,
    icon: "\u{1F5C4}\uFE0F",
    iconBg: "bg-[#FEB05D]/10",
    progressColor: "bg-[#FEB05D]",
  },
  {
    id: "advanced-algorithms-425",
    courseCode: "CS 425",
    credits: 3,
    title: "Advanced Algorithms",
    instructor: "Dr. Robert Lee",
    semester: "Fall 2024",
    completed: 4,
    total: 10,
    icon: "\u{1F4CA}",
    iconBg: "bg-[#5A7ACD]/10",
    progressColor: "bg-[#5A7ACD]",
  },
  {
    id: "cybersecurity-310",
    courseCode: "CS 310",
    credits: 3,
    title: "Cybersecurity Fundamentals",
    instructor: "Prof. Jessica Taylor",
    semester: "Fall 2024",
    completed: 6,
    total: 9,
    icon: "\u{1F512}",
    iconBg: "bg-[#FEB05D]/10",
    progressColor: "bg-[#FEB05D]",
  },
];

const classesOverview: ClassOverviewItem[] = [
  {
    name: "Data Structures & Algorithms",
    code: "CS 201",
    instructor: "Prof. Michael Chen",
    assignments: 4,
    completed: 3,
    color: "bg-purple-600",
  },
  {
    name: "Web Development",
    code: "CS 340",
    instructor: "Prof. Sarah Johnson",
    assignments: 3,
    completed: 2,
    color: "bg-orange-500",
  },
  {
    name: "Database Systems",
    code: "CS 370",
    instructor: "Prof. David Lee",
    assignments: 5,
    completed: 4,
    color: "bg-purple-600",
  },
  {
    name: "Software Engineering",
    code: "CS 410",
    instructor: "Prof. Emily Davis",
    assignments: 3,
    completed: 3,
    color: "bg-orange-500",
  },
];


const courseDetails: Record<string, CourseDetail> = {
  "1": {
    id: 1,
    title: "Data Structures & Algorithms",
    code: "CS 301",
    instructor: "Dr. Sarah Miller",
    icon: "\u{1F4BB}",
    iconBg: "bg-[#5A7ACD]/10",
  },
  "2": {
    id: 2,
    title: "Web Development",
    code: "CS 205",
    instructor: "Prof. James Wilson",
    icon: "\u{1F310}",
    iconBg: "bg-[#FEB05D]/10",
  },
};

// NOTE: Added overview metadata so dashboards read from services instead of local mocks.
const classImportantDates: ClassImportantDate[] = [
  {
    id: "assignment-8",
    date: "Oct 24, 2023",
    title: "Assignment 8 Due",
    description: "Binary Search Tree Implementation",
    type: "assignment",
  },
  {
    id: "midterm",
    date: "Oct 28, 2023",
    title: "Midterm Exam",
    description: "Covers topics from Week 1-7",
    type: "exam",
  },
  {
    id: "assignment-9",
    date: "Nov 5, 2023",
    title: "Assignment 9 Due",
    description: "Graph Algorithms",
    type: "assignment",
  },
];

const classOverviewStats: ClassOverviewStat[] = [
  {
    label: "Overall Grade",
    value: "92.4%",
    subtitle: "A-",
    subtitleColor: "text-green-600",
  },
  {
    label: "Assignments",
    value: "5/8",
    subtitle: "Completed",
  },
  {
    label: "Unread Announcements",
    value: "2",
    subtitle: "New updates",
    valueColor: "text-[#FEB05D]",
  },
];

const facultyDashboardStats: FacultyDashboardStat[] = [
  {
    label: "Total Students",
    value: "45",
    iconKey: "users",
    iconBg: "bg-[#5A7ACD]/10",
    iconColor: "text-[#5A7ACD]",
  },
  {
    label: "Active Assignments",
    value: "8",
    iconKey: "file-text",
    iconBg: "bg-[#FEB05D]/10",
    iconColor: "text-[#FEB05D]",
  },
  {
    label: "Pending Submissions",
    value: "23",
    iconKey: "clock",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Ungraded Items",
    value: "12",
    iconKey: "alert",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    badge: true,
  },
];

const classHeader: ClassHeader = {
  id: "cs-2400",
  code: "CS 2400",
  name: "Data Structures & Algorithms",
  section: "Section 003",
  semester: "Fall 2023",
  instructor: "Prof. Sarah Wilson",
  instructorEmail: "s.wilson@university.edu",
};

const facultyClassHeader: ClassHeader = {
  id: "cs-2400",
  code: "CS 2400",
  name: "Data Structures & Algorithms",
  section: "Section 003",
  semester: "Fall 2023",
  instructor: "Prof. Sarah Wilson",
  role: "Instructor",
};

const classAnnouncements: ClassAnnouncement[] = [
  {
    id: 1,
    title: "Midterm Exam Details",
    author: "Prof. Sarah Wilson",
    date: "Oct 20, 2023",
    time: "2:30 PM",
    content:
      "The midterm exam will be held on October 28th during our regular class time. The exam will cover all material from weeks 1-7, including data structures (arrays, linked lists, stacks, queues, trees) and basic algorithms (sorting, searching, recursion). Please review your assignments and lecture notes. Office hours will be extended this week - see schedule below.",
    unread: true,
  },
  {
    id: 2,
    title: "Office Hours This Week",
    author: "Prof. Sarah Wilson",
    date: "Oct 18, 2023",
    time: "10:15 AM",
    content:
      "I will be holding extended office hours this week to help with Assignment 8 and midterm preparation:\n\nMonday: 2-5 PM\nWednesday: 1-4 PM\nFriday: 3-6 PM\n\nAll sessions will be held in my office (CS Building, Room 301) or via Zoom (link in syllabus).",
    unread: true,
  },
  {
    id: 3,
    title: "Assignment 8 Clarification",
    author: "Prof. Sarah Wilson",
    date: "Oct 15, 2023",
    time: "4:45 PM",
    content:
      "Several students have asked about the delete operation in Assignment 8. Remember that when deleting a node with two children, you should replace it with either the in-order predecessor or successor. Both approaches are acceptable for this assignment.",
    unread: false,
  },
  {
    id: 4,
    title: "Guest Lecture Next Week",
    author: "Prof. Sarah Wilson",
    date: "Oct 12, 2023",
    time: "11:20 AM",
    content:
      "Next Tuesday we will have a guest lecture from Dr. James Chen, a software engineer at Google, who will talk about how data structures are used in production systems. Attendance is optional but highly recommended.",
    unread: false,
  },
];

const classResources: ClassResource[] = [
  {
    id: 1,
    name: "Course_Syllabus_Fall_2023.pdf",
    type: "PDF",
    size: "245 KB",
    uploadedDate: "Aug 28, 2023",
    category: "Course Materials",
  },
  {
    id: 2,
    name: "Lecture_Slides_Weeks_1-7.pdf",
    type: "PDF",
    size: "3.2 MB",
    uploadedDate: "Oct 15, 2023",
    category: "Lecture Slides",
  },
  {
    id: 3,
    name: "BST_Implementation_Guide.pdf",
    type: "PDF",
    size: "892 KB",
    uploadedDate: "Oct 10, 2023",
    category: "Assignment Resources",
  },
  {
    id: 4,
    name: "Python_Style_Guide.pdf",
    type: "PDF",
    size: "156 KB",
    uploadedDate: "Sep 1, 2023",
    category: "Programming Guides",
  },
  {
    id: 5,
    name: "Algorithm_Complexity_Cheatsheet.pdf",
    type: "PDF",
    size: "421 KB",
    uploadedDate: "Sep 15, 2023",
    category: "Reference Materials",
  },
];

const instructorProfile: InstructorProfile = {
  name: "Prof. Sarah Wilson",
  email: "s.wilson@university.edu",
  officeHours: "Mon/Wed 2-4 PM",
  office: "CS Building, Room 301",
};

const teachingAssistants: TeachingAssistantProfile[] = [
  {
    id: 1,
    name: "Michael Chen",
    email: "m.chen@university.edu",
    officeHours: "Tue/Thu 3-5 PM",
    office: "CS Lab, Room 120",
  },
  {
    id: 2,
    name: "Emily Rodriguez",
    email: "e.rodriguez@university.edu",
    officeHours: "Wed/Fri 1-3 PM",
    office: "CS Lab, Room 121",
  },
];

const classStudents: ClassStudent[] = [
  { id: 1, name: "Alex Thompson", email: "a.thompson@university.edu" },
  { id: 2, name: "Jamie Park", email: "j.park@university.edu" },
  { id: 3, name: "Morgan Davis", email: "m.davis@university.edu" },
  { id: 4, name: "Taylor Kim", email: "t.kim@university.edu" },
  { id: 5, name: "Jordan Lee", email: "j.lee@university.edu" },
];

const facultyClassStudents: ClassStudent[] = [
  { id: 1, name: "Alex Thompson", email: "a.thompson@university.edu", status: "Active", group: "Group 1" },
  { id: 2, name: "Jamie Park", email: "j.park@university.edu", status: "Active", group: "Group 2" },
  { id: 3, name: "Morgan Davis", email: "m.davis@university.edu", status: "Active", group: "Group 1" },
  { id: 4, name: "Taylor Kim", email: "t.kim@university.edu", status: "Active", group: "Group 3" },
  { id: 5, name: "Jordan Lee", email: "j.lee@university.edu", status: "Active", group: "Group 2" },
];

const classRecentActivity: ClassRecentActivity[] = [
  {
    id: 1,
    type: "submission",
    message: "Alex Thompson submitted Assignment 8",
    time: "5 minutes ago",
    iconKey: "send",
    iconBg: "bg-blue-50",
    iconColor: "text-[#5A7ACD]",
  },
  {
    id: 2,
    type: "graded",
    message: "You graded Jamie Park's Assignment 7",
    time: "2 hours ago",
    iconKey: "check",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 3,
    type: "submission",
    message: "Morgan Davis submitted Assignment 8",
    time: "3 hours ago",
    iconKey: "send",
    iconBg: "bg-blue-50",
    iconColor: "text-[#5A7ACD]",
  },
  {
    id: 4,
    type: "student",
    message: "Taylor Kim joined the class",
    time: "1 day ago",
    iconKey: "user-plus",
    iconBg: "bg-orange-50",
    iconColor: "text-[#FEB05D]",
  },
];

const classAssignments: ClassAssignment[] = [
  {
    id: "assignment-8",
    title: "Binary Search Tree Implementation",
    language: "Python",
    dueDate: "Oct 24, 2023 11:59 PM",
    status: "upcoming",
    grade: null,
    totalPoints: 100,
  },
  {
    id: "assignment-7",
    title: "Hash Table with Chaining",
    language: "Java",
    dueDate: "Oct 17, 2023 11:59 PM",
    status: "submitted",
    grade: null,
    totalPoints: 100,
  },
  {
    id: "assignment-6",
    title: "Linked List Operations",
    language: "C++",
    dueDate: "Oct 10, 2023 11:59 PM",
    status: "graded",
    grade: 95,
    totalPoints: 100,
  },
  {
    id: "assignment-5",
    title: "Stack and Queue Applications",
    language: "Python",
    dueDate: "Oct 3, 2023 11:59 PM",
    status: "graded",
    grade: 88,
    totalPoints: 100,
  },
  {
    id: "assignment-4",
    title: "Recursion and Backtracking",
    language: "JavaScript",
    dueDate: "Sep 26, 2023 11:59 PM",
    status: "graded",
    grade: 92,
    totalPoints: 100,
  },
  {
    id: "assignment-3",
    title: "Array Sorting Algorithms",
    language: "Python",
    dueDate: "Sep 19, 2023 11:59 PM",
    status: "graded",
    grade: 98,
    totalPoints: 100,
  },
];

const facultyAssignments: FacultyAssignment[] = [
  {
    id: "assignment-8",
    name: "Binary Search Tree Implementation",
    language: "Python",
    dueDate: "Oct 24, 2023 11:59 PM",
    submissions: 32,
    totalStudents: 45,
    status: "published",
  },
  {
    id: "assignment-7",
    name: "Hash Table with Chaining",
    language: "Java",
    dueDate: "Oct 17, 2023 11:59 PM",
    submissions: 45,
    totalStudents: 45,
    status: "closed",
  },
  {
    id: "assignment-6",
    name: "Linked List Operations",
    language: "C++",
    dueDate: "Oct 10, 2023 11:59 PM",
    submissions: 44,
    totalStudents: 45,
    status: "closed",
  },
  {
    id: "assignment-9",
    name: "Graph Algorithms",
    language: "Python",
    dueDate: "Nov 5, 2023 11:59 PM",
    submissions: 0,
    totalStudents: 45,
    status: "draft",
  },
];

interface CourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
  section: string | null;
  description: string | null;
  imageUrl: string | null;
  canvasCourseId: string | null;
  active: boolean;
  isPublished: boolean;
  semester?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  faculty?: {
    id: number;
    name: string;
    email: string;
    department: string;
    qualifications: string;
  } | null;
}

interface FacultySemesterApiResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

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
  assignmentName: string;
  courseId: number;
  courseName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
}

interface EnrollmentApiResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail?: string;
  courseId: number;
  enrolledAt: string;
  enrolledStatus: string;
  grade: string | null;
}

interface FacultyStudentSearchApiResponse {
  id: number | null;
  userId: number | null;
  cwid: string | null;
  major: string | null;
  canvasUserId: string | null;
  name: string | null;
  email: string | null;
  enrolledStatus: string | null;
}

function buildCourseIcon(courseCode: string): { icon: string; iconBg: string } {
  // NOTE: Icon mapping is lightweight and deterministic so backend integration can keep UI consistent.
  const code = courseCode.toUpperCase();
  if (code.includes("WEB")) {
    return { icon: "\u{1F310}", iconBg: "bg-[#FEB05D]/10" };
  }
  if (code.includes("DB")) {
    return { icon: "\u{1F5C4}\uFE0F", iconBg: "bg-[#FEB05D]/10" };
  }
  if (code.includes("ML")) {
    return { icon: "\u{1F916}", iconBg: "bg-[#5A7ACD]/10" };
  }
  return { icon: "\u{1F4BB}", iconBg: "bg-[#5A7ACD]/10" };
}

function formatDateTime(value: string | null | undefined, fallback = "TBD"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) {
    return "just now";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "just now";
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  const deltaHours = Math.floor(deltaMinutes / 60);
  const deltaDays = Math.floor(deltaHours / 24);

  if (deltaMinutes < 1) {
    return "just now";
  }
  if (deltaMinutes < 60) {
    return `${deltaMinutes} minute${deltaMinutes === 1 ? "" : "s"} ago`;
  }
  if (deltaHours < 24) {
    return `${deltaHours} hour${deltaHours === 1 ? "" : "s"} ago`;
  }
  return `${deltaDays} day${deltaDays === 1 ? "" : "s"} ago`;
}

function formatEnrollmentLabel(value: string | null | undefined): string {
  if (!value) {
    return "Enrolled date unavailable";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Enrolled date unavailable";
  }
  return `Enrolled ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function mapEnrollmentStatusToRosterStatus(status: string | null | undefined): FacultyRosterStudentRow["status"] {
  if (status === "ENROLLED") {
    return "active";
  }
  if (status === "DROPPED") {
    return "inactive";
  }
  return "unassigned";
}

function toLetterGrade(percentage: number): string {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

function toCourseId(rawId: string): number {
  const parsed = Number(rawId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid course id.");
  }
  return parsed;
}

async function listStudentAssignmentsByCourse(courseId: number): Promise<AssignmentApiResponse[]> {
  // NOTE: Student class pages now read real assignments from backend instead of mock rows.
  const { data } = await api.get<AssignmentApiResponse[]>(`/api/v1/student/assignments/course/${courseId}`);
  return data;
}

async function listFacultyAssignmentsByCourse(courseId: number): Promise<AssignmentApiResponse[]> {
  // NOTE: Faculty class management now reads assignment lists from backend course scope.
  const { data } = await api.get<AssignmentApiResponse[]>(`/api/v1/faculty/assignments/course/${courseId}`);
  return data;
}

async function listStudentSubmissionsByAssignment(assignmentId: number): Promise<SubmissionApiResponse[]> {
  const { data } = await api.get<SubmissionApiResponse[]>(
    `/api/v1/student/submissions/assignment?assignmentId=${assignmentId}`,
  );
  return data;
}

async function listFacultySubmissionsByAssignment(assignmentId: number): Promise<SubmissionApiResponse[]> {
  const { data } = await api.get<SubmissionApiResponse[]>(
    `/api/v1/faculty/submissions?assignmentId=${assignmentId}`,
  );
  return data;
}

async function listFacultyEnrollmentsByCourse(courseId: number): Promise<EnrollmentApiResponse[]> {
  const { data } = await api.get<EnrollmentApiResponse[]>(`/api/v1/faculty/enrollments/course/${courseId}`);
  return data;
}

/** Drops a student's enrollment from a course. PATCH /api/v1/faculty/enrollments/{studentId}/drop/{courseId} */
export async function dropStudentFromCourse(studentId: number, courseId: number): Promise<void> {
  await api.patch(`/api/v1/faculty/enrollments/${studentId}/drop/${courseId}`);
}

async function searchStudentsForFacultyCourse(
  courseId: number,
  keyword: string,
): Promise<FacultyStudentSearchApiResponse[]> {
  const trimmedKeyword = keyword.trim();
  if (trimmedKeyword.length < 1) {
    return [];
  }
  // NOTE: Teammate backend now exposes roster candidate search via shared student search endpoint.
  const { data } = await api.get<FacultyStudentSearchApiResponse[]>("/api/search/students", {
    params: { keyword: trimmedKeyword, courseId },
  });
  return data;
}

function mapEnrolledStatusToReason(status: string, canEnroll: boolean): string {
  if (status === "ENROLLED") {
    return "Student is already enrolled in this course.";
  }
  if (canEnroll) {
    return "Student can be enrolled in this course.";
  }
  return "Student cannot be enrolled right now.";
}

async function getStudentCourseById(courseId: number): Promise<CourseApiResponse> {
  const { data } = await api.get<CourseApiResponse>(`/api/v1/student/classes/${courseId}`);
  return data;
}

async function getFacultyCourseById(courseId: number): Promise<CourseApiResponse> {
  const { data } = await api.get<CourseApiResponse>(`/api/v1/faculty/courses/${courseId}`);
  return data;
}

async function fetchStudentAssignmentsWithSubmissions(courseId: number): Promise<
  Array<{ assignment: AssignmentApiResponse; submissions: SubmissionApiResponse[] }>
> {
  const assignments = await listStudentAssignmentsByCourse(courseId);
  const submissionsByAssignment = await Promise.all(
    assignments.map(async (assignment) => ({
      assignment,
      submissions: await listStudentSubmissionsByAssignment(assignment.id),
    })),
  );
  return submissionsByAssignment;
}

async function fetchFacultyAssignmentsWithSubmissions(courseId: number): Promise<
  Array<{ assignment: AssignmentApiResponse; submissions: SubmissionApiResponse[] }>
> {
  const assignments = await listFacultyAssignmentsByCourse(courseId);
  const submissionsByAssignment = await Promise.all(
    assignments.map(async (assignment) => ({
      assignment,
      submissions: await listFacultySubmissionsByAssignment(assignment.id),
    })),
  );
  return submissionsByAssignment;
}

function pickLatestSubmission(submissions: SubmissionApiResponse[]): SubmissionApiResponse | null {
  if (submissions.length === 0) {
    return null;
  }
  return [...submissions].sort((left, right) => {
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  })[0] ?? null;
}

function mapStudentClassAssignment(
  assignment: AssignmentApiResponse,
  submissions: SubmissionApiResponse[],
): ClassAssignment {
  const latestSubmission = pickLatestSubmission(submissions);
  const hasSubmission = submissions.length > 0;
  const gradedScore = latestSubmission?.marks ?? null;
  const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
  const isPastDue = typeof dueAt === "number" && Number.isFinite(dueAt) && dueAt < Date.now();

  let status: ClassAssignment["status"] = "upcoming";
  if (gradedScore !== null) {
    status = "graded";
  } else if (hasSubmission || isPastDue) {
    status = "submitted";
  }

  return {
    id: String(assignment.id),
    title: assignment.name,
    language: assignment.languageName || "N/A",
    dueDate: formatDateTime(assignment.dueDate, "No due date"),
    status,
    grade: gradedScore,
    totalPoints: assignment.totalPoints,
  };
}

async function getFacultyCourseMetrics(courseId: number): Promise<{
  students: number;
  assignments: number;
  activeAssignments: number;
  pendingSubmissions: number;
  pendingGrading: number;
  pendingReview: number;
  avgScore: number;
}> {
  const [enrollments, assignmentsWithSubmissions] = await Promise.all([
    listFacultyEnrollmentsByCourse(courseId),
    fetchFacultyAssignmentsWithSubmissions(courseId),
  ]);

  const activeStudents = enrollments.filter((enrollment) => enrollment.enrolledStatus === "ENROLLED").length;
  const students = activeStudents > 0 ? activeStudents : enrollments.length;
  const assignments = assignmentsWithSubmissions.length;
  const now = Date.now();
  const activeAssignments = assignmentsWithSubmissions.filter(({ assignment }) => {
    if (!assignment.dueDate) {
      return true;
    }
    const dueAt = new Date(assignment.dueDate).getTime();
    return Number.isFinite(dueAt) && dueAt >= now;
  }).length;

  const allSubmissions = assignmentsWithSubmissions.flatMap(({ submissions }) => submissions);
  const pendingSubmissions = allSubmissions.filter((submission) => submission.marks === null).length;
  const gradedSubmissions = allSubmissions.filter((submission) => submission.marks !== null);
  const avgScore =
    gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, submission) => sum + Number(submission.marks ?? 0), 0) /
            gradedSubmissions.length,
        )
      : 0;

  return {
    students,
    assignments,
    activeAssignments,
    pendingSubmissions,
    pendingGrading: pendingSubmissions,
    pendingReview: pendingSubmissions,
    avgScore,
  };
}

function mapFacultyCourseToCard(course: CourseApiResponse, metrics: Awaited<ReturnType<typeof getFacultyCourseMetrics>>): FacultyCourseCard {
  const iconData = buildCourseIcon(course.courseCode || course.name);
  return {
    id: String(course.id),
    title: course.name,
    code: course.courseCode,
    // NOTE: Faculty dashboard cards now use backend-derived metrics from assignments/submissions/enrollments.
    students: metrics.students,
    pendingSubmissions: metrics.pendingSubmissions,
    activeAssignments: metrics.activeAssignments,
    icon: iconData.icon,
    iconBg: iconData.iconBg,
  };
}

function mapFacultyCourseToWorkspaceItem(
  course: CourseApiResponse,
  metrics: Awaited<ReturnType<typeof getFacultyCourseMetrics>>,
): FacultyMyClassItem {
  const iconData = buildCourseIcon(course.courseCode || course.name);
  return {
    id: String(course.id),
    title: course.name,
    code: course.courseCode,
    section: course.section ?? "TBD",
    semester: course.semester?.name ?? "TBD",
    isActive: Boolean(course.active),
    // NOTE: Faculty My Classes cards now show backend-derived metrics; non-modeled fields keep explicit placeholders.
    students: metrics.students,
    assignments: metrics.assignments,
    avgScore: metrics.avgScore,
    pendingGrading: metrics.pendingGrading,
    pendingReview: metrics.pendingReview,
    schedule: "TBD",
    location: "TBD",
    icon: iconData.icon,
    iconBg: iconData.iconBg,
  };
}

function toCreatePayload(form: ClassCreateFormData): FacultyCourseCreatePayload {
  const parsedSemesterId = Number(form.semesterId);
  if (!Number.isFinite(parsedSemesterId) || parsedSemesterId <= 0) {
    throw new Error("Semester ID must be a valid positive number.");
  }

  return {
    name: form.name.trim(),
    courseCode: form.courseCode.trim(),
    section: form.section.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    canvasCourseId: form.canvasCourseId.trim(),
    isPublished: form.isPublished,
    semesterId: parsedSemesterId,
    active: form.active,
  };
}

export function listClassesOverview(): Promise<ClassOverviewItem[]> {
  return Promise.resolve(classesOverview);
}

export async function listFacultyCourses(): Promise<FacultyCourseCard[]> {
  // IMPORTANT: Backend resolves faculty context from authenticated email.
  // IMPORTANT: This call returns 400 when the logged-in user exists in Users but is not mapped in Faculty.
  // NOTE: University admin must create/assign the faculty profile first.
  // TODO(backend): Keep the return shape stable so course cards can stay mapped without UI rewrites.
  const { data } = await api.get<CourseApiResponse[]>("/api/v1/faculty/courses");
  const cards = await Promise.all(
    data.map(async (course) => {
      const metrics = await getFacultyCourseMetrics(course.id).catch(() => ({
        students: 0,
        assignments: 0,
        activeAssignments: 0,
        pendingSubmissions: 0,
        pendingGrading: 0,
        pendingReview: 0,
        avgScore: 0,
      }));
      return mapFacultyCourseToCard(course, metrics);
    }),
  );
  return cards;
}

export async function listFacultyMyClasses(): Promise<FacultyMyClassItem[]> {
  // NOTE: Faculty workspace cards now hydrate from live backend metrics instead of hardcoded placeholder zeros.
  const { data } = await api.get<CourseApiResponse[]>("/api/v1/faculty/courses");
  const classItems = await Promise.all(
    data.map(async (course) => {
      const metrics = await getFacultyCourseMetrics(course.id).catch(() => ({
        students: 0,
        assignments: 0,
        activeAssignments: 0,
        pendingSubmissions: 0,
        pendingGrading: 0,
        pendingReview: 0,
        avgScore: 0,
      }));
      return mapFacultyCourseToWorkspaceItem(course, metrics);
    }),
  );
  return classItems;
}

export async function listFacultySemesters(): Promise<FacultySemesterOption[]> {
  // TODO(backend): Replace this with cached semester query when semester store is introduced.
  const { data } = await api.get<FacultySemesterApiResponse[]>("/api/v1/faculty/semester/all");
  return data.map((semester) => ({
    id: semester.id,
    name: semester.name,
    startDate: semester.startDate,
    endDate: semester.endDate,
  }));
}

export async function createFacultyCourse(form: ClassCreateFormData): Promise<void> {
  const payload = toCreatePayload(form);
  // IMPORTANT: Create also requires the authenticated user to have a Faculty row.
  // IMPORTANT: If user is not assigned as faculty by university admin, backend returns 400.
  // IMPORTANT: Changing this payload shape requires backend coordination with CourseRequestDto.
  await api.post("/api/v1/faculty/courses/create", payload);
}

export async function listEnrolledCourses(): Promise<CourseCard[]> {
  // NOTE: Student dashboard and My Courses now consume enrolled classes from backend.
  const { data } = await api.get<CourseApiResponse[]>("/api/v1/student/classes/enrolled");
  const courseCards = await Promise.all(
    data.map(async (course) => {
      const assignmentBundles = await fetchStudentAssignmentsWithSubmissions(course.id).catch(() => []);
      const completed = assignmentBundles.filter(({ submissions }) => submissions.length > 0).length;
      const total = assignmentBundles.length;
      const iconData = buildCourseIcon(course.courseCode || course.name);
      return {
        id: String(course.id),
        courseCode: course.courseCode,
        // NOTE: Backend does not expose credits yet; keep deterministic fallback until schema expands.
        credits: 3,
        title: course.name,
        instructor: course.faculty?.name ?? "TBD",
        semester: course.semester?.name ?? "TBD",
        completed,
        total,
        icon: iconData.icon,
        iconBg: iconData.iconBg,
        progressColor: iconData.iconBg.includes("FEB05D") ? "bg-[#FEB05D]" : "bg-[#5A7ACD]",
      };
    }),
  );
  return courseCards;
}

export async function getCourseDetailById(id: string): Promise<CourseDetail> {
  const courseId = toCourseId(id);
  const course = await getStudentCourseById(courseId);
  const iconData = buildCourseIcon(course.courseCode || course.name);
  return {
    id: String(course.id),
    title: course.name,
    code: course.courseCode,
    instructor: course.faculty?.name ?? "TBD",
    icon: iconData.icon,
    iconBg: iconData.iconBg,
  };
}

export async function listClassImportantDates(classId: string): Promise<ClassImportantDate[]> {
  const courseId = toCourseId(classId);
  const assignments = await listStudentAssignmentsByCourse(courseId);
  // NOTE: Overview important dates now map to real assignment due dates; no hardcoded timeline rows.
  return assignments
    .filter((assignment) => assignment.dueDate)
    .sort((left, right) => new Date(left.dueDate ?? "").getTime() - new Date(right.dueDate ?? "").getTime())
    .slice(0, 3)
    .map((assignment) => ({
      id: `assignment-${assignment.id}`,
      date: assignment.dueDate ?? new Date().toISOString(),
      title: `${assignment.name} Due`,
      description: assignment.name,
      type: "assignment",
    }));
}

export async function listClassOverviewStats(classId: string): Promise<ClassOverviewStat[]> {
  const courseId = toCourseId(classId);
  const bundles = await fetchStudentAssignmentsWithSubmissions(courseId);
  const completedAssignments = bundles.filter(({ submissions }) => submissions.length > 0).length;
  const gradedBundles = bundles.filter(({ submissions }) => {
    const latestSubmission = pickLatestSubmission(submissions);
    return latestSubmission?.marks !== null && latestSubmission?.marks !== undefined;
  });

  const earnedPoints = gradedBundles.reduce((sum, bundle) => {
    const latest = pickLatestSubmission(bundle.submissions);
    return sum + Number(latest?.marks ?? 0);
  }, 0);
  const totalPoints = gradedBundles.reduce((sum, bundle) => sum + bundle.assignment.totalPoints, 0);
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  // NOTE: Keep stats card return shape stable so the existing overview UI does not need structural changes.
  return [
    {
      label: "Overall Grade",
      value: `${percentage.toFixed(1)}%`,
      subtitle: toLetterGrade(percentage),
      subtitleColor: percentage >= 70 ? "text-green-600" : "text-[#C23A42]",
    },
    {
      label: "Assignments",
      value: `${completedAssignments}/${bundles.length}`,
      subtitle: "Completed",
    },
    {
      label: "Unread Announcements",
      value: "0",
      subtitle: "No updates",
      valueColor: "text-[#5D6A80]",
    },
  ];
}

export async function listFacultyDashboardStats(classId: string): Promise<FacultyDashboardStat[]> {
  const courseId = toCourseId(classId);
  const metrics = await getFacultyCourseMetrics(courseId);
  return [
    {
      label: "Total Students",
      value: String(metrics.students),
      iconKey: "users",
      iconBg: "bg-[#5A7ACD]/10",
      iconColor: "text-[#5A7ACD]",
    },
    {
      label: "Active Assignments",
      value: String(metrics.activeAssignments),
      iconKey: "file-text",
      iconBg: "bg-[#FEB05D]/10",
      iconColor: "text-[#FEB05D]",
    },
    {
      label: "Pending Submissions",
      value: String(metrics.pendingSubmissions),
      iconKey: "clock",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Ungraded Items",
      value: String(metrics.pendingGrading),
      iconKey: "alert",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      badge: metrics.pendingGrading > 0,
    },
  ];
}

export async function getClassHeaderById(classId: string): Promise<ClassHeader> {
  const courseId = toCourseId(classId);
  const course = await getStudentCourseById(courseId);
  return {
    id: String(course.id),
    code: course.courseCode,
    name: course.name,
    section: course.section ?? "Section TBD",
    semester: course.semester?.name ?? "Semester TBD",
    instructor: course.faculty?.name ?? "TBD",
    instructorEmail: course.faculty?.email ?? "",
  };
}

export async function getFacultyClassHeaderById(classId: string): Promise<ClassHeader> {
  const courseId = toCourseId(classId);
  const course = await getFacultyCourseById(courseId);
  return {
    id: String(course.id),
    code: course.courseCode,
    name: course.name,
    section: course.section ?? "Section TBD",
    semester: course.semester?.name ?? "Semester TBD",
    instructor: course.faculty?.name ?? "TBD",
    role: "Instructor",
  };
}

export function listClassAnnouncements(classId: string): Promise<ClassAnnouncement[]> {
  // TODO(backend): Add class announcements endpoint and replace this intentional empty-state fallback.
  return Promise.resolve([]);
}

export function listClassResources(classId: string): Promise<ClassResource[]> {
  // TODO(backend): Add class resources endpoint and replace this intentional empty-state fallback.
  return Promise.resolve([]);
}

export async function getClassPeople(classId: string): Promise<{
  instructor: InstructorProfile;
  teachingAssistants: TeachingAssistantProfile[];
  students: ClassStudent[];
}> {
  const courseId = toCourseId(classId);
  const course = await getStudentCourseById(courseId);
  // NOTE: Student class People tab now uses live instructor details and explicit empty states for unsupported sub-entities.
  return {
    instructor: {
      name: course.faculty?.name ?? "TBD",
      email: course.faculty?.email ?? "tbd@university.edu",
      officeHours: "TBD",
      office: "TBD",
    },
    teachingAssistants: [],
    students: [],
  };
}

export async function listFacultyClassStudents(classId: string): Promise<ClassStudent[]> {
  const courseId = toCourseId(classId);
  const enrollments = await listFacultyEnrollmentsByCourse(courseId);
  return enrollments.map((enrollment, index) => ({
    id: enrollment.studentId ?? index + 1,
    name: enrollment.studentName || "Student",
    email: enrollment.studentEmail || "N/A",
    status: enrollment.enrolledStatus === "ENROLLED" ? "Active" : "Inactive",
    group: "Unassigned",
  }));
}

export async function listFacultyRosterRows(classId: string): Promise<FacultyRosterStudentRow[]> {
  const courseId = toCourseId(classId);
  // NOTE: Roster rows are centralized here so FacultyClassPage remains a data container, not a data-mapping layer.
  const [enrollments, assignmentsWithSubmissions] = await Promise.all([
    listFacultyEnrollmentsByCourse(courseId),
    fetchFacultyAssignmentsWithSubmissions(courseId).catch(() => []),
  ]);

  const totalAssignments = assignmentsWithSubmissions.length;
  const submissions = assignmentsWithSubmissions.flatMap(({ submissions }) => submissions);

  return enrollments.map((enrollment, index) => {
    const studentSubmissions = submissions.filter((submission) => submission.studentId === enrollment.studentId);
    const submittedAssignmentCount = new Set(studentSubmissions.map((submission) => submission.assignmentId)).size;
    const gradedSubmissions = studentSubmissions.filter((submission) => submission.marks !== null);
    const latestSubmission = [...studentSubmissions].sort((left, right) => {
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
    })[0];

    const avgScore =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((sum, submission) => sum + Number(submission.marks ?? 0), 0) / gradedSubmissions.length,
          )
        : 0;
    const completionPercent =
      totalAssignments > 0 ? Math.round((submittedAssignmentCount / totalAssignments) * 100) : 0;

    return {
      id: String(enrollment.id ?? `${enrollment.studentId ?? "row"}-${index}`),
      studentId: enrollment.studentId ?? null,
      name: enrollment.studentName || "Student",
      email: enrollment.studentEmail || "No email",
      enrolledLabel: formatEnrollmentLabel(enrollment.enrolledAt),
      status: mapEnrollmentStatusToRosterStatus(enrollment.enrolledStatus),
      group: "Unassigned",
      progressSubmitted: submittedAssignmentCount,
      progressTotal: totalAssignments,
      completionPercent,
      avgScore,
      lastActivity: latestSubmission ? formatRelativeTime(latestSubmission.submittedAt) : "No activity",
    } satisfies FacultyRosterStudentRow;
  });
}

export async function searchFacultyStudentByEmail(
  classId: string,
  email: string,
): Promise<FacultyStudentSearchResult> {
  const courseId = toCourseId(classId);
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  const students = await searchStudentsForFacultyCourse(courseId, trimmedEmail);
  const exactEmailMatch = students.find(
    (student) => (student.email ?? "").trim().toLowerCase() === trimmedEmail.toLowerCase(),
  );
  // REFACTOR: Search supports teammate keyword lookup (name/email/CWID), while enroll still resolves one student record.
  const matchedStudent =
    exactEmailMatch ??
    (students.length === 1 ? students[0] : null);

  if (!matchedStudent) {
    if (students.length > 1) {
      throw new Error("Multiple students matched. Select one from the suggestions.");
    }
    // FIX: Normalize "not found" into a consistent frontend error even though backend returns an empty list.
    throw new Error("User not found.");
  }

  const normalizedStatus = (matchedStudent.enrolledStatus ?? "NOT_ENROLLED").toUpperCase();
  const alreadyInCourse = normalizedStatus === "ENROLLED";
  const canEnroll = !alreadyInCourse && typeof matchedStudent.id === "number";
  const reason = mapEnrolledStatusToReason(normalizedStatus, canEnroll);

  // NOTE: Keep the existing frontend return shape stable so roster UI logic does not need structural changes.
  return {
    studentId: matchedStudent.id ?? null,
    userId: matchedStudent.userId ?? null,
    studentName: matchedStudent.name ?? "Unknown student",
    studentEmail: matchedStudent.email ?? trimmedEmail,
    major: matchedStudent.major ?? "N/A",
    cwid: matchedStudent.cwid ?? "N/A",
    canvasUserId: matchedStudent.canvasUserId ?? "N/A",
    alreadyInCourse,
    currentStatus: normalizedStatus,
    canEnroll,
    reason,
  };
}

export async function listFacultyStudentEmailSuggestions(
  classId: string,
  query: string,
): Promise<FacultyStudentEmailSuggestion[]> {
  const courseId = toCourseId(classId);
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 1) {
    return [];
  }

  const students = await searchStudentsForFacultyCourse(courseId, trimmedQuery);

  const dedupedByEmail = new Map<string, FacultyStudentEmailSuggestion>();
  students
    // NOTE: Prefix-first ordering keeps suggestions predictable in the UI dropdown.
    .sort((left, right) => {
      const leftEmail = (left.email ?? "").toLowerCase();
      const rightEmail = (right.email ?? "").toLowerCase();
      const normalizedQuery = trimmedQuery.toLowerCase();
      const leftStartsWith = leftEmail.startsWith(normalizedQuery);
      const rightStartsWith = rightEmail.startsWith(normalizedQuery);
      if (leftStartsWith !== rightStartsWith) {
        return leftStartsWith ? -1 : 1;
      }
      return leftEmail.localeCompare(rightEmail);
    })
    .forEach((student) => {
      const email = student.email?.trim();
      if (!email) {
        return;
      }
      const emailKey = email.toLowerCase();
      if (dedupedByEmail.has(emailKey)) {
        return;
      }
      dedupedByEmail.set(emailKey, {
        studentId: student.id ?? null,
        userId: student.userId ?? null,
        name: student.name ?? "Unknown student",
        email,
        major: student.major ?? "N/A",
        cwid: student.cwid ?? "N/A",
        canvasUserId: student.canvasUserId ?? "N/A",
        currentStatus: (student.enrolledStatus ?? "NOT_ENROLLED").toUpperCase(),
        alreadyInCourse: (student.enrolledStatus ?? "").toUpperCase() === "ENROLLED",
      });
    });

  return Array.from(dedupedByEmail.values()).slice(0, 8);
}

export async function enrollStudentByEmail(classId: string, email: string): Promise<void> {
  const courseId = toCourseId(classId);
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  const matchedStudent = await searchFacultyStudentByEmail(classId, trimmedEmail);
  if (matchedStudent.alreadyInCourse) {
    throw new Error("Student is already enrolled in this course.");
  }
  if (!matchedStudent.studentId) {
    throw new Error("User not found.");
  }

  // REFACTOR: Switch to teammate enrollment contract (studentId + courseId) while keeping same frontend function signature.
  await api.post("/api/v1/faculty/enrollments", {
    studentId: matchedStudent.studentId,
    courseId,
  });
}

export function summarizeFacultyRosterStats(rows: FacultyRosterStudentRow[]): FacultyRosterStats {
  const totalStudents = rows.length;
  const activeStudents = rows.filter((row) => row.status === "active").length;
  const inactiveStudents = rows.filter((row) => row.status === "inactive").length;
  const avgScore =
    totalStudents > 0
      ? Math.round(rows.reduce((sum, row) => sum + row.avgScore, 0) / totalStudents)
      : 0;
  const completion =
    totalStudents > 0
      ? Math.round(rows.reduce((sum, row) => sum + row.completionPercent, 0) / totalStudents)
      : 0;

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    avgScore,
    completion,
  };
}

export async function listClassRecentActivity(classId: string): Promise<ClassRecentActivity[]> {
  const courseId = toCourseId(classId);
  const bundles = await fetchFacultyAssignmentsWithSubmissions(courseId);
  const activities = bundles
    .flatMap(({ assignment, submissions }) =>
      submissions.map((submission) => ({
        assignmentName: assignment.name,
        submission,
      })),
    )
    .sort((left, right) => {
      return new Date(right.submission.submittedAt).getTime() - new Date(left.submission.submittedAt).getTime();
    })
    .slice(0, 8)
    .map((entry, index) => {
      const isGraded = entry.submission.marks !== null;
      return {
        id: index + 1,
        type: isGraded ? "graded" : "submission",
        message: isGraded
          ? `Graded ${entry.submission.studentName} for ${entry.assignmentName}`
          : `${entry.submission.studentName} submitted ${entry.assignmentName}`,
        time: formatRelativeTime(entry.submission.submittedAt),
        iconKey: isGraded ? "check" : "send",
        iconBg: isGraded ? "bg-green-50" : "bg-blue-50",
        iconColor: isGraded ? "text-green-600" : "text-[#5A7ACD]",
      } satisfies ClassRecentActivity;
    });
  return activities;
}

export async function listClassAssignments(classId: string): Promise<ClassAssignment[]> {
  const courseId = toCourseId(classId);
  const bundles = await fetchStudentAssignmentsWithSubmissions(courseId);
  return bundles.map(({ assignment, submissions }) => mapStudentClassAssignment(assignment, submissions));
}

export async function listFacultyAssignments(classId: string): Promise<FacultyAssignment[]> {
  const courseId = toCourseId(classId);
  const [bundles, enrollments] = await Promise.all([
    fetchFacultyAssignmentsWithSubmissions(courseId),
    listFacultyEnrollmentsByCourse(courseId),
  ]);
  const enrolledCount = enrollments.filter((enrollment) => enrollment.enrolledStatus === "ENROLLED").length;
  const totalStudents = enrolledCount > 0 ? enrolledCount : enrollments.length;
  const now = Date.now();

  return bundles.map(({ assignment, submissions }) => {
    const availableAt = assignment.availableFrom ? new Date(assignment.availableFrom).getTime() : null;
    const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
    let status: FacultyAssignment["status"] = "published";
    if (typeof availableAt === "number" && Number.isFinite(availableAt) && availableAt > now) {
      status = "draft";
    } else if (typeof dueAt === "number" && Number.isFinite(dueAt) && dueAt < now) {
      status = "closed";
    }

    return {
      id: String(assignment.id),
      name: assignment.name,
      language: assignment.languageName || "N/A",
      dueDate: formatDateTime(assignment.dueDate, "No due date"),
      submissions: submissions.length,
      totalStudents,
      status,
    };
  });
}
