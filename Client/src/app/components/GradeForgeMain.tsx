import { useEffect, useState } from "react";
import { Search, Bell, Settings, Plus, Lock, SunMedium, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { EnrolledCourses } from "./EnrolledCourses";
import { UpcomingAssignments } from "./UpcomingAssignments";
import type { CourseCard } from "../../types/class";
import type { UpcomingAssignment } from "../../types/assignment";
import type { UserProfile } from "../../types/user";
import { getStudentProfile } from "../../services/authService";
import { listEnrolledCourses } from "../../services/classService";
import { listUpcomingAssignments } from "../../services/assignmentService";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function GradeForgeMain() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // NOTE: Load dashboard data here so child components stay presentation-only.
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentProfile().then(setProfile);
    listEnrolledCourses().then(setCourses);
    listUpcomingAssignments().then(setUpcomingAssignments);
  }, []);

  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? profile?.name ?? "Alex Johnson";
  const displayHandle = loggedInUser?.email ?? profile?.handle ?? "@alexj.edu";
  const displayInitials = loggedInUser?.name
    ? loggedInUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "AJ"
    : profile?.initials ?? "AJ";
  const firstName = displayName.split(" ")[0] || displayName;

  const goToSettingsSection = (section: "profile" | "security" | "notifications" | "appearance") => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
              {/* Accessibility: add a label for screen readers without changing layout. */}
              <input
                type="text"
                placeholder="Search courses, lessons, grad..."
                aria-label="Search courses, lessons, and grades"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Accessibility: icon-only variant on small screens needs a label. */}
            <button
              aria-label="Enroll in class"
              className="flex items-center gap-2 px-3 py-2 bg-[#2B2A2A] text-white rounded-lg hover:bg-[#3a3939] transition-colors text-[12px] font-medium"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span className="hidden lg:inline">Enroll in Class</span>
            </button>
            
            {/* Accessibility: icon-only buttons need labels for screen readers. */}
            <button
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Open settings menu"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-[#2B2A2A]">Settings</span>
                  <span className="text-[11px] text-gray-500">Manage your account and preferences</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => goToSettingsSection("profile")}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FEB05D] to-[#ff9a3d] flex items-center justify-center text-[11px] font-medium text-white mr-1.5">
                    {displayInitials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-[#2B2A2A]">Account</span>
                    <span className="text-[11px] text-gray-500">Profile info and basic details</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => goToSettingsSection("security")}>
                  <Lock className="w-4 h-4 text-gray-600" strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-[#2B2A2A]">Security</span>
                    <span className="text-[11px] text-gray-500">Password and sign-in settings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => goToSettingsSection("notifications")}>
                  <Bell className="w-4 h-4 text-gray-600" strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-[#2B2A2A]">Notifications</span>
                    <span className="text-[11px] text-gray-500">Email and in-app alerts</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => goToSettingsSection("appearance")}>
                  <SunMedium className="w-4 h-4 text-gray-600" strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-[#2B2A2A]">Appearance</span>
                    <span className="text-[11px] text-gray-500">Theme and display preferences</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                  <LogOut className="w-4 h-4 text-red-600" strokeWidth={2} />
                  <span className="text-[13px] font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="ml-2 flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FEB05D] to-[#ff9a3d] rounded-full flex items-center justify-center">
                <span className="text-white text-[13px] font-medium">{displayInitials}</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#2B2A2A]">{displayName}</div>
                <div className="text-[11px] text-gray-500">{displayHandle}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2B2A2A] mb-2 flex items-center gap-2">
            {/* NOTE: Removed garbled emoji from the Figma export to avoid mojibake in the UI. */}
            Welcome back, {firstName}!
          </h1>
          <p className="text-[14px] text-gray-600">
            You have <span className="font-semibold text-[#2B2A2A]">4 assignments</span> due this week. Stay focused!
          </p>
        </div>

        {/* Enrolled Courses */}
        <EnrolledCourses courses={courses} />

        {/* Upcoming Assignments */}
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </main>
  );
}

