import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  BarChart3,
  ChevronLeft,
  FileText,
  LogOut,
  Settings,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { clearAuthenticated } from "../../auth";
import { buildLogoutConfirmationMessage, queueAuthNotification } from "../../authNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useSidebarPinnedCollapsed } from "./useSidebarPinnedCollapsed";
import { SidebarPinnedCollapseFooter } from "./SidebarPinnedCollapseFooter";

function NavItem({
  icon,
  label,
  active,
  to,
  badge,
  rail = false,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  to: string;
  badge?: number;
  rail?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        title={rail ? label : undefined}
        className={`
          relative flex w-full items-center rounded-lg text-[13px] font-medium transition-colors
          ${rail ? "justify-center px-0 py-2.5" : "justify-between gap-3 px-3 py-2.5"}
          ${active ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]" : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]"}
        `}
      >
        <div className={`flex items-center ${rail ? "justify-center" : "gap-3"}`}>
          {icon}
          {rail ? <span className="sr-only">{label}</span> : <span>{label}</span>}
        </div>
        {!rail && badge !== undefined && badge > 0 && (
          <span
            className={`
              px-2 py-0.5 text-[11px] font-semibold rounded-full
              ${active ? "bg-[#7A1226] text-white" : "bg-[#9F3549] text-white"}
            `}
          >
            {badge}
          </span>
        )}
        {rail && badge !== undefined && badge > 0 && (
          <span className="absolute right-1 top-1 h-2 min-w-2 rounded-full bg-[#9F3549]" aria-hidden />
        )}
      </Link>
    </li>
  );
}

export function FacultyClassSidebar({
  classId,
  activeSection,
}: {
  classId: string;
  activeSection?: string;
}) {
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { pinnedCollapsed } = useSidebarPinnedCollapsed();

  const handleConfirmLogout = () => {
    queueAuthNotification(buildLogoutConfirmationMessage("faculty"));
    setIsLogoutDialogOpen(false);
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <>
    <aside
      className={`flex min-h-0 flex-shrink-0 flex-col self-stretch border-r border-[#65101F] bg-[#7A1226] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        pinnedCollapsed ? "w-[78px]" : "w-64"
      }`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Logo Header */}
        <div
          className={`flex h-[64px] items-center border-b border-[#65101F] bg-white ${
            pinnedCollapsed ? "justify-center px-0" : "px-6"
          }`}
        >
          <Link
            to="/dashboard"
            className={`flex items-center transition-opacity hover:opacity-90 ${
              pinnedCollapsed ? "h-12 w-12 justify-center rounded-[14px]" : "gap-3"
            }`}
            aria-label="Go to dashboard"
          >
            <img
              src="/favicon.svg"
              alt={pinnedCollapsed ? "" : "Grade Forge"}
              className="h-8 w-8 flex-shrink-0 rounded-[10px] border border-[#C9C4C9]"
            />
            {!pinnedCollapsed && (
              <span className="whitespace-nowrap text-[15px] font-semibold text-[#1F2430]">Grade Forge</span>
            )}
          </Link>
        </div>

        {/* Back to Dashboard Link */}
        <div
          className={`flex border-b border-[#65101F] py-3 ${pinnedCollapsed ? "justify-center px-0" : "px-4"}`}
        >
          <Link
            to="/dashboard"
            title="Back to Dashboard"
            className={`flex items-center text-[13px] text-[#F5E5E8] transition-colors hover:text-white ${
              pinnedCollapsed ? "justify-center" : "gap-2"
            }`}
            aria-label="Back to Dashboard"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
            {!pinnedCollapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 ${
            pinnedCollapsed ? "px-1" : "px-3"
          }`}
        >
          <ul className="space-y-1">
            <NavItem
              icon={<FileText className="w-4 h-4" strokeWidth={2} />}
              label="Assignments"
              active={activeSection === "assignments"}
              to={`/faculty/class/${classId}/assignments`}
              rail={pinnedCollapsed}
            />
            <NavItem
              icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
              label="Grades"
              active={activeSection === "grades"}
              to={`/faculty/class/${classId}/grades`}
              rail={pinnedCollapsed}
            />
            <NavItem
              icon={<Users className="w-4 h-4" strokeWidth={2} />}
              label="Students"
              active={activeSection === "students"}
              to={`/faculty/class/${classId}/students`}
              rail={pinnedCollapsed}
            />
            <NavItem
              icon={<UserPlus className="w-4 h-4" strokeWidth={2} />}
              label="Grading Assistants"
              active={activeSection === "assistants"}
              to={`/faculty/class/${classId}/assistants`}
              rail={pinnedCollapsed}
            />
            <NavItem
              icon={<UsersRound className="w-4 h-4" strokeWidth={2} />}
              label="Groups"
              active={activeSection === "groups"}
              to={`/faculty/class/${classId}/groups`}
              rail={pinnedCollapsed}
            />
            <NavItem
              icon={<Settings className="w-4 h-4" strokeWidth={2} />}
              label="Settings"
              active={activeSection === "settings"}
              to={`/faculty/class/${classId}/settings`}
              rail={pinnedCollapsed}
            />
          </ul>
        </nav>

        <div className="flex w-full min-w-0 shrink-0 flex-col border-t border-white/15">
          <div className={`py-2 ${pinnedCollapsed ? "flex justify-center px-1" : "px-3"}`}>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              title="Log out"
              aria-label="Log out"
              className={`
                relative flex w-full items-center rounded-lg text-[13px] font-medium transition-colors
                text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]
                ${pinnedCollapsed ? "justify-center px-0 py-2.5" : "justify-between gap-3 px-3 py-2.5"}
              `}
            >
              <div className={`flex items-center ${pinnedCollapsed ? "justify-center" : "gap-3"}`}>
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
                {pinnedCollapsed ? <span className="sr-only">Log out</span> : <span>Log out</span>}
              </div>
            </button>
          </div>
          <SidebarPinnedCollapseFooter
            variant="maroon"
            rail={pinnedCollapsed}
            expandedInset="flush"
            withAccessoryAbove
          />
        </div>
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
