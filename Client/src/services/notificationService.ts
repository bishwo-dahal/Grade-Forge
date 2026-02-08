import { AlertCircle, Bell } from "lucide-react";
import type {
  AlertItem,
  CalendarDay,
  DeadlineItem,
  NotificationItem,
  TaskItem,
} from "../types/notification";

// NOTE: Centralized mock notification/calendar data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const studentAlerts: NotificationItem[] = [
  {
    id: 1,
    title: "New Assignment Posted",
    description: "Data Structures & Algorithms - Assignment 9",
    time: "2h ago",
    type: "assignment",
  },
  {
    id: 2,
    title: "Grade Updated",
    description: "Web Development - Assignment 4: 95%",
    time: "5h ago",
    type: "grade",
  },
  {
    id: 3,
    title: "Code Review Completed",
    description: "Prof. Wilson reviewed your submission",
    time: "1d ago",
    type: "message",
  },
];

const facultyAlerts: AlertItem[] = [
  {
    id: 1,
    title: "Late Submission",
    description: "Marcus W. submitted Assignment 7 late",
    time: "1h ago",
    type: "late",
    icon: AlertCircle,
    color: "text-[#FEB05D]",
  },
  {
    id: 2,
    title: "Question Posted",
    description: "Sarah K. asked about pointer concepts",
    time: "3h ago",
    type: "question",
    icon: Bell,
    color: "text-[#5A7ACD]",
  },
  {
    id: 3,
    title: "Plagiarism Alert",
    description: "Similarity detected in 2 submissions",
    time: "5h ago",
    type: "warning",
    icon: AlertCircle,
    color: "text-[#FEB05D]",
  },
];

const gradingTasks: TaskItem[] = [
  { id: 1, text: "Review BST implementations (8 pending)", completed: false },
  { id: 2, text: "Grade REST API assignments (12 pending)", completed: false },
  { id: 3, text: "Update Assignment 9 rubric", completed: true },
  { id: 4, text: "Post Week 8 coding challenge", completed: false },
];

const studentTaskDays: CalendarDay[] = [24, 28];
const facultyDeadlineDays: CalendarDay[] = [24, 28, 31];

const upcomingDeadlines: DeadlineItem[] = [
  {
    title: "Data Structures Quiz",
    className: "CS 201",
    dueDate: "Feb 6",
    type: "quiz",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Web Dev Project",
    className: "CS 340",
    dueDate: "Feb 8",
    type: "assignment",
    color: "bg-[#E0DBFF] text-purple-600",
  },
  {
    title: "Database Design",
    className: "CS 370",
    dueDate: "Feb 10",
    type: "project",
    color: "bg-orange-100 text-orange-600",
  },
];

export function listStudentAlerts(): Promise<NotificationItem[]> {
  return Promise.resolve(studentAlerts);
}

export function listFacultyAlerts(): Promise<AlertItem[]> {
  return Promise.resolve(facultyAlerts);
}

export function listGradingTasks(): Promise<TaskItem[]> {
  return Promise.resolve(gradingTasks);
}

export function getStudentTaskDays(): Promise<CalendarDay[]> {
  return Promise.resolve(studentTaskDays);
}

export function getFacultyDeadlineDays(): Promise<CalendarDay[]> {
  return Promise.resolve(facultyDeadlineDays);
}

export function listUpcomingDeadlines(): Promise<DeadlineItem[]> {
  return Promise.resolve(upcomingDeadlines);
}
