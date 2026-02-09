import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, Bell, Settings, ChevronLeft, User, Lock, X, Eye, EyeOff, LogOut } from "lucide-react";
import { GradeForgeSidebar } from "./GradeForgeSidebar";
import type { UserProfile } from "../../types/user";
import { getStudentProfile } from "../../services/authService";
import { getAuthenticatedUser } from "../auth";

export function SettingsPage() {
  const [viewMode, setViewMode] = useState<"student" | "faculty">("student");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  useEffect(() => {
    getStudentProfile().then(setProfile);
  }, []);

  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? profile?.name ?? "Alex Johnson";
  const displayEmail = loggedInUser?.email ?? profile?.handle ?? "alex.johnson@university.edu";
  const displayInitials = loggedInUser?.name
    ? loggedInUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "AJ"
    : profile?.initials ?? "AJ";
  const displayStudentId = profile?.id ?? "2024-CS-1234";

  return (
    <div className="flex h-screen w-full bg-[#F5F2F2]">
      <GradeForgeSidebar viewMode={viewMode} onViewChange={setViewMode} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search settings..."
                  aria-label="Search settings"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
              </button>
              <button
                aria-label="Settings"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-900"
              >
                <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>

              <div className="ml-2 flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-9 h-9 bg-gradient-to-br from-[#FEB05D] to-[#ff9a3d] rounded-full flex items-center justify-center">
                  <span className="text-white text-[13px] font-medium">{displayInitials}</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#2B2A2A]">{displayName}</div>
                  <div className="text-[11px] text-gray-500">{displayEmail}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            <span>Back to Dashboard</span>
          </Link>

          <h1 className="text-[38px] leading-none font-bold text-[#2B2A2A] mb-3">Settings</h1>
          <p className="text-[14px] text-gray-600 mb-8">Manage your account preferences and settings</p>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 max-w-[710px]">
            <h2 className="text-[28px] font-semibold text-[#2B2A2A] mb-5 flex items-center gap-2">
              <User className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
              <span>Profile Information</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-full-name" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  Full Name
                </label>
                <input
                  id="settings-full-name"
                  value={displayName}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="settings-email" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  Email Address
                </label>
                <input
                  id="settings-email"
                  value={displayEmail}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="settings-student-id" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  Student ID
                </label>
                <input
                  id="settings-student-id"
                  value={displayStudentId}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 max-w-[710px] mt-6">
            <h2 className="text-[28px] font-semibold text-[#2B2A2A] mb-5 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
              <span>Security</span>
            </h2>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#2B2A2A] hover:bg-gray-100 transition-colors"
              >
                Change Password
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#2B2A2A] hover:bg-gray-100 transition-colors"
              >
                Enable Two-Factor Authentication
              </button>
            </div>
          </section>

          <div className="max-w-[710px] mt-6 mb-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </main>
      </div>

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[460px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[38px] leading-none font-semibold text-[#2B2A2A]">Change Password</h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setShowChangePasswordModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <label htmlFor="current-password" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                  <button
                    type="button"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="repeat-password" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                  Repeat New Password
                </label>
                <div className="relative">
                  <input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={repeatPassword}
                    onChange={(event) => setRepeatPassword(event.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                  <button
                    type="button"
                    aria-label={showRepeatPassword ? "Hide repeated password" : "Show repeated password"}
                    onClick={() => setShowRepeatPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showRepeatPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5A7ACD] hover:bg-[#4a6abd] rounded-xl text-[14px] font-semibold text-white transition-colors"
              >
                <Lock className="w-4 h-4" strokeWidth={2} />
                <span>Update Password</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
