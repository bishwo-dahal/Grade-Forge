import { Navigate, useNavigate } from "react-router";
import { GradeForgeMain } from "./GradeForgeMain";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";
import { GradingAssistantMain } from "./GradingAssistantMain";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import { clearAuthenticated, getAuthenticatedRole, getAuthenticatedUser } from "../auth";

export function GradeForgeDashboard() {
  // NOTE: This component is now the only dashboard shell entrypoint; legacy GradeFlowDashboard was removed as dead code.
  const navigate = useNavigate();
  const role = getAuthenticatedRole();
  const loggedInUser = getAuthenticatedUser();

  if (role === "UNIVERSITY_ADMIN") {
    // NOTE: University admins should never render student/faculty dashboard UI.
    return <Navigate to="/university-admin" replace />;
  }

  // NOTE: View mode is now role-driven; grading assistant has its own dashboard.
  const viewMode: "student" | "faculty" | "gradingAssistant" =
    role === "FACULTY" ? "faculty" : role === "GRADING_ASSISTANT" ? "gradingAssistant" : "student";
  const fallbackName =
    viewMode === "faculty" ? "Dr. Sarah Miller" : viewMode === "gradingAssistant" ? "Grading Assistant" : "Alex Johnson";
  const fallbackEmail =
    viewMode === "faculty" ? "@smiller.edu" : viewMode === "gradingAssistant" ? "@ga.edu" : "@alexj.edu";
  const displayName = loggedInUser?.name ?? fallbackName;
  const displayEmail = loggedInUser?.email ?? fallbackEmail;
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const goToSettingsSection = (section: "profile" | "security" | "notifications" | "appearance") => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const topBar = (
    <AuthTopBar
      roleView={viewMode}
      profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
      showSearch={false}
      pageTitle="Dashboard"
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  const mainContent =
    viewMode === "student"
      ? <GradeForgeMain />
      : viewMode === "gradingAssistant"
        ? <GradingAssistantMain />
        : <FacultyMain />;

  const rightPanel =
    viewMode === "student" || viewMode === "gradingAssistant" ? undefined : <FacultyRightPanel />;

  return (
    <AuthShell
      roleView={viewMode}
      topBar={topBar}
      mainContent={mainContent}
      rightPanel={rightPanel}
    />
  );
}
