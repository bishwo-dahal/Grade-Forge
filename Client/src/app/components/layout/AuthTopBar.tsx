import { LogOut, Plus, Search } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import { getAuthenticatedUser, getAuthSessionTick, subscribeAuthSession } from "../../auth";
import { buildLogoutConfirmationMessage, queueAuthNotification } from "../../authNotifications";
import { ProfileAvatarCircle } from "./ProfileAvatarCircle";

export type SettingsSection = "profile" | "security" | "notifications" | "appearance";

export interface AuthTopBarProps {
  roleView: "student" | "faculty" | "gradingAssistant" | "university";
  profile: {
    name: string;
    email: string;
    initials: string;
    /** Optional; when omitted, session `profilePictureUrl` (e.g. after login) is used. */
    profilePictureUrl?: string | null;
  };
  onLogout: () => void;
  onSettingsSectionSelect?: (section: SettingsSection) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  pageTitle?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isSettingsActive?: boolean;
}

export function AuthTopBar({
  roleView,
  profile,
  onLogout,
  onSettingsSectionSelect: _onSettingsSectionSelect,
  showSearch = true,
  searchPlaceholder = "Search...",
  pageTitle,
  primaryActionLabel,
  onPrimaryAction,
  isSettingsActive: _isSettingsActive = false,
}: AuthTopBarProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  useSyncExternalStore(subscribeAuthSession, getAuthSessionTick, getAuthSessionTick);
  const sessionUser = getAuthenticatedUser();
  const displayName = sessionUser?.name?.trim() || profile.name;
  const displayEmail = sessionUser?.email?.trim() || profile.email;
  const barInitials = useMemo(() => {
    const fromName = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return fromName || profile.initials;
  }, [displayName, profile.initials]);
  const avatarPictureUrl =
    sessionUser?.profilePictureUrl?.trim() || profile.profilePictureUrl?.trim() || null;
  const avatarGradient =
    roleView === "faculty" || roleView === "gradingAssistant" || roleView === "university"
      ? "from-[#7A1226] to-[#65101F]"
      : "from-[#5A606B] to-[#474D56]";
  const accountItemGradient =
    roleView === "faculty" || roleView === "gradingAssistant" || roleView === "university"
      ? "from-[#7A1226] to-[#65101F]"
      : "from-[#5A606B] to-[#474D56]";
  // FIX: Keep the shared top bar compact across roles while preserving the university divider alignment.
  const topBarHeightClass = roleView === "university" ? "py-3" : "h-[64px]";

  const handleConfirmLogout = () => {
    queueAuthNotification(buildLogoutConfirmationMessage(roleView));
    setIsLogoutDialogOpen(false);
    onLogout();
  };

  // NOTE: Shared top-nav background is white so student/faculty/settings surfaces stay visually consistent.
  return (
    <>
      <div className={`bg-white border-b border-[#C9C4C9] px-6 ${topBarHeightClass} flex items-center`}>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex-1">
            {showSearch ? (
              <div className="max-w-[480px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                  {/* NOTE: Search input moved into shared top bar so student/faculty/settings pages stop duplicating markup. */}
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    // NOTE: Search field matches dashboard surface color so top-nav controls stay visually consistent.
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6F8] border border-[#C9C4C9] rounded-md text-[13px] text-[#1F2430] placeholder:text-[#747D90] focus:outline-none focus:ring-2 focus:ring-[#9F3549] focus:border-transparent"
                  />
                </div>
              </div>
            ) : pageTitle ? (
              <div className="flex items-center">
                <h1 className="text-[22px] font-semibold tracking-tight text-[#1F2430]">{pageTitle}</h1>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>

        <div className="flex items-center gap-3">
          {primaryActionLabel && (
            <button
              type="button"
              onClick={onPrimaryAction}
              aria-label={primaryActionLabel}
              className="flex items-center gap-2 px-3 py-2 bg-[#7A1226] text-white rounded-md hover:bg-[#65101F] transition-colors text-[12px] font-medium"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span className="hidden lg:inline">{primaryActionLabel}</span>
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className="ml-2 flex items-center gap-3 rounded-xl border border-transparent pl-3 transition-colors hover:border-[#C9C4C9] hover:bg-[#F5F4F6]"
              >
                <ProfileAvatarCircle
                  initials={barInitials}
                  gradientClassName={avatarGradient}
                  imageUrl={avatarPictureUrl}
                  alt=""
                />
                <div className="border-l border-[#C9C4C9] pl-3 text-left">
                  <div className="text-[13px] font-semibold text-[#1F2430]">{displayName}</div>
                  <div className="text-[11px] text-gray-500">{displayEmail}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setIsLogoutDialogOpen(true);
                }}
              >
                <LogOut className="w-4 h-4 text-red-600" strokeWidth={2} />
                <span className="text-[13px] font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>
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
