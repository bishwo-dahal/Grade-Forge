import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  FolderOpen,
  MessageSquare,
  Users,
  ClipboardCheck,
  Code2,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link, useLocation } from "react-router";

interface GradeForgeSidebarProps {
  viewMode: "student" | "faculty" | "university";
}

interface SidebarNavItem {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: string;
  matchPrefixes?: string[];
}

export function GradeForgeSidebar({ viewMode }: GradeForgeSidebarProps) {
  const location = useLocation();

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
    { icon: ClipboardCheck, label: "Grading", to: "/faculty/grading" },
    { icon: Users, label: "Students", to: "/faculty/students" },
    { icon: Calendar, label: "Schedule", to: "/faculty/schedule" },
  ];
  // NOTE: University navigation is section-based and mapped to nested /university-admin/* routes.
  const universityItems: SidebarNavItem[] = [
    { icon: Users, label: "Faculty", to: "/university-admin/faculty" },
    { icon: Calendar, label: "Semesters", to: "/university-admin/semesters" },
    { icon: BookOpen, label: "Courses", to: "/university-admin/courses" },
    // NOTE: Languages management has its own university section route for easier backend ownership boundaries.
    { icon: Code2, label: "Languages", to: "/university-admin/languages" },
  ];

  const learningItems =
    viewMode === "student" ? studentItems : viewMode === "faculty" ? facultyItems : universityItems;
  const resourceItems: SidebarNavItem[] =
    viewMode === "university"
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

  return (
    <aside className="w-60 bg-white border-r border-[#CFD2D9] flex-shrink-0 flex flex-col">
      {/* NOTE: Role switcher was removed intentionally; access is controlled by auth role + route guards. */}
      {viewMode === "university" ? (
        <div className="px-4 py-4 border-b border-[#CFD2D9]">
          {/* FIX: Use the same divider color token as the top bar so horizontal lines align visually. */}
          {/* FIX: Keep university title on a single line with a smaller, natural size per updated design feedback. */}
          {/* FIX: Set university heading to 22px to match the requested sidebar title size. */}
          <h1 className="text-[22px] font-semibold leading-none text-[#1F2430] whitespace-nowrap">University Admin</h1>
          <p className="mt-1.5 text-[14px] text-[#5D667A]">System Management</p>
        </div>
      ) : (
        /* REFACTOR: Keep existing logo header for student/faculty while university mode uses title-style sidebar header. */
        <div className="px-6 py-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            aria-label="Go to dashboard"
          >
            <div className="w-7 h-7 bg-[#2B2A2A] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded"></div>
            </div>
            <span className="text-[15px] font-semibold text-[#2B2A2A]">Grade Forge</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      {/* FIX: Add top spacing in university mode so the first nav item does not stick to the header divider. */}
      <nav className={`flex-1 px-4 ${viewMode === "university" ? "pt-4" : ""}`}>
        {/* Learning Section */}
        <div className="mb-6">
          {viewMode !== "university" && (
            <div className="px-3 mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-[#8D97AC] uppercase">
                {viewMode === "student" ? "Learning" : "Teaching"}
              </span>
            </div>
          )}
          <ul className="space-y-1">
            {learningItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isItemActive(item)
                      ? "bg-[#5A7ACD] text-white shadow-[0_8px_18px_rgba(90,122,205,0.32)]"
                      : "text-[#44506B] hover:text-[#2B2A2A] hover:bg-[#EEF2FB]"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  <span className="text-[14px]">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources Section */}
        {resourceItems.length > 0 && (
          <div>
            <div className="px-3 mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-[#8D97AC] uppercase">
                Resources
              </span>
            </div>
            <ul className="space-y-1">
              {resourceItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isItemActive(item)
                        ? "bg-[#5A7ACD] text-white shadow-[0_8px_18px_rgba(90,122,205,0.32)]"
                        : "text-[#44506B] hover:text-[#2B2A2A] hover:bg-[#EEF2FB]"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    <span className="text-[14px]">{item.label}</span>
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
