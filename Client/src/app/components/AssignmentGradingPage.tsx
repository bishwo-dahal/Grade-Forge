import React, { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Link, useNavigate, useParams } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, GripVertical, User, CheckSquare, Download } from "lucide-react";
import { AssignmentHeader } from "./assignment/AssignmentHeader";
import { DescriptionPanel } from "./assignment/DescriptionPanel";
import { PublicTestsPanel } from "./assignment/PublicTestsPanel";
import { GradingRubricPanel } from "./assignment/GradingRubricPanel";
import { CircularScorePanel } from "./assignment/CircularScorePanel";
import { GradeSubmissionDialog } from "./assignment/GradeSubmissionDialog";
import { CodeWorkspace } from "./assignment/CodeWorkspace";
import { PlagiarismReportPanel } from "./assignment/PlagiarismReportPanel";
import {
  getAssignmentDescription,
  getAssignmentDetailById,
  listRubricCategories,
} from "../../services/assignmentService";
import { getRubric as getRubricFaculty } from "../../services/rubricService";
import type { Rubric } from "../../types/rubric";
import {
  fetchSubmissionFileText,
  getFacultySubmissionById,
  patchAuthorshipTriage,
  resolvePreviewLanguage,
  submitFacultySubmissionGrade,
} from "../../services/submissionService";
import type { AuthorshipTriageLabel } from "../../services/submissionService";
import {
  createGradesBatch,
  getSubmissionGrades,
  replaceSubmissionGrades,
} from "../../services/facultySubmissionGradeService";
import { getRunTestsLatest, requestRunTests, runTestsWithFiles, pollRunTestsUntilDone } from "../../services/runTestsService";
import { getAssignmentByCourse } from "../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../services/gradingAssistantRubricService";
import {
  getSubmissionById,
  listSubmissionsByAssignment,
  updateSubmissionGrade,
} from "../../services/gradingAssistantSubmissionService";
import {
  getGASubmissionGrades,
  createGASubmissionGradesBatch,
  replaceGASubmissionGrades,
} from "../../services/gradingAssistantSubmissionGradeService";
import { clearAuthenticated, getAuthenticatedUser, getAuthenticatedRole } from "../auth";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import type { AssignmentDetail, AssignmentDescription } from "../../types/assignment";
import type { RubricCategory } from "../../types/grade";
import type { GradingAssistantRubricResponse } from "../../types/gradingAssistantRubric";
import type { TestRunJobStatusResponse } from "../../types/runTests";
import { roundTo2 } from "../../utils/number";
import type { PublicTestCase } from "../../types/submission";
import { getLatestGraderReportForStudent } from "../../services/graderReportService";
import type { GraderReportResultItem } from "../../types/graderReport";

type GradingTabType = "description" | "tests" | "plagiarism" | "rubric" | "group";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** Map GA rubric (flat) to RubricCategory[] for GradingRubricPanel */
function mapGARubricToCategories(rubric: GradingAssistantRubricResponse | null): RubricCategory[] {
  if (!rubric?.criteria?.length) return [];
  const points = rubric.criteria.reduce((sum, c) => {
    const cr = c as { maxScore?: number };
    return sum + (cr.maxScore ?? 0);
  }, 0);
  return [
    {
      name: rubric.name ?? "Rubric",
      points,
      criteria: rubric.criteria.map((c) => {
        const cr = c as { id?: number; title?: string; maxScore?: number; weight?: number | null };
        return {
          id: cr.id,
          description: cr.title ?? "Criterion",
          points: cr.maxScore ?? 0,
          weight: cr.weight ?? null,
        };
      }),
    },
  ];
}

/** Check if GA rubric has nested criteria (subCriteria). */
function gaRubricHasNestedCriteria(rubric: GradingAssistantRubricResponse | null): boolean {
  return (
    (rubric?.criteria?.some((c) => {
      const cr = c as { subCriteria?: unknown[] };
      return (cr.subCriteria?.length ?? 0) > 0;
    }) ?? false)
  );
}

/** Map GA rubric response (with rubricType, criteria[].points, subCriteria) to faculty Rubric type for same grading UI. */
function mapGARubricToRubric(ga: GradingAssistantRubricResponse | null): Rubric | null {
  if (!ga?.criteria?.length || !gaRubricHasNestedCriteria(ga)) return null;
  return {
    id: ga.id,
    name: ga.name ?? "Rubric",
    description: ga.description ?? null,
    facultyId: ga.facultyId ?? null,
    rubricType: ga.rubricType,
    criteria: ga.criteria.map((c) => {
      const cr = c as {
        id?: number;
        title?: string;
        points?: number | null;
        subCriteria?: Array<{ id?: number; description?: string; maxScore: number; weight?: number | null }>;
      };
      return {
        id: cr.id,
        title: cr.title ?? "Criterion",
        points: cr.points ?? null,
        subCriteria: (cr.subCriteria ?? []).map((s) => ({
          id: s.id,
          description: s.description ?? null,
          maxScore: s.maxScore,
          weight: s.weight ?? null,
        })),
      };
    }),
  };
}

/** Build RubricCategory[] from full Rubric (flatten subCriteria) so dialog flat state matches. */
function rubricToCategories(rubric: Rubric): RubricCategory[] {
  const flatCriteria: Array<{ id?: number; description: string; points: number; weight?: number | null }> = [];
  let totalPoints = 0;
  for (const criterion of rubric.criteria) {
    if (criterion.subCriteria?.length) {
      for (const sub of criterion.subCriteria) {
        flatCriteria.push({
          id: sub.id,
          description: sub.description?.trim() ? sub.description : criterion.title,
          points: sub.maxScore,
          weight: sub.weight ?? null,
        });
        totalPoints += sub.maxScore;
      }
    } else {
      const maxScore = criterion.maxScore ?? 0;
      flatCriteria.push({
        id: criterion.id,
        description: criterion.description?.trim() ? `${criterion.title}: ${criterion.description}` : criterion.title,
        points: maxScore,
        weight: criterion.weight ?? null,
      });
      totalPoints += maxScore;
    }
  }
  return [
    {
      name: rubric.name,
      points: totalPoints,
      criteria: flatCriteria,
    },
  ];
}

/** Build minimal AssignmentDetail for header when we only have GA assignment response. */
function buildAssignmentDetailFromGA(
  name: string,
  courseName: string,
  dueDate: string,
  options: {
    submissionMarks?: number | null;
    totalPoints?: number | null;
    submissionStatus?: string | null;
  } = {}
): AssignmentDetail {
  const { submissionMarks = null, totalPoints = 0, submissionStatus = null } = options;
  const normalizedStatus =
    submissionStatus?.toLowerCase() === "graded"
      ? "graded"
      : submissionStatus?.toLowerCase() === "submitted"
        ? "submitted"
        : submissionMarks != null
          ? "graded"
          : "submitted";
  return {
    id: "",
    title: name,
    course: courseName,
    courseCode: "",
    dueDate: formatDate(dueDate),
    status: normalizedStatus,
    points: { earned: submissionMarks ?? null, total: totalPoints ?? 0 },
    submissionsUsed: 0,
    submissionsAllowed: null,
    language: "Python",
    languageAllowedExtensions: null,
    hasStarterCode: false,
  };
}

export function AssignmentGradingPage() {
  const { classId, assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const role = getAuthenticatedRole();
  const isFaculty = role === "FACULTY";
  const isGA = role === "GRADING_ASSISTANT";

  const [activeTab, setActiveTab] = useState<GradingTabType>("description");
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [description, setDescription] = useState<AssignmentDescription | null>(null);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [rubricNested, setRubricNested] = useState<Rubric | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<{ fileName: string; content: string }[]>([]);
  const [submissionFileLinks, setSubmissionFileLinks] = useState<{ fileName: string; downloadUrl: string | null }[]>([]);
  const [submissionLanguage, setSubmissionLanguage] = useState<string>("Python");
  const [studentName, setStudentName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [subGroupName, setSubGroupName] = useState<string | null>(null);
  const [subGroupMembers, setSubGroupMembers] = useState<
    Array<{ id: number; name: string; email: string; cwid: string }>
  >([]);
  const [submittedAt, setSubmittedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionMarks, setSubmissionMarks] = useState<number | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string>("");
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<TestRunJobStatusResponse | null>(null);
  const [rubricExistingGrades, setRubricExistingGrades] = useState<
    Record<
      number,
      {
        awardedScore: number;
        feedback?: string | null;
      }
    >
  >({});

  // Latest grader report-derived scores (used by the compact rings).
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [aiRiskScore, setAiRiskScore] = useState<number | null>(null);

  const [authorshipTriageLabel, setAuthorshipTriageLabel] = useState<AuthorshipTriageLabel | null>(null);
  const [authorshipTriageNotes, setAuthorshipTriageNotes] = useState("");
  const [authorshipTriageLabeledAt, setAuthorshipTriageLabeledAt] = useState<string | null>(null);
  const [authorshipTriageSaving, setAuthorshipTriageSaving] = useState(false);
  const [authorshipTriageError, setAuthorshipTriageError] = useState<string | null>(null);

  const backToAssignmentUrl = isFaculty
    ? `/faculty/class/${classId}/assignment/${assignmentId}`
    : `/grading-assistant/class/${classId}/assignment/${assignmentId}`;
  const backLabel = "Back to assignment";

  const resolvedSubmissionId =
    submissionId != null && submissionId !== "" && Number.isFinite(Number(submissionId))
      ? String(submissionId)
      : null;

  const loadFacultyData = useCallback(async () => {
    if (!assignmentId || !submissionId) return;
    const aId = assignmentId;
    const sId = submissionId;
    try {
      const [assignData, descData, rubricData, row] = await Promise.all([
        getAssignmentDetailById(aId),
        getAssignmentDescription(aId),
        listRubricCategories(aId),
        getFacultySubmissionById(sId),
      ]);
      setAssignment(assignData);
    setDescription(descData);
    setRubricCategories(rubricData);
    if (assignData.rubricId != null) {
      getRubricFaculty(assignData.rubricId)
        .then(setRubricNested)
        .catch(() => setRubricNested(null));
    } else {
      setRubricNested(null);
    }
    const files = row.files ?? [];
    if (!files.length) {
      setError("Submission or files not found.");
      return;
    }
    setStudentName(row.studentName);
    setStudentEmail(row.studentEmail ?? null);
    setStudentId(row.studentId != null ? String(row.studentId) : null);
    setSubGroupName(row.subGroupName ?? null);
    setSubGroupMembers((row.subGroupMembers ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      cwid: m.cwid,
    })));
    setSubmittedAt(formatDate(row.submittedAt));
    setSubmissionLanguage(resolvePreviewLanguage(files[0].fileName, assignData.language));
    setSubmissionMarks(row.marks ?? null);
    setSubmissionFeedback(row.feedback ?? "");
    setAuthorshipTriageLabel(row.authorshipTriageLabel ?? null);
    setAuthorshipTriageNotes(row.authorshipTriageNotes ?? "");
    setAuthorshipTriageLabeledAt(row.authorshipTriageLabeledAt ?? null);
    setAuthorshipTriageError(null);
    // Preload existing rubric grades for this submission (GET .../submission-grades/{submissionId}).
    try {
      const grades = await getSubmissionGrades(sId);
      const bySubCriteriaId: Record<
        number,
        {
          awardedScore: number;
          feedback?: string | null;
        }
      > = {};
      for (const g of grades) {
        bySubCriteriaId[g.rubricSubCriteriaId] = {
          awardedScore: g.awardedScore,
          feedback: g.feedback ?? null,
        };
      }
      setRubricExistingGrades(bySubCriteriaId);
    } catch {
      setRubricExistingGrades({});
    }
    const filesWithContent = await Promise.all(
      files.map(async (f) => {
        const content = await fetchSubmissionFileText(f.downloadUrl ?? "", f.fileName);
        return { fileName: f.fileName, content };
      })
    );
    setSubmissionFiles(filesWithContent);
    setSubmissionFileLinks(
      files.map((f) => ({
        fileName: f.fileName,
        downloadUrl: f.downloadUrl ?? null,
      }))
    );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load submission.");
    }
  }, [assignmentId, submissionId]);

  const loadGAData = useCallback(async () => {
    if (!classId || !assignmentId || !submissionId) return;
    const cId = Number(classId);
    const aId = Number(assignmentId);
    const sId = Number(submissionId);
    if (!cId || !aId || !sId) throw new Error("Invalid IDs");
    const [assignData, sub] = await Promise.all([
      getAssignmentByCourse(cId, aId),
      getSubmissionById(sId),
    ]);
    const rubricId = assignData.rubricId ?? null;
    let totalPoints = assignData.totalPoints ?? null;
    if (rubricId != null) {
      const gaRubric = await getRubric(rubricId);
      const mappedRubric = mapGARubricToRubric(gaRubric);
      if (mappedRubric) {
        setRubricNested(mappedRubric);
        setRubricCategories(rubricToCategories(mappedRubric));
        if (totalPoints == null) {
          totalPoints = mappedRubric.criteria.reduce(
            (sum, c) =>
              sum + (c.subCriteria?.reduce((s, sub) => s + sub.maxScore, 0) ?? c.maxScore ?? 0),
            0,
          );
        }
      } else {
        setRubricNested(null);
        setRubricCategories(mapGARubricToCategories(gaRubric));
        if (totalPoints == null && gaRubric?.criteria?.length) {
          totalPoints = (gaRubric.criteria as { maxScore?: number }[]).reduce(
            (sum, c) => sum + (c.maxScore ?? 0),
            0,
          );
        }
      }
    } else {
      setRubricNested(null);
      setRubricCategories([]);
    }
    setAssignment(
      buildAssignmentDetailFromGA(
        assignData.name,
        assignData.courseName ?? "",
        sub.submittedAt ?? assignData.dueDate ?? "",
        {
          submissionMarks: sub.marks ?? sub.grade ?? null,
          totalPoints,
          submissionStatus: sub.status,
        }
      )
    );
    setDescription({
      problemDescription: [assignData.description ?? ""].filter(Boolean),
      requiredMethods: [],
      exampleCode: "",
      inputOutput: { input: "", output: "" },
      rubric: [],
      constraints: [],
    });
    setStudentName(sub.studentName ?? sub.studentEmail ?? `Submission #${sub.submissionId ?? sub.id}`);
    setStudentEmail(sub.studentEmail ?? null);
    setStudentId(sub.studentId != null ? String(sub.studentId) : null);
    setSubmittedAt(formatDate(sub.submittedAt ?? undefined));
    setSubGroupName(sub.subGroupName ?? null);
    setSubGroupMembers(
      (sub.subGroupMembers ?? []).map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        cwid: member.cwid,
      })),
    );
    setSubmissionLanguage(assignData.languageName ?? "Python");
    setSubmissionMarks(sub.marks ?? sub.grade ?? null);
    setSubmissionFeedback(sub.feedback ?? "");
    const files = sub.files ?? [];
    if (files.length > 0) {
      const filesWithContent = await Promise.all(
        files.map(async (f) => {
          const url = f.downloadUrl ?? (f as { url?: string }).url;
          const content = url ? await (await fetch(url)).text() : "";
          return { fileName: f.fileName ?? "file", content };
        })
      );
      setSubmissionFiles(filesWithContent);
      setSubmissionFileLinks(
        files.map((f) => {
          const url = f.downloadUrl ?? (f as { url?: string }).url ?? null;
          return { fileName: f.fileName ?? "file", downloadUrl: url };
        })
      );
    } else {
      setSubmissionFiles([]);
    }
  }, [classId, assignmentId, submissionId]);

  useEffect(() => {
    if (!assignmentId || !submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (isFaculty ? loadFacultyData() : isGA ? loadGAData() : Promise.resolve())
      .catch(() => setError("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [assignmentId, submissionId, isFaculty, isGA, loadFacultyData, loadGAData]);

  // Load latest test run for this submission (created on student submit or manual "Run tests").
  useEffect(() => {
    if (!resolvedSubmissionId) return;
    getRunTestsLatest(resolvedSubmissionId)
      .then((data) => data && setRunResult(data))
      .catch(() => setRunResult(null));
  }, [resolvedSubmissionId]);

  // Poll while queued/running so faculty/GA sees results as soon as the consumer finishes.
  useEffect(() => {
    if (!resolvedSubmissionId || !runResult || runResult.status === "COMPLETED" || runResult.status === "FAILED")
      return;
    const interval = setInterval(() => {
      getRunTestsLatest(resolvedSubmissionId)
        .then((data) => data && setRunResult(data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [resolvedSubmissionId, runResult?.status]);

  // Load latest grader report scores for this student so the compact rings update immediately.
  useEffect(() => {
    if (!assignmentId || !studentId) return;
    const aId = Number(assignmentId);
    if (!Number.isFinite(aId) || aId <= 0) return;

    let cancelled = false;
    const load = async () => {
      try {
        const latest = await getLatestGraderReportForStudent(aId, studentId);
        if (cancelled) return;
        if (!latest?.student) {
          setSimilarityScore(null);
          setAiRiskScore(null);
          return;
        }
        setSimilarityScore(
          typeof latest.student.similarity_score === "number" ? latest.student.similarity_score : null
        );
        const risk =
          typeof latest.student.ai_features?.risk_score === "number"
            ? latest.student.ai_features.risk_score
            : null;
        setAiRiskScore(risk);
      } catch {
        // Keep placeholders on errors.
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, studentId]);

  const scoreItems = useMemo(
    () => {
      const getSeverityColor = (pct: number) => {
        if (pct >= 85) return "#DC2626"; // red
        if (pct >= 60) return "#F59E0B"; // amber
        if (pct > 0) return "#16A34A"; // green
        return "#D1D5DB"; // gray
      };

      const plagiarismPct = similarityScore != null ? Math.round(similarityScore * 100) : 0;
      const aiPct = aiRiskScore != null ? Math.round(aiRiskScore * 100) : 0;

      return [
        {
          label: "Plagiarism",
          value: null as number | null,
          percent: plagiarismPct,
          color: getSeverityColor(plagiarismPct),
        },
        {
          label: "AI",
          value: null as number | null,
          percent: aiPct,
          color: getSeverityColor(aiPct),
        },
      ];
    },
    [similarityScore, aiRiskScore]
  );

  const saveAuthorshipTriage = useCallback(
    async (label: AuthorshipTriageLabel | null) => {
      if (!resolvedSubmissionId) return;
      setAuthorshipTriageSaving(true);
      setAuthorshipTriageError(null);
      try {
        const updated = await patchAuthorshipTriage(resolvedSubmissionId, {
          label,
          notes: authorshipTriageNotes.trim() || null,
        });
        setAuthorshipTriageLabel(updated.authorshipTriageLabel ?? null);
        setAuthorshipTriageNotes(updated.authorshipTriageNotes ?? "");
        setAuthorshipTriageLabeledAt(updated.authorshipTriageLabeledAt ?? null);
      } catch (e) {
        setAuthorshipTriageError(e instanceof Error ? e.message : "Failed to save triage.");
      } finally {
        setAuthorshipTriageSaving(false);
      }
    },
    [resolvedSubmissionId, authorshipTriageNotes],
  );

  const handleRunTests = useCallback(
    async (files?: File[], _customStdin?: string) => {
      const hasFiles = files != null && files.length > 0;
      if (hasFiles && assignmentId) {
        setRunLoading(true);
        setRunError(null);
        try {
          const result = await runTestsWithFiles(assignmentId, files);
          setRunResult(result);
          setActiveTab("tests");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Run tests failed.";
          setRunError(message);
          setRunResult(null);
        } finally {
          setRunLoading(false);
        }
        return;
      }
      if (!resolvedSubmissionId) return;
      setRunLoading(true);
      setRunError(null);
      try {
        await requestRunTests(resolvedSubmissionId);
        const job = await pollRunTestsUntilDone(resolvedSubmissionId);
        setRunResult(job);
        setActiveTab("tests");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Run tests failed.";
        setRunError(message);
        setRunResult(null);
      } finally {
        setRunLoading(false);
      }
    },
    [assignmentId, resolvedSubmissionId]
  );

  const handleOpenGradeClick = useCallback(async () => {
    if (submissionId) {
      try {
        if (isFaculty) {
          const grades = await getSubmissionGrades(submissionId);
          const bySubCriteriaId: Record<
            number,
            { awardedScore: number; feedback?: string | null }
          > = {};
          for (const g of grades) {
            bySubCriteriaId[g.rubricSubCriteriaId] = {
              awardedScore: g.awardedScore,
              feedback: g.feedback ?? null,
            };
          }
          setRubricExistingGrades(bySubCriteriaId);
        } else if (isGA) {
          const grades = await getGASubmissionGrades(submissionId);
          const bySubCriteriaId: Record<
            number,
            { awardedScore: number; feedback?: string | null }
          > = {};
          for (const g of grades) {
            bySubCriteriaId[g.rubricSubCriteriaId] = {
              awardedScore: g.awardedScore,
              feedback: g.feedback ?? null,
            };
          }
          setRubricExistingGrades(bySubCriteriaId);
        }
      } catch {
        setRubricExistingGrades({});
      }
    }
    setGradeDialogOpen(true);
  }, [submissionId, isFaculty, isGA]);

  const handleSaveGrade = useCallback(
    async (
      marks: number,
      feedback: string,
      rubricGrades?: Array<{ criterionId: number; score: number; comment: string }>,
    ) => {
      if (!submissionId) return;
      setGradeSubmitting(true);
      try {
        if (isFaculty) {
          if (rubricGrades && rubricGrades.length > 0) {
            const grades = rubricGrades.map((item) => ({
              rubricSubCriteriaId: item.criterionId,
              awardedScore: roundTo2(Math.max(0, item.score)),
              feedback: (item.comment?.trim() || undefined) ?? null,
            }));
            const request = { submissionId: Number(submissionId), grades };
            const hasExisting = Object.keys(rubricExistingGrades).length > 0;
            if (hasExisting) {
              await replaceSubmissionGrades(submissionId, request);
            } else {
              await createGradesBatch(request);
            }
          }

          await submitFacultySubmissionGrade({
            submissionId,
            marks,
            feedback,
          });
        } else if (isGA) {
          if (rubricGrades && rubricGrades.length > 0) {
            const grades = rubricGrades.map((item) => ({
              rubricSubCriteriaId: item.criterionId,
              awardedScore: roundTo2(Math.max(0, item.score)),
              feedback: (item.comment?.trim() || undefined) ?? null,
            }));
            const request = { submissionId: Number(submissionId), grades };
            const hasExisting = Object.keys(rubricExistingGrades).length > 0;
            if (hasExisting) {
              await replaceGASubmissionGrades(submissionId, request);
            } else {
              await createGASubmissionGradesBatch(request);
            }
          }

          await updateSubmissionGrade(Number(submissionId), { marks, feedback });
        } else {
          await updateSubmissionGrade(Number(submissionId), { marks, feedback });
        }
        setSubmissionMarks(marks);
        setSubmissionFeedback(feedback);
        setAssignment((prev) =>
          prev
            ? {
                ...prev,
                status: "graded",
                points: { ...prev.points, earned: marks },
              }
            : prev,
        );
      } finally {
        setGradeSubmitting(false);
      }
    },
    [submissionId, isFaculty, isGA, rubricExistingGrades],
  );

  const codeWorkspaceAssignment = useMemo(
    () =>
      assignment
        ? {
            language: assignment.language,
            hasStarterCode: assignment.hasStarterCode,
            submissionsUsed: assignment.submissionsUsed,
            submissionsAllowed: assignment.submissionsAllowed,
          }
        : null,
    [assignment]
  );

  const facultyEditorPreviewPayload = useMemo(() => {
    if (!submissionLanguage || !submissionFiles.length) return null;
    const first = submissionFiles[0];
    return {
      optionId: `${submissionId ?? ""}-${first.fileName}`,
      fileName: first.fileName,
      language: submissionLanguage,
      content: first.content,
      files: submissionFiles,
    };
  }, [submissionFiles, submissionLanguage, submissionId]);

  const handleDownloadSubmissionFiles = useCallback(async () => {
    if (!submissionFileLinks.length) return;
    try {
      const zip = new JSZip();
      for (const file of submissionFileLinks) {
        if (!file.downloadUrl) continue;
        const response = await fetch(file.downloadUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        zip.file(file.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      const safeStudentName = (studentName || "submission").replace(/[\\/:*?"<>|]/g, "_");
      a.href = url;
      a.download = `${safeStudentName}-files.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent failure; download is a convenience action and should not break grading flow.
    }
  }, [submissionFileLinks, studentName]);

  if (!isFaculty && !isGA) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-gray-600">
        Access denied.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#F5F2F2]">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-1 overflow-hidden gap-1 p-0">
          <div className="w-[35%] min-w-[320px] bg-white border-r border-gray-200 p-4 animate-pulse">
            <div className="h-7 w-52 rounded bg-gray-200 mb-4" />
            <div className="h-10 w-full rounded bg-gray-100 mb-4" />
            <div className="space-y-3">
              <div className="h-24 w-full rounded bg-gray-100" />
              <div className="h-24 w-full rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex-1 p-4 animate-pulse">
            <div className="h-full w-full rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2]">
        <div className="text-center">
          <p className="text-[14px] text-red-600">{error ?? "Submission not found."}</p>
          <Link to={backToAssignmentUrl} className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]">
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div
      className={
        isGA
          ? "flex flex-1 min-h-0 flex-col overflow-hidden bg-[#F5F2F2]"
          : "flex h-screen flex-col overflow-hidden bg-[#F5F2F2]"
      }
    >
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to={backToAssignmentUrl} className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            {backLabel}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B2A2A] font-medium">Submission</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel defaultSize={35} minSize={28} className="h-full">
            <div className="h-full overflow-y-auto overflow-x-hidden bg-white border-r border-gray-200">
              <div className="min-h-full flex flex-col">
                <div className="flex-shrink-0">
                  <AssignmentHeader assignment={assignment} />
                </div>

                {/* Student info - below assignment title */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-3 bg-gray-50/80">
                  <div className="flex items-center gap-2 text-[13px]">
                    <User className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    <span className="font-medium text-[#2B2A2A]">{studentName}</span>
                    {studentEmail && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{studentEmail}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-gray-500">
                    <span>Submitted: {submittedAt}</span>
                    {submissionFileLinks.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadSubmissionFiles}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-300 bg-white text-[11px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Download files</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-gray-500">
                    <div className="min-w-0">
                      {submissionFiles.length <= 1
                        ? `File: ${submissionFiles[0]?.fileName ?? "—"}`
                        : `Files: ${submissionFiles.length} files`}
                    </div>
                    <div className="flex-shrink-0" />
                  </div>

                  {/* Grade & feedback section */}
                  {isFaculty || isGA ? (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Grade & feedback</div>
                          <div className="mt-1 text-[13px] text-[#2B2A2A]">
                            <span className="font-medium">
                              {submissionMarks != null
                                ? `${submissionMarks} / ${assignment.points?.total ?? "—"}`
                                : "—"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <CircularScorePanel
                            items={scoreItems}
                            title={null}
                            ringSize={48}
                            strokeWidth={5}
                            compact
                            minimal
                          />
                          <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                            <div className="flex items-center gap-1">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: scoreItems[0]?.color ?? "#D1D5DB" }}
                              />
                              <span>Plagiarism</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: scoreItems[1]?.color ?? "#D1D5DB" }}
                              />
                              <span>AI</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenGradeClick}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B2A2A] hover:bg-[#3a3939] text-white text-[13px] font-medium"
                          >
                            <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                            Grade
                          </button>
                        </div>
                      </div>
                      {submissionFeedback != null && submissionFeedback.trim() !== "" ? (
                        <div className="mt-1.5 text-[12px] text-gray-600 line-clamp-3 break-words">
                          {submissionFeedback.trim()}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6">
                  <div className="flex gap-6">
                    {(
                      [
                        { id: "description" as const, label: "Description" },
                        { id: "tests" as const, label: "Tests" },
                        { id: "plagiarism" as const, label: "Plagiarism & AI" },
                        { id: "rubric" as const, label: "Grading Rubric" },
                        ...(isFaculty || isGA ? [{ id: "group" as const, label: "Group" }] : []),
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative py-3 text-[14px] font-medium transition-colors ${
                          activeTab === tab.id ? "text-[#2B2A2A]" : "text-gray-500 hover:text-[#2B2A2A]"
                        }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B2A2A]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content - grows with content, panel scrolls */}
                <div className="flex-1 min-h-0">
                  {activeTab === "description" && (
                    <DescriptionPanel
                      description={description}
                      starterCodeFiles={assignment?.starterCodeFiles}
                      starterCodeUrl={assignment?.starterCodeUrl ?? null}
                    />
                  )}
                  {activeTab === "tests" && (
                    <PublicTestsPanel
                      testCases={[]}
                      onRunTests={handleRunTests}
                      isRunning={runLoading}
                      runError={runError}
                      runResult={
                        runResult
                          ? {
                              passedCount: runResult.passedCount,
                              totalCount: runResult.totalCount,
                              results: runResult.results.map(
                                (r, i): PublicTestCase => ({
                                  id: r.testCaseId ?? i,
                                  name: r.testCaseTitle,
                                  passed: r.passed ?? undefined,
                                  input: "",
                                  inputFileName: null,
                                  expectedOutput: r.expectedOutput ?? "",
                                  actualOutput: r.actualOutput ?? r.errorMessage ?? "",
                                  executionTime: r.runtimeMs != null ? `${r.runtimeMs}ms` : undefined,
                                })
                              ),
                            }
                          : null
                      }
                      runStatus={runResult?.status ?? null}
                      showPublicNote={false}
                    />
                  )}
                  {activeTab === "plagiarism" && (
                    <>
                      {isFaculty && (
                        <div className="px-6 py-4 border-b border-amber-100/80 bg-amber-50/40">
                          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            Authorship triage
                          </h3>
                          <p className="text-[12px] text-gray-600 leading-relaxed mb-3">
                            Your label may be used to train models so we can improve future AI authorship predictions for
                            everyone. It&apos;s optional—leave blank or clear if this submission shouldn&apos;t be used
                            that way.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(
                              [
                                { key: "HUMAN_WRITTEN" as const, label: "Human-written" },
                                { key: "AI_ASSISTED" as const, label: "AI-assisted" },
                                { key: "UNCLEAR" as const, label: "Unclear" },
                              ] as const
                            ).map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                disabled={authorshipTriageSaving || !resolvedSubmissionId}
                                onClick={() => void saveAuthorshipTriage(key)}
                                className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                  authorshipTriageLabel === key
                                    ? "border-[#5A7ACD] bg-[#5A7ACD]/10 text-[#3d5a9e]"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={authorshipTriageSaving || !resolvedSubmissionId}
                              onClick={() => void saveAuthorshipTriage(null)}
                              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:border-gray-300"
                            >
                              Clear label
                            </button>
                          </div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Notes (optional)</label>
                          <textarea
                            value={authorshipTriageNotes}
                            onChange={(e) => setAuthorshipTriageNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-[#2B2A2A] mb-2"
                            placeholder="Internal notes only"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                authorshipTriageSaving || !resolvedSubmissionId || !authorshipTriageLabel
                              }
                              onClick={() =>
                                authorshipTriageLabel && void saveAuthorshipTriage(authorshipTriageLabel)
                              }
                              className="rounded-md bg-[#5A7ACD] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
                            >
                              {authorshipTriageSaving ? "Saving…" : "Save notes"}
                            </button>
                            <span className="text-[11px] text-gray-400">
                              Last saved: {formatDate(authorshipTriageLabeledAt ?? undefined)}
                            </span>
                          </div>
                          {authorshipTriageError ? (
                            <p className="mt-2 text-[12px] text-red-600">{authorshipTriageError}</p>
                          ) : null}
                        </div>
                      )}
                      <PlagiarismReportPanel
                        assignmentId={assignmentId ?? ""}
                        isFaculty={isFaculty}
                        studentId={studentId}
                      />
                    </>
                  )}
                  {activeTab === "rubric" && <GradingRubricPanel rubricCategories={rubricCategories} />}
                  {activeTab === "group" && (isFaculty || isGA) && (
                    <div className="px-6 py-5">
                      <div className="mb-4">
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Subgroup
                        </h3>
                        <p className="text-[14px] font-medium text-[#2B2A2A]">{subGroupName ?? "—"}</p>
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Members
                        </h3>
                        {subGroupMembers.length > 0 ? (
                          <div className="space-y-2">
                            {subGroupMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-[#2B2A2A]">{member.name}</p>
                                  <p className="truncate text-[12px] text-gray-500">{member.email}</p>
                                </div>
                                <span className="flex-shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
                                  {member.cwid}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-gray-600">No group assigned for this submission.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="hidden lg:block w-1 bg-gray-200 hover:bg-[#5A7ACD] transition-colors relative group">
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-12 bg-gray-300 group-hover:bg-[#5A7ACD] rounded-full flex items-center justify-center transition-colors">
                <GripVertical className="w-3 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </PanelResizeHandle>

          <Panel defaultSize={65} minSize={40} className="h-full">
            {codeWorkspaceAssignment && assignmentId ? (
              <CodeWorkspace
                assignmentId={assignmentId}
                assignment={codeWorkspaceAssignment}
                codeExamples={{}}
                onRunTests={handleRunTests}
                onSubmit={() => {}}
                showUploadControls={false}
                showFacultyGradeControls={false}
                facultyEditorPreviewPayload={facultyEditorPreviewPayload}
                runLoading={runLoading}
                runError={runError}
                runResult={runResult}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400 text-[14px]">
                Loading…
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      <GradeSubmissionDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        hasRubric={rubricCategories.length > 0}
        rubricCategories={rubricCategories}
        rubricNested={rubricNested ?? undefined}
        rubricExistingGrades={rubricExistingGrades}
        maxPoints={assignment.points?.total ?? 100}
        currentMarks={submissionMarks}
        currentFeedback={submissionFeedback}
        onSubmit={handleSaveGrade}
        isSubmitting={gradeSubmitting}
      />
    </div>
  );

  if (isGA) {
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
    const goToSettingsSection = (section: SettingsSection) => {
      navigate(`/settings?section=${section}`);
    };
    const handleLogout = () => {
      clearAuthenticated();
      navigate("/signin", { replace: true });
    };
    return (
      <div className="flex h-screen w-full flex-col bg-[#F5F2F2]">
          <AuthTopBar
            roleView="gradingAssistant"
            profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          showSearch={false}
            onSettingsSectionSelect={goToSettingsSection}
            onLogout={handleLogout}
          />
        {mainContent}
      </div>
    );
  }

  return mainContent;
}
