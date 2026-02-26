import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Bell, Settings, ChevronLeft, User, Lock, X, Eye, EyeOff } from "lucide-react";
import type { UserProfile } from "../../types/user";
import { getFacultyProfile, getStudentProfile, updatePassword } from "../../services/authService";
import { clearAuthenticated, getAuthenticatedRole, getAuthenticatedUser, setAuthenticated } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState<"profile" | "security" | "notifications" | "appearance">("profile");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = getAuthenticatedRole();
  // NOTE: Settings keeps the same role mapping as dashboard so the shared shell renders matching navigation.
  const viewMode: "student" | "faculty" = role === "FACULTY" ? "faculty" : "student";

  useEffect(() => {
    // NOTE: Profile fallback source now follows role to avoid showing student mock data in faculty settings.
    if (role === "FACULTY") {
      getFacultyProfile().then(setProfile);
      return;
    }

    getStudentProfile().then(setProfile);
  }, [role]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section === "profile" || section === "security" || section === "notifications" || section === "appearance") {
      setActiveSection(section);
    }
  }, [location.search]);

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

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const goToSettingsSection = (section: "profile" | "security" | "notifications" | "appearance") => {
    setActiveSection(section);
    navigate(`/settings?section=${section}`, { replace: true });
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowRepeatPassword(false);
  };

  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !repeatPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordError("New password and repeat password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    if (!loggedInUser?.email) {
      setPasswordError("Unable to identify logged in user. Please sign in again.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await updatePassword({
        email: loggedInUser.email,
        oldPassword: currentPassword,
        newPassword,
      });

      setAuthenticated(response.token, {
        name: response.name,
        email: response.email,
        role: response.role,
        profileCompleted: response.profileCompleted,
      });

      setPasswordSuccess(response.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to update password. Please try again.";
      setPasswordError(msg ?? "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (role === "UNIVERSITY_ADMIN") {
    // NOTE: University admins use their dedicated dashboard/settings surface, not the student/faculty shell.
    return <Navigate to="/university-admin" replace />;
  }

  const topBar = (
    <AuthTopBar
      roleView={viewMode}
      profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
      showSearch={false}
      isSettingsActive
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  return (
    <>
      <AuthShell
        roleView={viewMode}
        topBar={topBar}
        // NOTE: Settings page now reuses the shared shell instead of duplicating sidebar/topbar wrappers.
        mainContent={
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

          <div className="max-w-[710px] space-y-6">
            {activeSection === "profile" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
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
            )}

            {activeSection === "security" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
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
            )}

            {activeSection === "notifications" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-[28px] font-semibold text-[#2B2A2A] mb-3 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
                    <span>Notifications</span>
                  </h2>
                  <p className="text-[14px] text-gray-600">
                    Control how you receive updates about assignments, grades, and class activity. Notification controls
                    will live here.
                  </p>
              </section>
            )}

            {activeSection === "appearance" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-[28px] font-semibold text-[#2B2A2A] mb-3 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
                    <span>Appearance</span>
                  </h2>
                  <p className="text-[14px] text-gray-600">
                    Choose between light and dark modes and customize how Grade Forge looks. Theme options will be added
                    here.
                  </p>
              </section>
            )}
          </div>
        </main>
        }
      />

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[460px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[38px] leading-none font-semibold text-[#2B2A2A]">Change Password</h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={closeChangePasswordModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5">
              {passwordError && (
                <div className="py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="py-2 px-3 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-700">
                  {passwordSuccess}
                </div>
              )}
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
                onClick={closeChangePasswordModal}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={updatingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5A7ACD] hover:bg-[#4a6abd] disabled:opacity-60 rounded-xl text-[14px] font-semibold text-white transition-colors"
              >
                <Lock className="w-4 h-4" strokeWidth={2} />
                <span>{updatingPassword ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
