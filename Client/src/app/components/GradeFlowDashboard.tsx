import { useState } from "react";
import { GradeForgeSidebar } from "./GradeForgeSidebar";
import { GradeForgeMain } from "./GradeForgeMain";
import { GradeForgeRightPanel } from "./GradeForgeRightPanel";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";

export function GradeForgeDashboard() {
  // NOTE: This screen still renders a static student mock; no role switch control in sidebar anymore.
  const [viewMode] = useState<'student' | 'faculty'>('student');

  return (
    <div className="flex h-screen w-full bg-[#F5F2F2]">
      {/* Left Sidebar */}
      <GradeForgeSidebar viewMode={viewMode} />
      
      {/* Main Content */}
      {viewMode === 'student' ? <GradeForgeMain /> : <FacultyMain />}
      
      {/* Right Panel */}
      {viewMode === 'student' ? <GradeForgeRightPanel /> : <FacultyRightPanel />}
    </div>
  );
}
