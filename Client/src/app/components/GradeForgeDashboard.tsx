import { Navigate } from "react-router";
import { GradeForgeSidebar } from "./GradeForgeSidebar";
import { GradeForgeMain } from "./GradeForgeMain";
import { GradeForgeRightPanel } from "./GradeForgeRightPanel";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";
import { getAuthenticatedRole } from "../auth";

export function GradeForgeDashboard() {
  const role = getAuthenticatedRole();

  if (role === "UNIVERSITY_ADMIN") {
    // NOTE: University admins should never render student/faculty dashboard UI.
    return <Navigate to="/university-admin" replace />;
  }

  // NOTE: View mode is now role-driven; removed manual student/faculty switching.
  const viewMode: "student" | "faculty" = role === "FACULTY" ? "faculty" : "student";

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
