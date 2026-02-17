import React from "react";
import { createBrowserRouter } from "react-router";
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
import { UniversityAdminDashboard } from "./components/UniversityAdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    element: (
      // NOTE: Student/Faculty shared shell; university admin has a separate dashboard.
      <ProtectedRoute allowedRoles={["STUDENT", "FACULTY"]}>
        <GradeForgeDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      // NOTE: Settings shell is student/faculty-only; university admin uses dedicated university pages.
      <ProtectedRoute allowedRoles={["STUDENT", "FACULTY"]}>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/university-admin",
    element: (
      // NOTE: University dashboard is strictly limited to UNIVERSITY_ADMIN role.
      <ProtectedRoute allowedRoles={["UNIVERSITY_ADMIN"]}>
        <UniversityAdminDashboard />
      </ProtectedRoute>
    ),
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
