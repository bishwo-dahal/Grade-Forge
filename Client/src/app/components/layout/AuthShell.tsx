import { useEffect, type ReactNode } from "react";
import { GradeForgeSidebar } from "../GradeForgeSidebar";
import { consumeAndShowAuthNotification } from "../../authNotifications";

export interface AuthShellProps {
  roleView: "student" | "faculty" | "gradingAssistant" | "university";
  topBar: ReactNode;
  mainContent: ReactNode;
  rightPanel?: ReactNode;
}

export function AuthShell({ roleView, topBar, mainContent, rightPanel }: AuthShellProps) {
  useEffect(() => {
    consumeAndShowAuthNotification();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F5F4F6] text-[#1F2430]">
      {/* NOTE: Sidebar stays shared so navigation styling stays consistent across authenticated pages. */}
      <GradeForgeSidebar viewMode={roleView} />

      {/* NOTE: Shell owns the shared top-bar region while each page injects role-specific workflow content. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {topBar}
        {mainContent}
      </div>

      {/* NOTE: Right panel remains optional because only dashboard workflows need it today. */}
      {rightPanel}
    </div>
  );
}
