import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  FolderOpen,
  MessageSquare,
  Users,
  UserPlus,
  Code2,
  ListChecks,
  Monitor,
  PanelLeft,
  PanelLeftClose,
  UserSearch,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link, useLocation } from "react-router";
import { useSidebarPinnedCollapsed } from "./layout/useSidebarPinnedCollapsed";

interface GradeForgeSidebarProps {
  viewMode: "student" | "faculty" | "gradingAssistant" | "university";
}

interface SidebarNavItem {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: string;
  matchPrefixes?: string[];
}

export function GradeForgeSidebar({ viewMode }: GradeForgeSidebarProps) {
  const location = useLocation();
  const { pinnedCollapsed, togglePinnedCollapsed } = useSidebarPinnedCollapsed();
  const isDashboardRoute = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const isUniversityView = viewMode === "university";
  // NOTE: Sidebar stays full-width on dashboard unless the user pins “keep collapsed”; other routes use the icon rail.
  const isCollapsedMode = pinnedCollapsed || !isDashboardRoute;

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
    { icon: Users, label: "Students", to: "/faculty/students" },
    { icon: Calendar, label: "Schedule", to: "/faculty/schedule" },
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
        : viewMode === "student"
          ? [
              { icon: FolderOpen, label: "Materials", to: "/student/materials" },
              { icon: MessageSquare, label: "Discussions", to: "/student/discussions" },
            ]
          : [
              { icon: FolderOpen, label: "Materials", to: "/faculty/materials" },
              { icon: MessageSquare, label: "Discussions", to: "/faculty/discussions" },
            ];

  const isItemActive = (item: SidebarNavItem): boolean => {
    const prefixes = [item.to, ...(item.matchPrefixes ?? [])];
    return prefixes.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
  };

  const sidebarShellClass = !isCollapsedMode
    ? "w-60"
    : pinnedCollapsed
      ? "w-[78px]"
      : "group/sidebar w-[78px] hover:w-60 focus-within:w-60";
  const collapsibleTextClass = !isCollapsedMode
    ? ""
    : pinnedCollapsed
      ? "pointer-events-none max-w-0 overflow-hidden opacity-0 translate-x-1.5"
      : // FIX: Animate labels with max-width instead of toggling to w-auto so hover expansion feels smoother and less abrupt.
        "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100";
  const collapsibleHeadingClass = !isCollapsedMode
    ? ""
    : pinnedCollapsed
      ? "pointer-events-none max-h-0 overflow-hidden opacity-0 mb-0"
      : // FIX: Keep section headings in flow and fade them in so the collapsed rail expands without a visual pop.
        "max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-300 ease-out group-hover/sidebar:max-h-8 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-h-8 group-focus-within/sidebar:opacity-100";
  const navLinkLayoutClass = !isCollapsedMode
    ? "gap-3 px-3 py-2.5"
    : pinnedCollapsed
      ? "justify-center gap-0 px-0 py-2.5"
      : // FIX: Restore icon-label spacing during hover expansion while keeping the collapsed icon rail centered.
        "justify-center gap-0 px-0 py-2.5 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3 group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-3 group-focus-within/sidebar:px-3";
  const navLabelClass = !isCollapsedMode
    ? ""
    : pinnedCollapsed
      ? "pointer-events-none max-w-0 overflow-hidden opacity-0 translate-x-1.5"
      : // FIX: Match nav label motion with the sidebar shell so icon/text spacing stays stable while the rail opens.
        "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100";

  const pinToggleButtonClass = [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#9F3549] focus-visible:ring-offset-0",
    pinnedCollapsed
      ? isUniversityView
        ? "bg-[#FDF8F9] text-[#7A1226]"
        : "bg-white/15 text-white"
      : isUniversityView
        ? "bg-white text-[#5D667A] hover:bg-[#F1EEF1]"
        : "bg-transparent text-[#F5E5E8] hover:bg-white/10",
  ].join(" ");

  return (
    <aside
      className={`${sidebarShellClass} ${isUniversityView ? "bg-white border-r border-[#C9C4C9]" : "bg-[#7A1226] border-r border-[#65101F]"} flex-shrink-0 flex flex-col transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      {/* NOTE: Role switcher was removed intentionally; access is controlled by auth role + route guards. */}
      {viewMode === "university" ? (
        <div className="px-4 py-4 border-b border-[#C9C4C9]">
          {/* FIX: Use the same divider color token as the top bar so horizontal lines align visually. */}
          {/* FIX: Keep university title on a single line with a smaller, natural size per updated design feedback. */}
          {/* FIX: Set university heading to 22px to match the requested sidebar title size. */}
          <h1 className={`text-[22px] font-semibold leading-none text-[#1F2430] whitespace-nowrap ${collapsibleTextClass}`}>University Admin</h1>
          <p className={`mt-1.5 text-[14px] text-[#5D667A] whitespace-nowrap ${collapsibleTextClass}`}>System Management</p>
        </div>
      ) : (
        /* REFACTOR: Keep existing logo header for student/faculty while university mode uses title-style sidebar header. */
        <div
          className={`h-[76px] border-b border-[#C9C4C9] bg-white ${isCollapsedMode ? "px-0 flex items-center justify-center" : "px-6 flex items-center"}`}
        >
          <Link
            to="/dashboard"
            className={`flex items-center hover:opacity-90 transition-[opacity,transform] duration-300 ease-out ${isCollapsedMode ? "justify-center w-12 h-12 rounded-[14px]" : "gap-3"}`}
            aria-label="Go to dashboard"
          >
            <img
              src="/favicon.svg"
              alt="Grade Forge"
              className="h-8 w-8 flex-shrink-0 rounded-[10px]"
            />
            {!isCollapsedMode && (
              <span className={`text-[15px] font-semibold text-[#1F2430] whitespace-nowrap ${collapsibleTextClass}`}>
                Grade Forge
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Navigation */}
      {/* FIX: Add top spacing in university mode so the first nav item does not stick to the header divider. */}
      <nav className={`flex-1 px-4 ${viewMode === "university" ? "pt-4" : ""} ${isCollapsedMode ? "overflow-x-hidden" : ""}`}>
        {/* Learning Section */}
        <div className="mb-6">
          {viewMode !== "university" && (
            <div className={`px-3 mb-2 ${collapsibleHeadingClass}`}>
              <span className={`text-[11px] font-semibold tracking-wider uppercase ${isUniversityView ? "text-[#8D97AC]" : "text-[#D8B7BE]"}`}>
                {viewMode === "student" ? "Learning" : viewMode === "gradingAssistant" ? "Grading" : "Teaching"}
              </span>
            </div>
          )}
          <div className={`mb-2 ${isCollapsedMode ? "flex justify-center" : "px-3"}`}>
            <button
              type="button"
              onClick={togglePinnedCollapsed}
              aria-pressed={pinnedCollapsed}
              aria-label={
                pinnedCollapsed
                  ? "Turn off locked collapsed sidebar"
                  : "Keep sidebar collapsed; hover will not expand it"
              }
              title={
                pinnedCollapsed
                  ? "Sidebar stays narrow without expanding on hover. Click to unlock hover expand and dashboard width."
                  : "Lock the sidebar narrow on all pages. Hover will not expand it while this is on."
              }
              className={pinToggleButtonClass}
            >
              {pinnedCollapsed ? (
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2} />
              ) : (
                <PanelLeft className="h-[18px] w-[18px]" strokeWidth={2} />
              )}
            </button>
          </div>
          <ul className="space-y-1">
            {learningItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} ${
                    isItemActive(item)
                      ? (isUniversityView
                          ? "bg-[#7A1226] text-white shadow-[0_8px_18px_rgba(122,18,38,0.32)]"
                          : "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]")
                      : (isUniversityView
                          ? "text-[#44506B] hover:text-[#1F2430] hover:bg-[#F1EEF1]"
                          : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]")
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
              <span className={`text-[11px] font-semibold tracking-wider uppercase ${isUniversityView ? "text-[#8D97AC]" : "text-[#D8B7BE]"}`}>
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
                        ? (isUniversityView
                            ? "bg-[#7A1226] text-white shadow-[0_8px_18px_rgba(122,18,38,0.32)]"
                            : "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]")
                        : (isUniversityView
                            ? "text-[#44506B] hover:text-[#1F2430] hover:bg-[#F1EEF1]"
                            : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]")
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
      </nav>

    </aside>
  );
}
