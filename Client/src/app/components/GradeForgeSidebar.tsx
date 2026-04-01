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
  UserSearch,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link, useLocation } from "react-router";

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
  const isDashboardRoute = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  // NOTE: Sidebar stays full-width on dashboard, but collapses to icon rail on other authenticated pages.
  const isAutoCollapsed = !isDashboardRoute;

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

  const sidebarShellClass = isAutoCollapsed
    ? "group/sidebar w-[78px] hover:w-60 focus-within:w-60"
    : "w-60";
  const collapsibleTextClass = isAutoCollapsed
    // FIX: Animate labels with max-width instead of toggling to w-auto so hover expansion feels smoother and less abrupt.
    ? "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100"
    : "";
  const collapsibleHeadingClass = isAutoCollapsed
    // FIX: Keep section headings in flow and fade them in so the collapsed rail expands without a visual pop.
    ? "max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-300 ease-out group-hover/sidebar:max-h-8 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-h-8 group-focus-within/sidebar:opacity-100"
    : "";
  const navLinkLayoutClass = isAutoCollapsed
    // FIX: Restore icon-label spacing during hover expansion while keeping the collapsed icon rail centered.
    ? "justify-center gap-0 px-0 py-2.5 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3 group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-3 group-focus-within/sidebar:px-3"
    : "gap-3 px-3 py-2.5";
  const navLabelClass = isAutoCollapsed
    // FIX: Match nav label motion with the sidebar shell so icon/text spacing stays stable while the rail opens.
    ? "max-w-0 overflow-hidden opacity-0 translate-x-1.5 transition-[max-width,opacity,transform] duration-300 ease-out group-hover/sidebar:max-w-[160px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px] group-focus-within/sidebar:translate-x-0 group-focus-within/sidebar:opacity-100"
    : "";

  return (
    <aside className={`${sidebarShellClass} bg-white border-r border-[#CFD2D9] flex-shrink-0 flex flex-col transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
      {/* NOTE: Role switcher was removed intentionally; access is controlled by auth role + route guards. */}
      {viewMode === "university" ? (
        <div className="px-4 py-4 border-b border-[#CFD2D9]">
          {/* FIX: Use the same divider color token as the top bar so horizontal lines align visually. */}
          {/* FIX: Keep university title on a single line with a smaller, natural size per updated design feedback. */}
          {/* FIX: Set university heading to 22px to match the requested sidebar title size. */}
          <h1 className={`text-[22px] font-semibold leading-none text-[#1F2430] whitespace-nowrap ${collapsibleTextClass}`}>University Admin</h1>
          <p className={`mt-1.5 text-[14px] text-[#5D667A] whitespace-nowrap ${collapsibleTextClass}`}>System Management</p>
        </div>
      ) : (
        /* REFACTOR: Keep existing logo header for student/faculty while university mode uses title-style sidebar header. */
        <div className={`py-6 ${isAutoCollapsed ? "px-0 flex justify-center" : "px-6"}`}>
          <Link
            to="/dashboard"
            className={`flex items-center hover:opacity-90 transition-[opacity,transform] duration-300 ease-out ${isAutoCollapsed ? "justify-center w-12 h-12 rounded-[18px] bg-[#2B2A2A]" : "gap-3"}`}
            aria-label="Go to dashboard"
          >
            {/* FIX: Keep one consistent logo mark in both expanded and collapsed states so the icon does not shift or clip. */}
            <div className={`h-8 w-8 flex-shrink-0 rounded-xl flex items-center justify-center ${isAutoCollapsed ? "bg-transparent" : "bg-[#2B2A2A]"}`}>
              <div className={`h-[18px] w-[18px] rounded-[6px] border-[1.8px] ${isAutoCollapsed ? "border-white" : "border-white"}`} />
            </div>
            <span className={`text-[15px] font-semibold text-[#2B2A2A] whitespace-nowrap ${collapsibleTextClass}`}>Grade Forge</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      {/* FIX: Add top spacing in university mode so the first nav item does not stick to the header divider. */}
      <nav className={`flex-1 px-4 ${viewMode === "university" ? "pt-4" : ""} ${isAutoCollapsed ? "overflow-x-hidden" : ""}`}>
        {/* Learning Section */}
        <div className="mb-6">
          {viewMode !== "university" && (
            <div className={`px-3 mb-2 ${collapsibleHeadingClass}`}>
              <span className="text-[11px] font-semibold tracking-wider text-[#8D97AC] uppercase">
                {viewMode === "student" ? "Learning" : viewMode === "gradingAssistant" ? "Grading" : "Teaching"}
              </span>
            </div>
          )}
          <ul className="space-y-1">
            {learningItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`w-full flex items-center rounded-lg transition-all ${navLinkLayoutClass} ${
                    isItemActive(item)
                      ? "bg-[#5A7ACD] text-white shadow-[0_8px_18px_rgba(90,122,205,0.32)]"
                      : "text-[#44506B] hover:text-[#2B2A2A] hover:bg-[#EEF2FB]"
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
              <span className="text-[11px] font-semibold tracking-wider text-[#8D97AC] uppercase">
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
                        ? "bg-[#5A7ACD] text-white shadow-[0_8px_18px_rgba(90,122,205,0.32)]"
                        : "text-[#44506B] hover:text-[#2B2A2A] hover:bg-[#EEF2FB]"
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
