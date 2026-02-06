import { createBrowserRouter } from "react-router";
import { GradeFlowDashboard } from "./components/GradeFlowDashboard";
import { AssignmentPage } from "./components/AssignmentPage";
import { CoursePage } from "./components/CoursePage";
import { ClassPage } from "./components/ClassPage";
import { FacultyClassPage } from "./components/FacultyClassPage";
import FacultyGradingPage from "./components/FacultyGradingPage";
import SignUpPage from "./components/SignUpPage";
import SignInPage from "./components/SignInPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: GradeFlowDashboard,
  },
  {
    path: "/class/:classId",
    Component: ClassPage,
  },
  {
    path: "/faculty/class/:classId",
    Component: FacultyClassPage,
  },
  {
    path: "/course/:courseId",
    Component: CoursePage,
  },
  {
    path: "/assignment/:assignmentId",
    Component: AssignmentPage,
  },
  {
    path: "/assignment/:assignmentId/grade/:submissionId",
    Component: FacultyGradingPage,
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