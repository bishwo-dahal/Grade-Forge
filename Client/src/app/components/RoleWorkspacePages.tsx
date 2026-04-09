import { useNavigate } from "react-router";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { StudentMyCoursesPage as StudentMyCoursesWorkspacePage } from "./StudentMyCoursesPage";
import { StudentAssignmentsPage as StudentAssignmentsWorkspacePage } from "./StudentAssignmentsPage";
import { FacultyMyClassesPage as FacultyMyClassesWorkspacePage } from "./FacultyMyClassesPage";

interface RoleWorkspacePageProps {
  roleView: "student" | "faculty";
  title: string;
  description: string;
}

function RoleWorkspacePage({ roleView, title, description }: RoleWorkspacePageProps) {
  const navigate = useNavigate();
  const loggedInUser = getAuthenticatedUser();
  const fallbackName = roleView === "faculty" ? "Dr. Sarah Miller" : "Alex Johnson";
  const fallbackEmail = roleView === "faculty" ? "smiller@university.edu" : "alex@university.edu";
  const displayName = loggedInUser?.name ?? fallbackName;
  const displayEmail = loggedInUser?.email ?? fallbackEmail;
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const topBar = (
    <AuthTopBar
      roleView={roleView}
      profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
      // NOTE: Reuse the dashboard search copy so all role workspaces share one top-nav behavior.
      searchPlaceholder="Search calendar, assignments..."
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  return (
    <AuthShell
      roleView={roleView}
      topBar={topBar}
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-8">
          <h1 className="text-[34px] leading-none font-bold text-[#2B2A2A]">{title}</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">{description}</p>

          {/* NOTE: These route shells are intentionally empty placeholders until feature-specific content is added. */}
          <section className="mt-8 rounded-2xl border border-dashed border-[#C7CDDA] bg-white/70 p-8">
            <p className="text-[14px] text-[#6E7890]">Empty page placeholder. You can fill this content later.</p>
          </section>
        </main>
      }
    />
  );
}

// REFACTOR: Student My Courses now has a dedicated page implementation; keep this export for stable route imports.
export function StudentMyCoursesPage() {
  return <StudentMyCoursesWorkspacePage />;
}

// NOTE: Student workspace placeholders keep navigation functional while feature content is developed iteratively.
export function StudentAssignmentsPage() {
  // REFACTOR: Student Assignments now has a dedicated page implementation; keep this export for stable route imports.
  return <StudentAssignmentsWorkspacePage />;
}

export function StudentCalendarPage() {
  return <RoleWorkspacePage roleView="student" title="Calendar" description="View your class and assignment schedule." />;
}

export function StudentMaterialsPage() {
  return <RoleWorkspacePage roleView="student" title="Materials" description="Access shared course resources and files." />;
}

export function StudentDiscussionsPage() {
  return <RoleWorkspacePage roleView="student" title="Discussions" description="Join class conversations and threads." />;
}

// NOTE: Faculty workspace placeholders mirror sidebar entries so every navigation target resolves to a route now.
export function FacultyMyClassesPage() {
  // REFACTOR: Faculty My Classes now has a dedicated DB-backed implementation; keep this export stable for route imports.
  return <FacultyMyClassesWorkspacePage />;
}

export function FacultyGradingHubPage() {
  return <RoleWorkspacePage roleView="faculty" title="Grading" description="Review and grade student submissions." />;
}

export function FacultyStudentsPage() {
  return <RoleWorkspacePage roleView="faculty" title="Students" description="View student rosters and statuses." />;
}

export function FacultySchedulePage() {
  return <RoleWorkspacePage roleView="faculty" title="Schedule" description="Plan deadlines, classes, and grading windows." />;
}
