import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { GradeForgeDashboard } from "./components/GradeForgeDashboard";
import { AssignmentPage } from "./components/AssignmentPage";
import { CoursePage } from "./components/CoursePage";
import { ClassPage } from "./components/ClassPage";
import { FacultyClassPage } from "./components/FacultyClassPage";
import FacultyGradingPage from "./components/FacultyGradingPage";
import SignUpPage from "./components/SignUpPage";
import SignInPage from "./components/SignInPage";
import LandingPage from "./components/LandingPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { SettingsPage } from "./components/SettingsPage";
import { UniversityAdminWorkspace } from "./components/UniversityAdminWorkspace";
import { UniversityCoursesPage } from "./components/UniversityCoursesPage";
import { UniversityFacultyPage } from "./components/UniversityFacultyPage";
import { UniversityLanguagesPage } from "./components/UniversityLanguagesPage";
import { UniversitySemestersPage } from "./components/UniversitySemestersPage";
import { FacultyCreateClassPage } from "./components/FacultyCreateClassPage";
import { FacultyCreateAssignmentPage } from "./components/FacultyCreateAssignmentPage";
import CompleteStudentRegistrationPage from "./components/CompleteStudentRegistrationPage";
import {
  FacultyDiscussionsPage,
  FacultyGradingHubPage,
  FacultyMaterialsPage,
  FacultyMyClassesPage,
  FacultySchedulePage,
  FacultyStudentsPage,
  StudentAssignmentsPage,
  StudentCalendarPage,
  StudentDiscussionsPage,
  StudentMaterialsPage,
  StudentMyCoursesPage,
} from "./components/RoleWorkspacePages";
import { FacultyRubricsPage } from "./components/faculty/rubrics/FacultyRubricsPage";
import { FacultyRubricCreatePage } from "./components/faculty/rubrics/FacultyRubricCreatePage";
import { FacultyRubricDetailPage } from "./components/faculty/rubrics/FacultyRubricDetailPage";
import { FacultyGradingAssistantsPage } from "./components/faculty/gradingAssistants/FacultyGradingAssistantsPage";
import { GradingAssistantCoursesPage } from "./components/gradingAssistant/GradingAssistantCoursesPage";
import { GradingAssistantClassPage } from "./components/gradingAssistant/GradingAssistantClassPage";
import { GradingAssistantAssignmentDetailPage } from "./components/gradingAssistant/GradingAssistantAssignmentDetailPage";
import { GradingAssistantSubmissionDetailPage } from "./components/gradingAssistant/GradingAssistantSubmissionDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    element: (
      // NOTE: Student/Faculty shared shell; university admin has a separate dashboard.
      <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "GRADING_ASSISTANT"]}>
        <GradeForgeDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      // NOTE: Settings shell is student/faculty-only; university admin uses dedicated university pages.
      <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "GRADING_ASSISTANT"]}>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/grading-assistant/courses",
    element: (
      <ProtectedRoute allowedRoles={["GRADING_ASSISTANT"]}>
        <GradingAssistantCoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/grading-assistant/class/:classId",
    element: (
      <ProtectedRoute allowedRoles={["GRADING_ASSISTANT"]}>
        <GradingAssistantClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/grading-assistant/class/:classId/assignment/:assignmentId",
    element: (
      <ProtectedRoute allowedRoles={["GRADING_ASSISTANT"]}>
        <GradingAssistantAssignmentDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/grading-assistant/class/:classId/assignment/:assignmentId/submission/:submissionId",
    element: (
      <ProtectedRoute allowedRoles={["GRADING_ASSISTANT"]}>
        <GradingAssistantSubmissionDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/complete-registration",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <CompleteStudentRegistrationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/my-courses",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentMyCoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/assignments",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentAssignmentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/calendar",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentCalendarPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/materials",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentMaterialsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/discussions",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentDiscussionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/my-classes",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyMyClassesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/my-classes/create",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyCreateClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/assignments/create",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyCreateAssignmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/grading",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyGradingHubPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/rubrics",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyRubricsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/rubrics/new",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyRubricCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/rubrics/:rubricId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyRubricDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/grading-assistants",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyGradingAssistantsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/students",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyStudentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/schedule",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultySchedulePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/materials",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyMaterialsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/discussions",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyDiscussionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/university-admin",
    element: (
      // REFACTOR: University admin now uses nested section routes under one shared shell.
      <ProtectedRoute allowedRoles={["UNIVERSITY_ADMIN"]}>
        <UniversityAdminWorkspace />
      </ProtectedRoute>
    ),
    children: [
      {
        // NOTE: Default university section lands on Faculty management.
        index: true,
        element: <Navigate to="/university-admin/faculty" replace />,
      },
      {
        path: "faculty",
        Component: UniversityFacultyPage,
      },
      {
        path: "semesters",
        Component: UniversitySemestersPage,
      },
      {
        path: "courses",
        Component: UniversityCoursesPage,
      },
      {
        path: "languages",
        Component: UniversityLanguagesPage,
      },
    ],
  },
  {
    path: "/class/:classId",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <ClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/course/:courseId",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <CoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assignment/:assignmentId",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <AssignmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/assignment/:assignmentId",
    element: (
      // NOTE: Faculty uses this route to open assignment details from class-management Assignments tab.
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <AssignmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assignment/:assignmentId/grade/:submissionId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyGradingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
  {
    path: "/signin",
    Component: SignInPage,
  },
]);
