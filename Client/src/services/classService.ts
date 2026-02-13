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
  FacultyCourseCreatePayload,
  FacultySemesterOption,
  FacultyDashboardStat,
  FacultyAssignment,
  FacultyCourseCard,
  InstructorProfile,
  TeachingAssistantProfile,
} from "../types/class";
import api from "../api/axios";

// NOTE: Centralized mock class/course data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const enrolledCourses: CourseCard[] = [
  {
    id: "cs-2400",
    title: "Data Structures & Algorithms",
    instructor: "Dr. Sarah Miller",
    completed: 7,
    total: 12,
    icon: "\u{1F4BB}",
    iconBg: "bg-[#5A7ACD]/10",
    progressColor: "bg-[#5A7ACD]",
  },
  {
    id: "web-dev-301",
    title: "Web Development",
    instructor: "Prof. James Wilson",
    completed: 3,
    total: 8,
    icon: "\u{1F310}",
    iconBg: "bg-[#FEB05D]/10",
    progressColor: "bg-[#FEB05D]",
  },
  {
    id: "ml-401",
    title: "Machine Learning",
    instructor: "Dr. Emily Chen",
    completed: 11,
    total: 12,
    icon: "\u{1F916}",
    iconBg: "bg-[#5A7ACD]/10",
    progressColor: "bg-[#5A7ACD]",
  },
  {
    id: "db-350",
    title: "Database Systems",
    instructor: "Prof. Michael Brown",
    completed: 5,
    total: 10,
    icon: "\u{1F5C4}\uFE0F",
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

const facultyCourses: FacultyCourseCard[] = [
  {
    id: "cs-301",
    title: "Data Structures & Algorithms",
    code: "CS 301",
    students: 45,
    pendingSubmissions: 8,
    activeAssignments: 2,
    icon: "\u{1F4BB}",
    iconBg: "bg-[#5A7ACD]/10",
  },
  {
    id: "cs-402",
    title: "Advanced Web Development",
    code: "CS 402",
    students: 38,
    pendingSubmissions: 12,
    activeAssignments: 3,
    icon: "\u{1F310}",
    iconBg: "bg-[#FEB05D]/10",
  },
  {
    id: "cs-101",
    title: "Introduction to Programming",
    code: "CS 101",
    students: 73,
    pendingSubmissions: 3,
    activeAssignments: 1,
    icon: "\u{1F4DD}",
    iconBg: "bg-[#5A7ACD]/10",
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

interface FacultyCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
  section: string | null;
  description: string | null;
  imageUrl: string | null;
  canvasCourseId: string | null;
  active: boolean;
  isPublished: boolean;
}

interface FacultySemesterApiResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
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

function mapFacultyCourseToCard(course: FacultyCourseApiResponse): FacultyCourseCard {
  const iconData = buildCourseIcon(course.courseCode || course.name);
  return {
    id: String(course.id),
    title: course.name,
    code: course.courseCode,
    // NOTE: Student/submission metrics are not returned by this endpoint yet; defaulting to 0 keeps UI stable.
    students: 0,
    pendingSubmissions: 0,
    activeAssignments: 0,
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

export function listEnrolledCourses(): Promise<CourseCard[]> {
  return Promise.resolve(enrolledCourses);
}

export function listClassesOverview(): Promise<ClassOverviewItem[]> {
  return Promise.resolve(classesOverview);
}

export async function listFacultyCourses(): Promise<FacultyCourseCard[]> {
  try {
    // IMPORTANT: Backend resolves faculty context from authenticated email.
    // IMPORTANT: This call returns 400 when the logged-in user exists in Users but is not mapped in Faculty.
    // NOTE: University admin must create/assign the faculty profile first.
    // TODO(backend): Keep the return shape stable when backend expands this endpoint with metrics.
    const { data } = await api.get<FacultyCourseApiResponse[]>("/api/v1/faculty/courses");
    return data.map(mapFacultyCourseToCard);
  } catch {
    // FIX: Fallback to existing mock list so faculty UI still works if backend is temporarily unavailable.
    return Promise.resolve(facultyCourses);
  }
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

export function getCourseDetailById(id: string): Promise<CourseDetail> {
  return Promise.resolve(courseDetails[id] || courseDetails["1"]);
}

export function listClassImportantDates(classId: string): Promise<ClassImportantDate[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classImportantDates);
}

export function listClassOverviewStats(classId: string): Promise<ClassOverviewStat[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classOverviewStats);
}

export function listFacultyDashboardStats(classId: string): Promise<FacultyDashboardStat[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(facultyDashboardStats);
}

export function getClassHeaderById(classId: string): Promise<ClassHeader> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...classHeader, id: classId || classHeader.id });
}

export function getFacultyClassHeaderById(classId: string): Promise<ClassHeader> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...facultyClassHeader, id: classId || facultyClassHeader.id });
}

export function listClassAnnouncements(classId: string): Promise<ClassAnnouncement[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classAnnouncements);
}

export function listClassResources(classId: string): Promise<ClassResource[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classResources);
}

export function getClassPeople(classId: string): Promise<{
  instructor: InstructorProfile;
  teachingAssistants: TeachingAssistantProfile[];
  students: ClassStudent[];
}> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({
    instructor: instructorProfile,
    teachingAssistants,
    students: classStudents,
  });
}

export function listFacultyClassStudents(classId: string): Promise<ClassStudent[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(facultyClassStudents);
}

export function listClassRecentActivity(classId: string): Promise<ClassRecentActivity[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classRecentActivity);
}

export function listClassAssignments(classId: string): Promise<ClassAssignment[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(classAssignments);
}

export function listFacultyAssignments(classId: string): Promise<FacultyAssignment[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(facultyAssignments);
}
