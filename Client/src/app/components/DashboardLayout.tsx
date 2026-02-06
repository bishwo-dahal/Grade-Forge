import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { RightPanel } from "./RightPanel";

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-white">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <MainContent />
      
      {/* Right Side Panel */}
      <RightPanel />
    </div>
  );
}
