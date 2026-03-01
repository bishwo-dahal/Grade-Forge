import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, FileText, Inbox } from "lucide-react";
import type { AssignmentDetailResponse } from "../../../types/gradingAssistantAssignment";
import type { GradingAssistantRubricResponse } from "../../../types/gradingAssistantRubric";
import type { GradingAssistantSubmissionResponse } from "../../../types/gradingAssistantSubmission";
import { getAssignmentByCourse } from "../../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../../services/gradingAssistantRubricService";
import { listSubmissionsByAssignment } from "../../../services/gradingAssistantSubmissionService";
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
  const [rubric, setRubric] = useState<GradingAssistantRubricResponse | null>(null);
  const [submissions, setSubmissions] = useState<GradingAssistantSubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
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

  useEffect(() => {
    if (!assignment?.rubricId) {
      setRubric(null);
      return;
    }
    setRubricLoading(true);
    getRubric(assignment.rubricId)
      .then(setRubric)
      .catch(() => setRubric(null))
      .finally(() => setRubricLoading(false));
  }, [assignment?.rubricId]);

  useEffect(() => {
    if (!assignmentId) return;
    const aId = Number(assignmentId);
    if (!aId) return;
    setSubmissionsLoading(true);
    listSubmissionsByAssignment(aId)
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setSubmissionsLoading(false));
  }, [assignmentId]);

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
          <div className="max-w-5xl mx-auto px-8 py-6">
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
                  {assignment.rubricId != null && (
                    <div className="pt-2 border-t border-gray-100">
                      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Rubric</h3>
                      {rubricLoading && <p className="text-[14px] text-gray-500">Loading rubric…</p>}
                      {!rubricLoading && rubric && (
                        <div className="space-y-3">
                          <p className="text-[14px] font-medium text-[#2B2A2A]">{rubric.name ?? assignment.rubricName ?? "Rubric"}</p>
                          {rubric.description && (
                            <p className="text-[13px] text-gray-600">{rubric.description}</p>
                          )}
                          {rubric.criteria && rubric.criteria.length > 0 && (
                            <ul className="space-y-2">
                              {rubric.criteria.map((c) => (
                                <li key={c.id} className="text-[13px] text-[#2B2A2A] border-l-2 border-[#EEF3FF] pl-3">
                                  <span className="font-medium">{c.title ?? "Criterion"}</span>
                                  {c.maxScore != null && (
                                    <span className="text-gray-500"> — max {c.maxScore} pts</span>
                                  )}
                                  {c.weight != null && (
                                    <span className="text-gray-500"> (weight {c.weight})</span>
                                  )}
                                  {c.description && (
                                    <p className="text-gray-600 mt-0.5">{c.description}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {!rubricLoading && !rubric && assignment.rubricName && (
                        <p className="text-[14px] text-[#2B2A2A]">{assignment.rubricName}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && assignment && (
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                  <h2 className="text-[16px] font-semibold text-[#2B2A2A]">Submissions</h2>
                </div>
                <div className="overflow-x-auto">
                  {submissionsLoading && (
                    <p className="px-6 py-4 text-[14px] text-gray-500">Loading submissions…</p>
                  )}
                  {!submissionsLoading && submissions.length === 0 && (
                    <p className="px-6 py-4 text-[14px] text-gray-500">No submissions yet.</p>
                  )}
                  {!submissionsLoading && submissions.length > 0 && (
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          <th className="px-6 py-3">Student</th>
                          <th className="px-6 py-3">Submitted</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-3">
                              <Link
                                to={`/grading-assistant/class/${classId}/assignment/${assignmentId}/submission/${s.id}`}
                                className="text-[14px] font-medium text-[#5A7ACD] hover:underline"
                              >
                                {s.studentName ?? s.studentEmail ?? `Submission #${s.id}`}
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-[14px] text-[#2B2A2A]">
                              {formatDate(s.submittedAt ?? undefined)}
                            </td>
                            <td className="px-6 py-3 text-[14px] text-[#2B2A2A]">
                              {s.status ?? "—"}
                            </td>
                            <td className="px-6 py-3 text-[14px] text-[#2B2A2A]">
                              {s.marks != null ? String(s.marks) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
