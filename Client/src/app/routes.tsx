import React from "react";
import { createBrowserRouter } from "react-router";
import { GradeFlowDashboard } from "./components/GradeFlowDashboard";
import { AssignmentPage } from "./components/AssignmentPage";
import { CoursePage } from "./components/CoursePage";
import { ClassPage } from "./components/ClassPage";
import { FacultyClassPage } from "./components/FacultyClassPage";
import FacultyGradingPage from "./components/FacultyGradingPage";
import SignUpPage from "./components/SignUpPage";
import SignInPage from "./components/SignInPage";
import LandingPage from "./components/LandingPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <GradeFlowDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:classId",
    element: (
      <ProtectedRoute>
        <ClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId",
    element: (
      <ProtectedRoute>
        <FacultyClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/course/:courseId",
    element: (
      <ProtectedRoute>
        <CoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assignment/:assignmentId",
    element: (
      <ProtectedRoute>
        <AssignmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assignment/:assignmentId/grade/:submissionId",
    element: (
      <ProtectedRoute>
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