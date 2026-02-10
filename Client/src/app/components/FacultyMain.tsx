import { useEffect, useState } from "react";
import { Search, Bell, Settings, Lock, SunMedium, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { FacultyCourseCard } from "../../types/class";
import type { UserProfile } from "../../types/user";
import { listFacultyCourses } from "../../services/classService";
import { getFacultyProfile } from "../../services/authService";
import { clearAuthenticated } from "../auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface FacultyMainViewProps {
  // NOTE: View props keep this component presentation-only.
  profile: UserProfile | null;
  courses: FacultyCourseCard[];
}

export function FacultyMain() {
  // NOTE: Container loads data once and passes it into the view component.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<FacultyCourseCard[]>([]);

  useEffect(() => {
    getFacultyProfile().then(setProfile);
    listFacultyCourses().then(setCourses);
  }, []);

  return <FacultyMainView profile={profile} courses={courses} />;
}

function FacultyMainView({ profile, courses }: FacultyMainViewProps) {
  const displayName = profile?.name ?? "Dr. Sarah Miller";
  const displayHandle = profile?.handle ?? "@smiller.edu";
  const displayInitials = profile?.initials ?? "SM";
  const firstName = displayName.split(" ")[0] || displayName;
  const navigate = useNavigate();

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
              <input
                type="text"
                placeholder="Search students, assignments, classes..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Accessibility: icon-only button needs an accessible label. */}
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5A7ACD] to-[#4a6abd] flex items-center justify-center text-[11px] font-medium text-white mr-1.5">
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
              <div className="w-9 h-9 bg-gradient-to-br from-[#5A7ACD] to-[#4a6abd] rounded-full flex items-center justify-center">
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
      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2B2A2A] mb-2 flex items-center gap-2">
            Welcome back, {firstName}! <span>{"\u{1F469}\u200D\u{1F3EB}"}</span>
          </h1>
          <p className="text-[14px] text-gray-600">
            You have <span className="font-semibold text-[#2B2A2A]">23 submissions</span> pending review across your classes.
          </p>
        </div>

        {/* Teaching Courses */}
        <TeachingCourses courses={courses} />
      </div>
    </main>
  );
}

function TeachingCourses({ courses }: { courses: FacultyCourseCard[] }) {
  // NOTE: Accepts courses via props to keep the component reusable for future data sources.

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Teaching This Semester</h2>
        <button className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium">
          View All Courses &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/faculty/class/${course.id}`}
            className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 ${course.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                {course.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
                  {course.code}
                </div>
                <h3 className="text-[14px] font-semibold text-[#2B2A2A] leading-snug">
                  {course.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Students Enrolled</span>
                <span className="text-[13px] font-semibold text-[#2B2A2A]">{course.students}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Pending Submissions</span>
                <span className="text-[13px] font-semibold text-[#FEB05D]">{course.pendingSubmissions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Active Assignments</span>
                <span className="text-[13px] font-semibold text-[#2B2A2A]">{course.activeAssignments}</span>
              </div>
            </div>

            <div className="mt-5 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors text-center">
              Manage Course
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
