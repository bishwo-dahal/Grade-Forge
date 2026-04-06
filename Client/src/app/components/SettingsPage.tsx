import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Bell, Settings, ChevronLeft, User, Lock, X, Eye, EyeOff, Pencil, Camera } from "lucide-react";
import type { UserProfile } from "../../types/user";
import type { FacultyResponse, FacultyUpdateRequest } from "../../types/faculty";
import type { GradingAssistantResponse } from "../../types/gradingAssistant";
import {
  getFacultyProfile,
  getStudentProfile,
  refreshAuthSessionFromMe,
  updatePassword,
} from "../../services/authService";
import { getCurrentFaculty, updateCurrentFaculty } from "../../services/facultyService";
import { getCurrentGradingAssistantProfile } from "../../services/gradingAssistantService";
import { patchCurrentUserProfile } from "../../services/userService";
import { clearAuthenticated, getAuthenticatedRole, getAuthenticatedUser, getToken, setAuthenticated } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import { ProfileAvatarCircle } from "./layout/ProfileAvatarCircle";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function getPasswordUpdateErrorMessage(error: unknown): string {
  return getApiErrorMessage(
    error,
    "Failed to update password. Please check your current password and try again."
  );
}

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyResponse | null>(null);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyProfileError, setFacultyProfileError] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] = useState<FacultyUpdateRequest>({});
  const [isEditingFaculty, setIsEditingFaculty] = useState(false);
  const [updatingFaculty, setUpdatingFaculty] = useState(false);
  const [facultyUpdateSuccess, setFacultyUpdateSuccess] = useState<string | null>(null);
  const [gaProfile, setGaProfile] = useState<GradingAssistantResponse | null>(null);
  const [gaProfileLoading, setGaProfileLoading] = useState(false);
  const [gaProfileError, setGaProfileError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"profile" | "security" | "notifications" | "appearance">("profile");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentNameEdit, setStudentNameEdit] = useState("");
  const [studentProfilePicture, setStudentProfilePicture] = useState<File | null>(null);
  const [studentProfilePreviewUrl, setStudentProfilePreviewUrl] = useState<string | null>(null);
  const [updatingStudentAccount, setUpdatingStudentAccount] = useState(false);
  const [facultyProfilePicture, setFacultyProfilePicture] = useState<File | null>(null);
  const [facultyProfilePreviewUrl, setFacultyProfilePreviewUrl] = useState<string | null>(null);
  const [isEditingGa, setIsEditingGa] = useState(false);
  const [gaNameEdit, setGaNameEdit] = useState("");
  const [gaProfilePicture, setGaProfilePicture] = useState<File | null>(null);
  const [gaProfilePicturePreviewUrl, setGaProfilePicturePreviewUrl] = useState<string | null>(null);
  const [updatingGaAccount, setUpdatingGaAccount] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = getAuthenticatedRole();
  // NOTE: Settings keeps the same role mapping as dashboard; grading assistant uses faculty-style UI (profile/settings same).
  const viewMode: "student" | "faculty" | "gradingAssistant" =
    role === "FACULTY" ? "faculty" : role === "GRADING_ASSISTANT" ? "gradingAssistant" : "student";

  useEffect(() => {
    if (role === "FACULTY") {
      setFacultyLoading(true);
      setFacultyProfileError(null);
      getCurrentFaculty()
        .then((data) => {
          setFacultyProfile(data);
          setFacultyForm({
            name: data.name ?? "",
            department: data.department ?? "",
            qualifications: data.qualifications ?? "",
            phoneNumber: data.phoneNumber ?? "",
            officeLocation: data.officeLocation ?? "",
            officeHours: data.officeHours ?? "",
          });
        })
        .catch(() => setFacultyProfileError("Failed to load faculty profile."))
        .finally(() => setFacultyLoading(false));
      getFacultyProfile().then(setProfile);
      return;
    }

    if (role === "GRADING_ASSISTANT") {
      setGaProfileLoading(true);
      setGaProfileError(null);
      getCurrentGradingAssistantProfile()
        .then(setGaProfile)
        .catch(() => setGaProfileError("Failed to load profile."))
        .finally(() => setGaProfileLoading(false));
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

  // NOTE: GET `/api/v1/auth/me` hydrates session after refresh and when opening Account (profile) so UI matches the server.
  useEffect(() => {
    if (activeSection !== "profile") {
      return;
    }
    if (role === "UNIVERSITY_ADMIN") {
      return;
    }
    let cancelled = false;
    void refreshAuthSessionFromMe().catch(() => {
      if (!cancelled) {
        /* non-fatal; 401 handled by axios interceptor */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeSection, role]);

  useEffect(() => {
    if (!studentProfilePicture) {
      setStudentProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(studentProfilePicture);
    setStudentProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [studentProfilePicture]);

  useEffect(() => {
    if (!facultyProfilePicture) {
      setFacultyProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(facultyProfilePicture);
    setFacultyProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [facultyProfilePicture]);

  useEffect(() => {
    if (!gaProfilePicture) {
      setGaProfilePicturePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(gaProfilePicture);
    setGaProfilePicturePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [gaProfilePicture]);

  const loggedInUser = getAuthenticatedUser();
  const displayName =
    (role === "FACULTY" ? facultyProfile?.name : role === "GRADING_ASSISTANT" ? gaProfile?.name : null) ??
    loggedInUser?.name ??
    profile?.name ??
    "Alex Johnson";
  const displayEmail =
    (role === "FACULTY" ? facultyProfile?.email : role === "GRADING_ASSISTANT" ? gaProfile?.email : null) ??
    loggedInUser?.email ??
    profile?.handle ??
    "alex.johnson@university.edu";
  const displayInitials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "AJ"
    : profile?.initials ?? "AJ";
  const displayStudentId = profile?.id ?? "2024-CS-1234";
  const accountAvatarGradient =
    viewMode === "faculty" || viewMode === "gradingAssistant"
      ? "from-[#7A1226] to-[#65101F]"
      : "from-[#5A606B] to-[#474D56]";

  const headerAvatarImageUrl =
    viewMode === "student" && isEditingStudent
      ? studentProfilePreviewUrl ?? loggedInUser?.profilePictureUrl
      : viewMode === "gradingAssistant" && isEditingGa
        ? gaProfilePicturePreviewUrl ?? loggedInUser?.profilePictureUrl
        : viewMode === "faculty" && isEditingFaculty
          ? facultyProfilePreviewUrl ?? loggedInUser?.profilePictureUrl
          : loggedInUser?.profilePictureUrl;

  const showAvatarPhotoOverlay =
    (viewMode === "student" && isEditingStudent) ||
    (viewMode === "gradingAssistant" && isEditingGa) ||
    (viewMode === "faculty" && isEditingFaculty);

  const applyChosenProfileFile = (
    file: File | null,
    input: HTMLInputElement,
    which: "student" | "faculty" | "ga",
  ) => {
    if (file) {
      const okMime = file.type === "image/jpeg" || file.type === "image/png";
      const okName = /\.(jpe?g|png)$/i.test(file.name);
      if (!okMime && !okName) {
        toast.error("Profile picture must be a JPG or PNG file.");
        input.value = "";
        return;
      }
    }
    if (which === "student") {
      setStudentProfilePicture(file);
    } else if (which === "ga") {
      setGaProfilePicture(file);
    } else {
      setFacultyProfilePicture(file);
    }
    input.value = "";
  };

  const handleFacultyUpdate = async () => {
    setFacultyProfileError(null);
    setFacultyUpdateSuccess(null);
    setUpdatingFaculty(true);
    try {
      const updated = await updateCurrentFaculty(facultyForm);
      setFacultyProfile(updated);
      const token = getToken();
      if (token && facultyProfilePicture && facultyProfilePicture.size > 0) {
        try {
          await patchCurrentUserProfile({
            name: updated.name,
            file: facultyProfilePicture,
          });
        } catch (patchErr: unknown) {
          toast.error(getApiErrorMessage(patchErr, "Profile saved, but photo upload failed."));
        }
      }
      if (token) {
        try {
          await refreshAuthSessionFromMe();
        } catch (refreshErr: unknown) {
          toast.error(getApiErrorMessage(refreshErr, "Profile saved, but could not refresh account."));
        }
      }
      setFacultyProfilePicture(null);
      setFacultyUpdateSuccess("Profile updated successfully.");
      setIsEditingFaculty(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to update profile.";
      setFacultyProfileError(msg ?? "Failed to update profile.");
    } finally {
      setUpdatingFaculty(false);
    }
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleStudentAccountSave = async () => {
    const token = getToken();
    if (!token || !loggedInUser) {
      toast.error("Unable to save. Please sign in again.");
      return;
    }
    const trimmed = studentNameEdit.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty.");
      return;
    }
    const nameChanged = trimmed !== (loggedInUser.name ?? "").trim();
    const hasFile = Boolean(studentProfilePicture && studentProfilePicture.size > 0);
    if (!nameChanged && !hasFile) {
      toast.info("No changes to save.");
      return;
    }

    setUpdatingStudentAccount(true);
    try {
      await patchCurrentUserProfile({
        name: nameChanged ? trimmed : undefined,
        file: hasFile ? studentProfilePicture : undefined,
      });
      try {
        await refreshAuthSessionFromMe();
      } catch (refreshErr: unknown) {
        toast.error(getApiErrorMessage(refreshErr, "Saved, but could not refresh account."));
      }
      setStudentProfilePicture(null);
      setIsEditingStudent(false);
      toast.success("Account updated.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : getApiErrorMessage(err, "Failed to update account.");
      toast.error(msg);
    } finally {
      setUpdatingStudentAccount(false);
    }
  };

  const cancelStudentAccountEdit = () => {
    setStudentNameEdit(loggedInUser?.name ?? displayName);
    setStudentProfilePicture(null);
    setIsEditingStudent(false);
  };

  const handleGaAccountSave = async () => {
    const token = getToken();
    if (!token || !loggedInUser) {
      toast.error("Unable to save. Please sign in again.");
      return;
    }
    const trimmed = gaNameEdit.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty.");
      return;
    }
    const nameChanged = trimmed !== (loggedInUser.name ?? "").trim();
    const hasFile = Boolean(gaProfilePicture && gaProfilePicture.size > 0);
    if (!nameChanged && !hasFile) {
      toast.info("No changes to save.");
      return;
    }

    setUpdatingGaAccount(true);
    try {
      await patchCurrentUserProfile({
        name: nameChanged ? trimmed : undefined,
        file: hasFile ? gaProfilePicture : undefined,
      });
      try {
        await refreshAuthSessionFromMe();
      } catch (refreshErr: unknown) {
        toast.error(getApiErrorMessage(refreshErr, "Saved, but could not refresh account."));
      }
      try {
        const refreshedGa = await getCurrentGradingAssistantProfile();
        setGaProfile(refreshedGa);
      } catch {
        /* GA profile read is best-effort after user patch */
      }
      setGaProfilePicture(null);
      setIsEditingGa(false);
      toast.success("Account updated.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : getApiErrorMessage(err, "Failed to update account.");
      toast.error(msg);
    } finally {
      setUpdatingGaAccount(false);
    }
  };

  const cancelGaAccountEdit = () => {
    setGaNameEdit(loggedInUser?.name ?? displayName);
    setGaProfilePicture(null);
    setIsEditingGa(false);
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
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowRepeatPassword(false);
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !repeatPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== repeatPassword) {
      toast.error("New password and repeat password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    if (!loggedInUser?.email) {
      toast.error("Unable to identify logged in user. Please sign in again.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await updatePassword({
        email: loggedInUser.email,
        oldPassword: currentPassword,
        newPassword,
      });

      const nextToken = response.token?.trim() || getToken();
      if (!nextToken) {
        toast.error("Unable to update session. Please sign in again.");
        return;
      }
      setAuthenticated(nextToken, {
        name: response.name,
        email: response.email,
        role: response.role,
        profileCompleted: response.profileCompleted,
        profilePictureUrl: response.profilePictureUrl ?? loggedInUser?.profilePictureUrl ?? undefined,
      });
      try {
        await refreshAuthSessionFromMe();
      } catch {
        /* session already updated from password response */
      }
      toast.success(response.message || "Password updated successfully.");
      closeChangePasswordModal();
    } catch (err: unknown) {
      toast.error(getPasswordUpdateErrorMessage(err));
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
      profile={{
        name: displayName,
        email: displayEmail,
        initials: displayInitials,
        profilePictureUrl: loggedInUser?.profilePictureUrl,
      }}
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

          <div className={`space-y-6 ${viewMode === "faculty" && activeSection === "profile" ? "max-w-[1100px]" : "max-w-[710px]"}`}>
            {activeSection === "profile" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-[28px] font-semibold text-[#2B2A2A] mb-5 flex items-center gap-2">
                    <User className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
                    <span>Profile Information</span>
                  </h2>

                  <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 mb-6 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-20 shrink-0">
                      <ProfileAvatarCircle
                        initials={displayInitials}
                        gradientClassName={accountAvatarGradient}
                        imageUrl={headerAvatarImageUrl}
                        sizeClassName="h-20 w-20"
                        initialsClassName="text-2xl font-semibold text-white"
                        alt=""
                      />
                      {showAvatarPhotoOverlay ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-full bg-black/45 p-1.5">
                          {viewMode === "student" ? (
                            <>
                              <label
                                className="flex cursor-pointer items-center justify-center rounded-full p-2 text-white opacity-75 transition-opacity hover:opacity-100 focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Change profile photo"
                              >
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                  className="sr-only"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    applyChosenProfileFile(file, event.target, "student");
                                  }}
                                />
                                <Camera className="h-7 w-7" strokeWidth={1.75} />
                              </label>
                              {studentProfilePicture ? (
                                <button
                                  type="button"
                                  onClick={() => setStudentProfilePicture(null)}
                                  className="rounded-full p-1 text-white opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                  aria-label="Remove selected photo"
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                              ) : null}
                            </>
                          ) : viewMode === "gradingAssistant" ? (
                            <>
                              <label
                                className="flex cursor-pointer items-center justify-center rounded-full p-2 text-white opacity-75 transition-opacity hover:opacity-100 focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Change profile photo"
                              >
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                  className="sr-only"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    applyChosenProfileFile(file, event.target, "ga");
                                  }}
                                />
                                <Camera className="h-7 w-7" strokeWidth={1.75} />
                              </label>
                              {gaProfilePicture ? (
                                <button
                                  type="button"
                                  onClick={() => setGaProfilePicture(null)}
                                  className="rounded-full p-1 text-white opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                  aria-label="Remove selected photo"
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <label
                                className="flex cursor-pointer items-center justify-center rounded-full p-2 text-white opacity-75 transition-opacity hover:opacity-100 focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Change profile photo"
                              >
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                  className="sr-only"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    applyChosenProfileFile(file, event.target, "faculty");
                                  }}
                                />
                                <Camera className="h-7 w-7" strokeWidth={1.75} />
                              </label>
                              {facultyProfilePicture ? (
                                <button
                                  type="button"
                                  onClick={() => setFacultyProfilePicture(null)}
                                  className="rounded-full p-1 text-white opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                  aria-label="Remove selected photo"
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-[#2B2A2A] truncate">{displayName}</p>
                      <p className="text-[13px] text-gray-500 truncate">{displayEmail}</p>
                    </div>
                  </div>

                  {viewMode === "faculty" ? (
                    <>
                      {facultyLoading && (
                        <p className="text-[14px] text-gray-600 mb-4">Loading profile…</p>
                      )}
                      {facultyProfileError && !facultyLoading && (
                        <div className="mb-4 py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                          {facultyProfileError}
                        </div>
                      )}
                      {facultyUpdateSuccess && (
                        <div className="mb-4 py-2 px-3 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-700">
                          {facultyUpdateSuccess}
                        </div>
                      )}
                      {!facultyLoading && facultyProfile && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                          <div>
                            <label htmlFor="settings-full-name" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Full Name
                            </label>
                            <input
                              id="settings-full-name"
                              value={isEditingFaculty ? (facultyForm.name ?? "") : (facultyProfile.name ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, name: e.target.value }))}
                              readOnly={!isEditingFaculty}
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-email" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Email Address
                            </label>
                            <input
                              id="settings-email"
                              value={facultyProfile.email}
                              readOnly
                              disabled
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-500 cursor-not-allowed opacity-90"
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-department" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Department
                            </label>
                            <input
                              id="settings-department"
                              value={isEditingFaculty ? (facultyForm.department ?? "") : (facultyProfile.department ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, department: e.target.value }))}
                              readOnly={!isEditingFaculty}
                              placeholder="e.g. Computer Science"
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] placeholder:text-gray-400 focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-qualifications" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Qualifications
                            </label>
                            <input
                              id="settings-qualifications"
                              value={isEditingFaculty ? (facultyForm.qualifications ?? "") : (facultyProfile.qualifications ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, qualifications: e.target.value }))}
                              readOnly={!isEditingFaculty}
                              placeholder="e.g. Ph.D. Computer Science"
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] placeholder:text-gray-400 focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-phone" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Phone Number
                            </label>
                            <input
                              id="settings-phone"
                              type="tel"
                              value={isEditingFaculty ? (facultyForm.phoneNumber ?? "") : (facultyProfile.phoneNumber ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, phoneNumber: e.target.value || null }))}
                              readOnly={!isEditingFaculty}
                              placeholder="Optional"
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] placeholder:text-gray-400 focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-office" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Office Location
                            </label>
                            <input
                              id="settings-office"
                              value={isEditingFaculty ? (facultyForm.officeLocation ?? "") : (facultyProfile.officeLocation ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, officeLocation: e.target.value || null }))}
                              readOnly={!isEditingFaculty}
                              placeholder="Optional"
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] placeholder:text-gray-400 focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="settings-office-hours" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Office Hours
                            </label>
                            <input
                              id="settings-office-hours"
                              value={isEditingFaculty ? (facultyForm.officeHours ?? "") : (facultyProfile.officeHours ?? "")}
                              onChange={(e) => setFacultyForm((f) => ({ ...f, officeHours: e.target.value || null }))}
                              readOnly={!isEditingFaculty}
                              placeholder="e.g. Mon 2-4pm, Wed 10-12"
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${isEditingFaculty ? "text-[#2B2A2A] placeholder:text-gray-400 focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent" : "bg-gray-50 text-gray-700"}`}
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-3 pt-2 flex items-center gap-3">
                            {isEditingFaculty ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditingFaculty(false);
                                    setFacultyProfilePicture(null);
                                    setFacultyForm({
                                      name: facultyProfile.name ?? "",
                                      department: facultyProfile.department ?? "",
                                      qualifications: facultyProfile.qualifications ?? "",
                                      phoneNumber: facultyProfile.phoneNumber ?? "",
                                      officeLocation: facultyProfile.officeLocation ?? "",
                                      officeHours: facultyProfile.officeHours ?? "",
                                    });
                                  }}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-[14px] font-medium text-[#2B2A2A] transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleFacultyUpdate}
                                  disabled={updatingFaculty}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] disabled:opacity-60 rounded-xl text-[14px] font-semibold text-white transition-colors"
                                >
                                  {updatingFaculty ? "Saving…" : "Save changes"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsEditingFaculty(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] rounded-xl text-[14px] font-semibold text-white transition-colors"
                              >
                                <Pencil className="w-4 h-4" strokeWidth={2} />
                                Edit account
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : viewMode === "gradingAssistant" ? (
                    <>
                      {gaProfileLoading && <p className="text-[14px] text-gray-600 mb-4">Loading profile…</p>}
                      {gaProfileError && !gaProfileLoading && (
                        <div className="mb-4 py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                          {gaProfileError}
                        </div>
                      )}
                      {!gaProfileLoading && gaProfile && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <label htmlFor="settings-ga-full-name" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Full Name
                            </label>
                            <input
                              id="settings-ga-full-name"
                              value={isEditingGa ? gaNameEdit : displayName}
                              onChange={(e) => setGaNameEdit(e.target.value)}
                              readOnly={!isEditingGa}
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${
                                isEditingGa
                                  ? "text-[#2B2A2A] focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                                  : "bg-gray-50 text-gray-700"
                              }`}
                            />
                          </div>
                          <div>
                            <label htmlFor="settings-ga-email" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                              Email Address
                            </label>
                            <input
                              id="settings-ga-email"
                              value={displayEmail}
                              readOnly
                              disabled
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-500 cursor-not-allowed opacity-90"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">Role</label>
                            <input
                              value={gaProfile.role ? gaProfile.role.replace(/_/g, " ") : ""}
                              readOnly
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">Department</label>
                            <input
                              value={gaProfile.department ?? ""}
                              readOnly
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">Office Hours</label>
                            <input
                              value={gaProfile.officeHours ?? ""}
                              readOnly
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
                            {isEditingGa ? (
                              <>
                                <button
                                  type="button"
                                  onClick={cancelGaAccountEdit}
                                  disabled={updatingGaAccount}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-[14px] font-medium text-[#2B2A2A] transition-colors disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleGaAccountSave}
                                  disabled={updatingGaAccount}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] disabled:opacity-60 rounded-xl text-[14px] font-semibold text-white transition-colors"
                                >
                                  {updatingGaAccount ? "Saving…" : "Save changes"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setGaNameEdit(displayName);
                                  setGaProfilePicture(null);
                                  setIsEditingGa(true);
                                }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] rounded-xl text-[14px] font-semibold text-white transition-colors"
                              >
                                <Pencil className="w-4 h-4" strokeWidth={2} />
                                Edit account
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="settings-student-full-name" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                          Full Name
                        </label>
                        <input
                          id="settings-student-full-name"
                          value={isEditingStudent ? studentNameEdit : displayName}
                          onChange={(e) => setStudentNameEdit(e.target.value)}
                          readOnly={!isEditingStudent}
                          className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none ${
                            isEditingStudent
                              ? "text-[#2B2A2A] focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-student-email" className="block text-[14px] text-[#2B2A2A] mb-2 font-medium">
                          Email Address
                        </label>
                        <input
                          id="settings-student-email"
                          value={displayEmail}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-500 cursor-not-allowed opacity-90"
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
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {isEditingStudent ? (
                          <>
                            <button
                              type="button"
                              onClick={cancelStudentAccountEdit}
                              disabled={updatingStudentAccount}
                              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-[14px] font-medium text-[#2B2A2A] transition-colors disabled:opacity-60"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleStudentAccountSave}
                              disabled={updatingStudentAccount}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] disabled:opacity-60 rounded-xl text-[14px] font-semibold text-white transition-colors"
                            >
                              {updatingStudentAccount ? "Saving…" : "Save changes"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentNameEdit(displayName);
                              setStudentProfilePicture(null);
                              setIsEditingStudent(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] rounded-xl text-[14px] font-semibold text-white transition-colors"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={2} />
                            Edit account
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1226] hover:bg-[#65101F] disabled:opacity-60 rounded-xl text-[14px] font-semibold text-white transition-colors"
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
