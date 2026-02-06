import { useState } from "react";
import { GradeFlowSidebar } from "./GradeFlowSidebar";
import { GradeFlowMain } from "./GradeFlowMain";
import { GradeFlowRightPanel } from "./GradeFlowRightPanel";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";

export function GradeFlowDashboard() {
  const [viewMode, setViewMode] = useState<'student' | 'faculty'>('student');

  return (
    <div className="flex h-screen w-full bg-[#F5F2F2]">
      {/* Left Sidebar */}
      <GradeFlowSidebar viewMode={viewMode} onViewChange={setViewMode} />
      
      {/* Main Content */}
      {viewMode === 'student' ? <GradeFlowMain /> : <FacultyMain />}
      
      {/* Right Panel */}
      {viewMode === 'student' ? <GradeFlowRightPanel /> : <FacultyRightPanel />}
    </div>
  );
}