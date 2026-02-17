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

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {showSearch ? (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
              {/* NOTE: Search input moved into shared top bar so student/faculty/settings pages stop duplicating markup. */}
              <input
                type="text"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
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
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open settings menu"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  isSettingsActive ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "hover:bg-gray-100"
                }`}
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

          <div className="ml-2 flex items-center gap-3 pl-3 border-l border-gray-200">
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
