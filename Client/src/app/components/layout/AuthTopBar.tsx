import { Bell, Lock, LogOut, Plus, Search, Settings, SunMedium } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type SettingsSection = "profile" | "security" | "notifications" | "appearance";

export interface AuthTopBarProps {
  roleView: "student" | "faculty";
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
  const avatarGradient =
    roleView === "faculty" ? "from-[#5A7ACD] to-[#4a6abd]" : "from-[#FEB05D] to-[#ff9a3d]";
  const accountItemGradient =
    roleView === "faculty" ? "from-[#5A7ACD] to-[#4a6abd]" : "from-[#FEB05D] to-[#ff9a3d]";
  // NOTE: Keep top-bar visual tokens centralized so future pages inherit the same navigation style by default.
  const iconButtonBaseClass =
    // FIX: Notification/settings actions now use plain white surfaces (no gray fill) to match toolbar styling requirements.
    "h-9 w-9 rounded-xl border border-[#CFD2D9] bg-white text-[#677083] hover:bg-white transition-colors flex items-center justify-center";

  // NOTE: Shared top-nav background is white so student/faculty/settings surfaces stay visually consistent.
  return (
    <div className="bg-white border-b border-[#CFD2D9] px-6 py-3">
      <div className="flex items-center justify-between gap-4">
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
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F2F2] border border-[#CFD2D9] rounded-xl text-[13px] text-[#2B2A2A] placeholder:text-[#747D90] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
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
              className="flex items-center gap-2 px-3 py-2 bg-[#2B2A2A] text-white rounded-lg hover:bg-[#3a3939] transition-colors text-[12px] font-medium"
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
                className={`${iconButtonBaseClass} ${isSettingsActive ? "border-[#A7B4D8]" : ""}`}
              >
                <Settings className="w-[17px] h-[17px]" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-[#2B2A2A]">Settings</span>
                <span className="text-[11px] text-gray-500">Manage your account and preferences</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("profile")}>
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${accountItemGradient} flex items-center justify-center text-[11px] font-medium text-white mr-1.5`}
                >
                  {profile.initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#2B2A2A]">Account</span>
                  <span className="text-[11px] text-gray-500">Profile info and basic details</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("security")}>
                <Lock className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#2B2A2A]">Security</span>
                  <span className="text-[11px] text-gray-500">Password and sign-in settings</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("notifications")}>
                <Bell className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#2B2A2A]">Notifications</span>
                  <span className="text-[11px] text-gray-500">Email and in-app alerts</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSettingsSectionSelect?.("appearance")}>
                <SunMedium className="w-4 h-4 text-gray-600" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#2B2A2A]">Appearance</span>
                  <span className="text-[11px] text-gray-500">Theme and display preferences</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                <LogOut className="w-4 h-4 text-red-600" strokeWidth={2} />
                <span className="text-[13px] font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-2 flex items-center gap-3 pl-3 border-l border-[#C9CDD6]">
            <div className={`w-9 h-9 bg-gradient-to-br ${avatarGradient} rounded-full flex items-center justify-center`}>
              <span className="text-white text-[13px] font-medium">{profile.initials}</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#2B2A2A]">{profile.name}</div>
              <div className="text-[11px] text-gray-500">{profile.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
