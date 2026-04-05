import { Bell, Lock, LogOut, Plus, Search, Settings, SunMedium, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { buildLogoutConfirmationMessage, queueAuthNotification } from "../../authNotifications";

export type SettingsSection = "profile" | "security" | "notifications" | "appearance";

export interface AuthTopBarProps {
  roleView: "student" | "faculty" | "gradingAssistant" | "university";
  profile: {
    name: string;
    email: string;
    initials: string;
  };
  onLogout: () => void;
  onSettingsSectionSelect?: (section: SettingsSection) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isSettingsActive?: boolean;
}

export function AuthTopBar({
  roleView,
  profile,
  onLogout,
  onSettingsSectionSelect,
  showSearch = true,
  searchPlaceholder = "Search...",
  primaryActionLabel,
  onPrimaryAction,
  isSettingsActive = false,
}: AuthTopBarProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const avatarGradient =
    roleView === "faculty" || roleView === "gradingAssistant" || roleView === "university"
      ? "from-[#7A1226] to-[#65101F]"
      : "from-[#5A606B] to-[#474D56]";
  const accountItemGradient =
    roleView === "faculty" || roleView === "gradingAssistant" || roleView === "university"
      ? "from-[#7A1226] to-[#65101F]"
      : "from-[#5A606B] to-[#474D56]";
  // NOTE: Keep top-bar visual tokens centralized so future pages inherit the same navigation style by default.
  const iconButtonBaseClass =
    // FIX: Notification/settings actions now use plain white surfaces (no gray fill) to match toolbar styling requirements.
    "h-9 w-9 rounded-md border border-[#C9C4C9] bg-white text-[#5D667A] hover:bg-[#F5F4F6] transition-colors flex items-center justify-center";
  // FIX: University mode needs a taller search/topbar block so its divider aligns with the sidebar section break.
  const topBarHeightClass = roleView === "university" ? "py-5" : "h-[76px]";

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
        {showSearch ? (
          <div className="flex-1 max-w-[480px]">
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
        ) : (
          <div className="flex-1" />
        )}

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

          <button
            aria-label="Notifications"
            // NOTE: Icon buttons use a bordered neutral container to match the updated top-nav visual system.
            className={iconButtonBaseClass}
          >
            <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open settings menu"
                className={`${iconButtonBaseClass} ${isSettingsActive ? "border-[#9F3549]" : ""}`}
              >
                <Settings className="w-[17px] h-[17px]" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-[#1F2430]">Settings</span>
                <span className="text-[11px] text-gray-500">Manage your account and preferences</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("profile")}>
                <User className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#1F2430]">Account</span>
                  <span className="text-[11px] text-gray-500">Profile info and basic details</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("security")}>
                <Lock className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#1F2430]">Security</span>
                  <span className="text-[11px] text-gray-500">Password and sign-in settings</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("notifications")}>
                <Bell className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#1F2430]">Notifications</span>
                  <span className="text-[11px] text-gray-500">Email and in-app alerts</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("appearance")}>
                <SunMedium className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#1F2430]">Appearance</span>
                  <span className="text-[11px] text-gray-500">Theme and display preferences</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

          <div className="ml-2 flex items-center gap-3 pl-3 border-l border-[#C9C4C9]">
            <div className={`w-9 h-9 bg-gradient-to-br ${avatarGradient} rounded-full flex items-center justify-center`}>
              <span className="text-white text-[13px] font-medium">{profile.initials}</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#1F2430]">{profile.name}</div>
              <div className="text-[11px] text-gray-500">{profile.email}</div>
            </div>
          </div>
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
