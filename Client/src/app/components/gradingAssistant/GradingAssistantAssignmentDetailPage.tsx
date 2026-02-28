import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, FileText } from "lucide-react";
import type { AssignmentDetailResponse } from "../../../types/gradingAssistantAssignment";
import { getAssignmentByCourse } from "../../../services/gradingAssistantAssignmentService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function GradingAssistantAssignmentDetailPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const displayName = user?.name ?? "Grading Assistant";
  const displayEmail = user?.email ?? "";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GA";

  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !assignmentId) {
      setLoading(false);
      return;
    }
    const courseId = Number(classId);
    const aId = Number(assignmentId);
    if (!courseId || !aId) {
      setLoading(false);
      setError("Invalid course or assignment.");
      return;
    }
    setLoading(true);
    setError(null);
    getAssignmentByCourse(courseId, aId)
      .then(setAssignment)
      .catch(() => setError("Failed to load assignment."))
      .finally(() => setLoading(false));
  }, [classId, assignmentId]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <AuthShell
      roleView="gradingAssistant"
      topBar={
        <AuthTopBar
          roleView="gradingAssistant"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
          <div className="max-w-3xl mx-auto px-8 py-6">
            <Link
              to={`/grading-assistant/class/${classId}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Back to course
            </Link>

            {loading && <p className="text-[14px] text-gray-600">Loading assignment…</p>}
            {error && !loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-[14px] text-red-600">{error}</p>
                <Link
                  to={`/grading-assistant/class/${classId}`}
                  className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]"
                >
                  Back to course
                </Link>
              </div>
            )}
            {!loading && assignment && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                    </div>
                    <div>
                      <h1 className="text-[22px] font-semibold text-[#2B2A2A]">{assignment.name}</h1>
                      {assignment.courseName && (
                        <p className="text-[13px] text-gray-600 mt-0.5">{assignment.courseName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-5">
                  {assignment.description && (
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h3>
                      <p className="text-[14px] text-[#2B2A2A] whitespace-pre-wrap">{assignment.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignment.totalPoints != null && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total points</h3>
                        <p className="text-[14px] text-[#2B2A2A]">{assignment.totalPoints}</p>
                      </div>
                    )}
                    {assignment.submissionType && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Submission type</h3>
                        <p className="text-[14px] text-[#2B2A2A]">{assignment.submissionType.replace(/_/g, " ")}</p>
                      </div>
                    )}
                    {assignment.languageName && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Language</h3>
                        <p className="text-[14px] text-[#2B2A2A]">{assignment.languageName}</p>
                      </div>
                    )}
                    {assignment.rubricName && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Rubric</h3>
                        <p className="text-[14px] text-[#2B2A2A]">{assignment.rubricName}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Available from</h3>
                      <p className="text-[14px] text-[#2B2A2A]">{formatDate(assignment.availableFrom)}</p>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Due date</h3>
                      <p className="text-[14px] text-[#2B2A2A]">{formatDate(assignment.dueDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Late due date</h3>
                      <p className="text-[14px] text-[#2B2A2A]">{formatDate(assignment.lateDueDate)}</p>
                    </div>
                  </div>
                  {assignment.starterCodeUrl && (
                    <div className="pt-2 border-t border-gray-100">
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Starter code</h3>
                      <a
                        href={assignment.starterCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-[#5A7ACD] hover:underline break-all"
                      >
                        {assignment.starterCodeUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      }
    />
  );
}
