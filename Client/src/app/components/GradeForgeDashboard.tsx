import { Navigate, useNavigate } from "react-router";
import { GradeForgeMain } from "./GradeForgeMain";
import { GradeForgeRightPanel } from "./GradeForgeRightPanel";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import { clearAuthenticated, getAuthenticatedRole, getAuthenticatedUser } from "../auth";

export function GradeForgeDashboard() {
  const navigate = useNavigate();
  const role = getAuthenticatedRole();
  const loggedInUser = getAuthenticatedUser();

  if (role === "UNIVERSITY_ADMIN") {
    // NOTE: University admins should never render student/faculty dashboard UI.
    return <Navigate to="/university-admin" replace />;
  }

  // NOTE: View mode is now role-driven; removed manual student/faculty switching.
  const viewMode: "student" | "faculty" = role === "FACULTY" ? "faculty" : "student";
  const fallbackName = viewMode === "faculty" ? "Dr. Sarah Miller" : "Alex Johnson";
  const fallbackEmail = viewMode === "faculty" ? "@smiller.edu" : "@alexj.edu";
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
      searchPlaceholder={viewMode === "faculty" ? "Search students, assignments, classes..." : "Search courses, lessons, grad..."}
      // NOTE: Student dashboard keeps the enroll CTA; faculty workflow intentionally has no primary CTA in this position.
      primaryActionLabel={viewMode === "student" ? "Enroll in Class" : undefined}
      onPrimaryAction={() => undefined}
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  return (
    <AuthShell
      roleView={viewMode}
      topBar={topBar}
      // NOTE: Main workflow content stays split by role to avoid mixing student and faculty business flows.
      mainContent={viewMode === "student" ? <GradeForgeMain /> : <FacultyMain />}
      // NOTE: Right panel remains role-specific since data and widgets are fundamentally different.
      rightPanel={viewMode === "student" ? <GradeForgeRightPanel /> : <FacultyRightPanel />}
    />
  );
}
