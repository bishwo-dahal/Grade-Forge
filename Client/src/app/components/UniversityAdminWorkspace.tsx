import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";

export function UniversityAdminWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "University Admin";
  const displayEmail = loggedInUser?.email ?? "admin@university.edu";

  const displayInitials = useMemo(() => {
    // NOTE: Keep initials derived from auth session so top-bar identity remains consistent across role workspaces.
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "UA"
    );
  }, [displayName]);

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const goToSettingsSection = (section: "profile" | "security" | "notifications" | "appearance") => {
    navigate(`/university-admin/settings?section=${section}`);
  };

  const isSettingsRoute = location.pathname.startsWith("/university-admin/settings");

  return (
    <AuthShell
      roleView="university"
      topBar={
        <AuthTopBar
          roleView="university"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search faculty, semesters, courses, languages, activity..."
          isSettingsActive={isSettingsRoute}
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      // NOTE: Nested university routes render inside the shared shell main area through this outlet.
      mainContent={<Outlet />}
    />
  );
}
