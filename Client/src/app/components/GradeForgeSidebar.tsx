import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  Settings,
  Users,
  UserPlus,
  Code2,
  ListChecks,
  Monitor,
  UserSearch,
  Brain,
  HelpCircle,
  LogOut,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { clearAuthenticated } from "../auth";
import { buildLogoutConfirmationMessage, queueAuthNotification } from "../authNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { SidebarPinnedCollapseFooter } from "./layout/SidebarPinnedCollapseFooter";
import { useSidebarPinnedCollapsed } from "./layout/useSidebarPinnedCollapsed";

interface GradeForgeSidebarProps {
  viewMode: "student" | "faculty" | "gradingAssistant" | "university";
  compactOnly?: boolean;
}

interface SidebarNavItem {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: string;
  matchPrefixes?: string[];
}

export function GradeForgeSidebar({ viewMode, compactOnly = false }: GradeForgeSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { pinnedCollapsed } = useSidebarPinnedCollapsed();
  const isDashboardRoute = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  // NOTE: Sidebar stays full-width on dashboard unless the user pins “keep collapsed”; other routes use the icon rail.
  const isCollapsedMode = compactOnly || pinnedCollapsed || !isDashboardRoute;

  // NOTE: Sidebar routes are role-specific so student and faculty can navigate to distinct page shells.
  const studentItems: SidebarNavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: BookOpen, label: "My Courses", to: "/student/my-courses" },
    { icon: FileText, label: "Assignments", to: "/student/assignments" },
    { icon: Calendar, label: "Calendar", to: "/student/calendar" },
  ];

  const facultyItems: SidebarNavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: BookOpen, label: "My Classes", to: "/faculty/my-classes" },
    // CLEANUP: Standalone faculty grading hub was removed so grading stays scoped to each class/assignment workflow.
    { icon: ListChecks, label: "Rubrics", to: "/faculty/rubrics" },
    { icon: UserPlus, label: "Grading Assistants", to: "/faculty/grading-assistants" },
    { icon: Calendar, label: "Calendar", to: "/faculty/schedule" },
  ];

  const gradingAssistantItems: SidebarNavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: BookOpen, label: "Courses", to: "/grading-assistant/courses", matchPrefixes: ["/grading-assistant/class"] },
  ];

  // NOTE: University navigation is section-based and mapped to nested /university-admin/* routes.
  const universityItems: SidebarNavItem[] = [
    { icon: Users, label: "Faculty", to: "/university-admin/faculty" },
    { icon: Calendar, label: "Semesters", to: "/university-admin/semesters" },
    { icon: BookOpen, label: "Courses", to: "/university-admin/courses" },
    // NOTE: Languages management has its own university section route for easier backend ownership boundaries.
    { icon: Code2, label: "Languages", to: "/university-admin/languages" },
    { icon: UserSearch, label: "Manage Users", to: "/university-admin/manage-users" },
    { icon: Brain, label: "ML training data", to: "/university-admin/training-data" },
    { icon: Monitor, label: "Monitor", to: "/university-admin/monitor" },
  ];

  const learningItems =
    viewMode === "student"
      ? studentItems
      : viewMode === "faculty"
        ? facultyItems
        : viewMode === "gradingAssistant"
          ? gradingAssistantItems
          : universityItems;
  const resourceItems: SidebarNavItem[] =
    viewMode === "university"
      ? []
      : viewMode === "gradingAssistant"
        ? []
        : [];
  const settingsItem: SidebarNavItem | null =
    viewMode === "student" ||
    viewMode === "faculty" ||
    viewMode === "gradingAssistant" ||
    viewMode === "university"
      ? { icon: Settings, label: "Settings", to: "/settings", matchPrefixes: ["/settings"] }
      : null;

  const isItemActive = (item: SidebarNavItem): boolean => {
    const prefixes = [item.to, ...(item.matchPrefixes ?? [])];
    return prefixes.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
  };

  const sidebarShellClass = !isCollapsedMode
    ? "w-60"
    : compactOnly || pinnedCollapsed
      ? "w-[78px]"
      : "group/sidebar w-[78px] hover:w-60 focus-within:w-60";
  const collapsibleTextClass = !isCollapsedMode
    ? ""
    : compactOnly || pinnedCollapsed
      ? "pointer-events-none max-w-0 overflow-hidden opacity-0 translate-x-1.5"
      : // FIX: Animate labels with max-width instead of toggling to w-auto so hover expansion feels smoother and less abrupt.
        "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100";
  const collapsibleHeadingClass = !isCollapsedMode
    ? ""
    : compactOnly || pinnedCollapsed
      ? "pointer-events-none max-h-0 overflow-hidden opacity-0 mb-0"
      : // FIX: Keep section headings in flow and fade them in so the collapsed rail expands without a visual pop.
        "max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-300 ease-out group-hover/sidebar:max-h-8 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-h-8 group-focus-within/sidebar:opacity-100";
  const navLinkLayoutClass = !isCollapsedMode
    ? "gap-3 px-3 py-2.5"
    : compactOnly || pinnedCollapsed
      ? "justify-center gap-0 px-0 py-2.5"
      : // FIX: Restore icon-label spacing during hover expansion while keeping the collapsed icon rail centered.
        "justify-center gap-0 px-0 py-2.5 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3 group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-3 group-focus-within/sidebar:px-3";
  const navLabelClass = !isCollapsedMode
    ? ""
    : compactOnly || pinnedCollapsed
      ? "pointer-events-none max-w-0 overflow-hidden opacity-0 translate-x-1.5"
      : // FIX: Match nav label motion with the sidebar shell so icon/text spacing stays stable while the rail opens.
        "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100";

  const handleConfirmLogout = () => {
    queueAuthNotification(buildLogoutConfirmationMessage(viewMode));
    setIsLogoutDialogOpen(false);
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const bottomPinnedBorderClass = "border-t border-white/15";
  const bottomLogoutRowClass =
    !isCollapsedMode
      ? "px-4"
      : compactOnly || pinnedCollapsed
        ? "flex justify-center px-1"
        : "px-4";

  const primaryNavHeading =
    viewMode === "student"
      ? "Learning"
      : viewMode === "gradingAssistant"
        ? "Grading"
        : viewMode === "faculty"
          ? "Teaching"
          : "Administration";

  return (
    <>
    <aside
      className={`${sidebarShellClass} bg-[#7A1226] border-r border-[#D1BCBF] flex min-h-0 flex-shrink-0 flex-col self-stretch transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      {/* NOTE: Role switcher was removed intentionally; access is controlled by auth role + route guards. */}
      <div
        className={`h-[64px] border-b border-[#C9C4C9] bg-white ${isCollapsedMode ? "px-0 flex items-center justify-center" : "px-5 flex items-center"}`}
      >
        <Link
          to="/dashboard"
          className={`flex items-center hover:opacity-90 transition-[opacity,transform] duration-300 ease-out ${isCollapsedMode ? "justify-center w-12 h-12 rounded-[14px]" : "gap-3"}`}
          aria-label="Go to dashboard"
        >
          <img
            src="/favicon.svg"
            alt="Grade Forge"
            className="h-7 w-7 flex-shrink-0 rounded-[10px] border border-[#C9C4C9]"
          />
          {!isCollapsedMode && (
            <span className={`text-[14px] font-semibold text-[#1F2430] whitespace-nowrap ${collapsibleTextClass}`}>
              Grade Forge
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`min-h-0 flex-1 overflow-y-auto px-4 ${isCollapsedMode ? "overflow-x-hidden" : ""}`}>
        {/* Learning Section */}
        <div className="mb-6">
          <div className={`px-3 mb-2 ${viewMode === "faculty" || viewMode === "university" ? "pt-3" : ""} ${collapsibleHeadingClass}`}>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D8B7BE]">
              {primaryNavHeading}
            </span>
          </div>
          <ul className="space-y-1">
            {learningItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} ${
                    isItemActive(item)
                      ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                      : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                  <span className={`text-[14px] whitespace-nowrap ${navLabelClass}`}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources Section */}
        {resourceItems.length > 0 && (
          <div>
            <div className={`px-3 mb-2 ${collapsibleHeadingClass}`}>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D8B7BE]">
                Resources
              </span>
            </div>
            <ul className="space-y-1">
              {resourceItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} ${
                      isItemActive(item)
                        ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                        : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                    <span className={`text-[14px] whitespace-nowrap ${navLabelClass}`}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full page navigation: /docs is served by Spring (VitePress), not the React router. */}
        <div className="mt-6">
          <div className={`px-3 mb-2 ${collapsibleHeadingClass}`}>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D8B7BE]">
              Help
            </span>
          </div>
          <ul className="space-y-1">
            <li>
              <a
                href="/docs/"
                className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]`}
              >
                <HelpCircle className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                <span className={`text-[14px] whitespace-nowrap ${navLabelClass}`}>Documentation</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {settingsItem && (
        <div
          className={`shrink-0 px-4 pb-3 ${
            viewMode === "faculty" ||
            viewMode === "student" ||
            viewMode === "gradingAssistant" ||
            viewMode === "university"
              ? "pt-2"
              : ""
          }`}
        >
          <Link
            to={settingsItem.to}
            className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} ${
              isItemActive(settingsItem)
                ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]"
            }`}
          >
            <settingsItem.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
            <span className={`text-[14px] whitespace-nowrap ${navLabelClass}`}>{settingsItem.label}</span>
          </Link>
        </div>
      )}

      <div className={`flex w-full min-w-0 shrink-0 flex-col ${bottomPinnedBorderClass}`}>
        <div className={`py-2 ${bottomLogoutRowClass}`}>
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            title="Log out"
            aria-label="Log out"
            className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
            <span className={`text-[14px] whitespace-nowrap ${navLabelClass}`}>Log out</span>
          </button>
        </div>
        <SidebarPinnedCollapseFooter
          variant="maroon"
          rail={isCollapsedMode}
          expandedInset="forge"
          withAccessoryAbove
        />
      </div>
    </aside>
    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out from this account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            onClick={handleConfirmLogout}
          >
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
