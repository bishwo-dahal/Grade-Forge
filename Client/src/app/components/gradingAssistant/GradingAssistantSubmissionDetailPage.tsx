import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import type { AssignmentDetailResponse } from "../../../types/gradingAssistantAssignment";
import type { GradingAssistantRubricResponse, RubricCriteriaResponse } from "../../../types/gradingAssistantRubric";
import type { GradingAssistantSubmissionResponse } from "../../../types/gradingAssistantSubmission";
import type { SubmissionGradeResponse } from "../../../types/gradingAssistantSubmissionGrade";
import { getAssignmentByCourse } from "../../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../../services/gradingAssistantRubricService";
import {
  listSubmissionsByAssignment,
  updateSubmissionGrade,
} from "../../../services/gradingAssistantSubmissionService";
import {
  createGrade,
  getGradesBySubmission,
  updateGrade,
} from "../../../services/gradingAssistantSubmissionGradeService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";
import { SubmissionGradingPanel } from "../grading/SubmissionGradingPanel";

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

export function GradingAssistantSubmissionDetailPage() {
  const { classId, assignmentId, submissionId } = useParams();
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
  const [submission, setSubmission] =
    useState<GradingAssistantSubmissionResponse | null>(null);
  const [rubric, setRubric] = useState<GradingAssistantRubricResponse | null>(null);
  const [grades, setGrades] = useState<SubmissionGradeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !assignmentId || !submissionId) {
      setLoading(false);
      return;
    }
    const cId = Number(classId);
    const aId = Number(assignmentId);
    const sId = Number(submissionId);
    if (!cId || !aId || !sId) {
      setLoading(false);
      setError("Invalid course, assignment, or submission.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getAssignmentByCourse(cId, aId),
      listSubmissionsByAssignment(aId),
      getGradesBySubmission(sId),
    ])
      .then(([assign, list, gradeList]) => {
        setAssignment(assign);
        const found = list.find((s) => s.id === sId);
        setSubmission(found ?? null);
        setGrades(gradeList);
      })
      .catch(() => setError("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [classId, assignmentId, submissionId]);

  const gradesByCriteriaId = useMemo(() => {
    const map: Record<number, SubmissionGradeResponse> = {};
    for (const g of grades) {
      map[g.rubricCriteriaId] = g;
    }
    return map;
  }, [grades]);

  useEffect(() => {
    if (!assignment?.rubricId) {
      setRubric(null);
      return;
    }
    getRubric(assignment.rubricId)
      .then(setRubric)
      .catch(() => setRubric(null));
  }, [assignment?.rubricId]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleSaveOverall = async (data: { marks: number; feedback: string }) => {
    if (!submissionId || submission == null) return;
    const payload = {
      marks: data.marks,
      feedback: data.feedback.trim() || undefined,
    };
    const updated = await updateSubmissionGrade(submissionId, payload);
    setSubmission(updated);
  };

  const handleSaveRubric = async (
    items: Array<{ criterionId: number; awardedScore: number; feedback: string }>,
  ) => {
    if (!submission) return;
    const subId = submission.id;
    const promises: Promise<SubmissionGradeResponse>[] = [];
    for (const item of items) {
      const payload = {
        submissionId: subId,
        rubricCriteriaId: item.criterionId,
        awardedScore: item.awardedScore,
        feedback: item.feedback.trim() || undefined,
      };
      const existing = gradesByCriteriaId[item.criterionId];
      if (existing) {
        promises.push(updateGrade(existing.id, payload));
      } else {
        promises.push(createGrade(payload));
      }
    }
    await Promise.all(promises);
    const updated = await getGradesBySubmission(subId);
    setGrades(updated);
  };

  return (
    <AuthShell
      roleView="gradingAssistant"
      topBar={
        <AuthTopBar
          roleView="gradingAssistant"
          profile={{
            name: displayName,
            email: displayEmail,
            initials: displayInitials,
          }}
          searchPlaceholder="Search..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
          <div className="max-w-5xl mx-auto px-8 py-6">
            <Link
              to={`/grading-assistant/class/${classId}/assignment/${assignmentId}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Back to assignment
            </Link>

            {loading && (
              <p className="text-[14px] text-gray-600">Loading submission…</p>
            )}
            {error && !loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-[14px] text-red-600">{error}</p>
                <Link
                  to={`/grading-assistant/class/${classId}/assignment/${assignmentId}`}
                  className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]"
                >
                  Back to assignment
                </Link>
              </div>
            )}
            {!loading && submission && (
              <SubmissionGradingPanel
                header={{
                  studentName: submission.studentName,
                  studentEmail: submission.studentEmail,
                  assignmentName: submission.assignmentName,
                  courseName: submission.courseName,
                  submittedAt: submission.submittedAt,
                  status: submission.status,
                  currentMarks: submission.marks ?? null,
                  currentFeedback: submission.feedback ?? null,
                }}
                files={submission.files}
                rubric={
                  rubric && rubric.criteria
                    ? {
                        name: rubric.name ?? assignment?.rubricName ?? null,
                        criteria: rubric.criteria as RubricCriteriaResponse[],
                        existingGrades: Object.fromEntries(
                          Object.entries(gradesByCriteriaId).map(
                            ([id, g]) => [
                              Number(id),
                              { awardedScore: g.awardedScore, feedback: g.feedback ?? null },
                            ],
                          ),
                        ),
                      }
                    : null
                }
                onSaveOverall={handleSaveOverall}
                onSaveRubric={
                  rubric && rubric.criteria && rubric.criteria.length > 0 ? handleSaveRubric : undefined
                }
              />
            )}
          </div>
        </main>
      }
    />
  );
}
