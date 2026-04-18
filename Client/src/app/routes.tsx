import React, { Suspense, lazy, type ComponentProps, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { GradeForgeDashboard } from "./components/GradeForgeDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import SignUpPage from "./components/SignUpPage";
import SignInPage from "./components/SignInPage";
import LandingPage from "./components/LandingPage";

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-gray-600">
      Loading...
    </div>
  );
}

function lazyDefault<T extends ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  const LazyComponent = lazy(loader);
  return function LazyDefaultRoute(props: ComponentProps<T>) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

function lazyNamed<T extends ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] };
  });

  return function LazyNamedRoute(props: ComponentProps<T>) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

const AssignmentPage = lazyNamed(() => import("./components/AssignmentPage"), "AssignmentPage");
const CoursePage = lazyNamed(() => import("./components/CoursePage"), "CoursePage");
const ClassPage = lazyNamed(() => import("./components/ClassPage"), "ClassPage");
const FacultyClassPage = lazyNamed(() => import("./components/FacultyClassPage"), "FacultyClassPage");
const FacultyGradingPage = lazyDefault(() => import("./components/FacultyGradingPage"));
const NotFoundPage = lazyDefault(() => import("./components/NotFoundPage"));
const SettingsPage = lazyNamed(() => import("./components/SettingsPage"), "SettingsPage");
const UniversityAdminWorkspace = lazyNamed(
  () => import("./components/UniversityAdminWorkspace"),
  "UniversityAdminWorkspace",
);
const UniversityCoursesPage = lazyNamed(() => import("./components/UniversityCoursesPage"), "UniversityCoursesPage");
const UniversityFacultyPage = lazyNamed(() => import("./components/UniversityFacultyPage"), "UniversityFacultyPage");
const UniversityLanguagesPage = lazyNamed(
  () => import("./components/UniversityLanguagesPage"),
  "UniversityLanguagesPage",
);
const UniversitySemestersPage = lazyNamed(
  () => import("./components/UniversitySemestersPage"),
  "UniversitySemestersPage",
);
const UniversityMonitorPage = lazyNamed(() => import("./components/UniversityMonitorPage"), "UniversityMonitorPage");
const UniversityTrainingDataPage = lazyNamed(
  () => import("./components/UniversityTrainingDataPage"),
  "UniversityTrainingDataPage",
);
const UniversityManageUsersPage = lazyNamed(
  () => import("./components/UniversityManageUsersPage"),
  "UniversityManageUsersPage",
);
const FacultyCreateClassPage = lazyNamed(
  () => import("./components/FacultyCreateClassPage"),
  "FacultyCreateClassPage",
);
const FacultyCreateAssignmentPage = lazyNamed(
  () => import("./components/FacultyCreateAssignmentPage"),
  "FacultyCreateAssignmentPage",
);
const FacultyGradingAssignmentDetailPage = lazyNamed(
  () => import("./components/FacultyGradingAssignmentDetailPage"),
  "FacultyGradingAssignmentDetailPage",
);
const FacultyClassStudentDetailPage = lazyNamed(
  () => import("./components/faculty/FacultyClassStudentDetailPage"),
  "FacultyClassStudentDetailPage",
);
const FacultyMainGroupDetailPage = lazyNamed(
  () => import("./components/faculty/FacultyMainGroupDetailPage"),
  "FacultyMainGroupDetailPage",
);
const CompleteStudentRegistrationPage = lazyDefault(() => import("./components/CompleteStudentRegistrationPage"));
const FacultyMyClassesPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "FacultyMyClassesPage");
const FacultySchedulePage = lazyNamed(() => import("./components/RoleWorkspacePages"), "FacultySchedulePage");
const FacultyStudentsPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "FacultyStudentsPage");
const StudentAssignmentsPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "StudentAssignmentsPage");
const StudentCalendarPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "StudentCalendarPage");
const StudentDiscussionsPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "StudentDiscussionsPage");
const StudentMaterialsPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "StudentMaterialsPage");
const StudentMyCoursesPage = lazyNamed(() => import("./components/RoleWorkspacePages"), "StudentMyCoursesPage");
const FacultyRubricsPage = lazyNamed(
  () => import("./components/faculty/rubrics/FacultyRubricsPage"),
  "FacultyRubricsPage",
);
const FacultyRubricCreatePage = lazyNamed(
  () => import("./components/faculty/rubrics/FacultyRubricCreatePage"),
  "FacultyRubricCreatePage",
);
const FacultyRubricDetailPage = lazyNamed(
  () => import("./components/faculty/rubrics/FacultyRubricDetailPage"),
  "FacultyRubricDetailPage",
);
const FacultyGradingAssistantsPage = lazyNamed(
  () => import("./components/faculty/gradingAssistants/FacultyGradingAssistantsPage"),
  "FacultyGradingAssistantsPage",
);
const GradingAssistantCoursesPage = lazyNamed(
  () => import("./components/gradingAssistant/GradingAssistantCoursesPage"),
  "GradingAssistantCoursesPage",
);
const GradingAssistantClassPage = lazyNamed(
  () => import("./components/gradingAssistant/GradingAssistantClassPage"),
  "GradingAssistantClassPage",
);
const GradingAssistantAssignmentDetailPage = lazyNamed(
  () => import("./components/AssignmentDetailPage"),
  "GradingAssistantAssignmentDetailPage",
);
const AssignmentGradingPage = lazyNamed(
  () => import("./components/AssignmentGradingPage"),
  "AssignmentGradingPage",
);
const FacultySpeedGradingPage = lazyNamed(
  () => import("./components/FacultySpeedGradingPage"),
  "FacultySpeedGradingPage",
);

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
        <AssignmentGradingPage />
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
    path: "/faculty/class/:classId/assignments/:assignmentId/edit",
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
        {/* CLEANUP: Redirect legacy grading hub links because faculty grading now lives only inside class assignment flows. */}
        <Navigate to="/faculty/my-classes" replace />
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
      {
        path: "manage-users",
        Component: UniversityManageUsersPage,
      },
      {
        path: "monitor",
        Component: UniversityMonitorPage,
      },
      {
        path: "training-data",
        Component: UniversityTrainingDataPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
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
        <Navigate to="./assignments" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/students/:studentId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyClassStudentDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/groups/:mainGroupId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyMainGroupDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/:section",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyClassPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/assignment/:assignmentId/submission/:submissionId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <AssignmentGradingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/speed-grading/:assignmentId",
    element: (
      // NOTE: Dedicated speed-grading route keeps faculty in one assignment-focused grading queue.
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultySpeedGradingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty/class/:classId/assignment/:assignmentId",
    element: (
      <ProtectedRoute allowedRoles={["FACULTY"]}>
        <FacultyGradingAssignmentDetailPage />
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
    path: "/faculty/assignment/:assignmentId/submission/:submissionId",
    element: (
      // NOTE: Faculty uses this route when deep-linking directly to a specific submission.
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
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
