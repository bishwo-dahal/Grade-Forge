import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import {
  downloadAuthorshipModelArtifact,
  listAuthorshipTriageTrainingRows,
} from "../../services/universityAdminService";
import type { AuthorshipTriageTrainingRow } from "../../types/universityAdmin";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

const labelOptions = ["ALL", "AI_ASSISTED", "HUMAN_WRITTEN", "UNCLEAR"] as const;
type LabelFilter = (typeof labelOptions)[number];

function formatLabeledAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function labelDisplay(label: string): string {
  switch (label) {
    case "AI_ASSISTED":
      return "AI-assisted";
    case "HUMAN_WRITTEN":
      return "Human-written";
    case "UNCLEAR":
      return "Unclear";
    default:
      return label;
  }
}

function labelBadgeClass(label: string): string {
  if (label === "AI_ASSISTED") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (label === "HUMAN_WRITTEN") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  if (label === "UNCLEAR") return "bg-slate-50 text-slate-800 ring-slate-200";
  return "bg-gray-50 text-gray-800 ring-gray-200";
}

export function UniversityTrainingDataPage() {
  const [rows, setRows] = useState<AuthorshipTriageTrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelFilter>("ALL");
  const [modelDownloading, setModelDownloading] = useState(false);
  const [modelDownloadError, setModelDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAuthorshipTriageTrainingRows();
      setRows(data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load training labels."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      if (labelFilter !== "ALL" && r.label !== labelFilter) return false;
      if (!q) return true;
      const hay = [
        r.courseName,
        r.courseCode,
        r.assignmentName,
        r.facultyName,
        r.facultyEmail,
        r.studentName,
        String(r.submissionId),
        r.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchTerm, labelFilter]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">ML training data</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#5D6A80]">
            Instructor labels (AI-assisted, human-written, unclear) from authorship triage—these feed our own model
            training so authorship predictions get better over time. Only metadata appears here (no student source code).
            Use <span className="font-medium text-[#44506B]">Download current model</span> to fetch the deployed
            authorship model file when the server has one configured.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CFD2D9] bg-white px-4 text-[14px] font-semibold text-[#2B2A2A] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setModelDownloadError(null);
              setModelDownloading(true);
              void downloadAuthorshipModelArtifact()
                .catch((e) => setModelDownloadError(getApiErrorMessage(e, "Could not download model.")))
                .finally(() => setModelDownloading(false));
            }}
            disabled={modelDownloading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2B2A2A] px-4 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${modelDownloading ? "animate-pulse" : ""}`} strokeWidth={2} />
            {modelDownloading ? "Downloading…" : "Download current model"}
          </button>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B5]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search course, assignment, instructor, student, submission id, notes…"
            className="w-full rounded-2xl border border-[#CFD2D9] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {labelOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setLabelFilter(opt)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                labelFilter === opt
                  ? "bg-[#5A7ACD] text-white"
                  : "bg-white text-[#44506B] ring-1 ring-[#CFD2D9] hover:bg-gray-50"
              }`}
            >
              {opt === "ALL" ? "All labels" : labelDisplay(opt)}
            </button>
          ))}
        </div>
      </section>

      <p className="mt-3 text-[13px] text-[#5D6A80]">
        Showing <span className="font-semibold text-[#2B2A2A]">{filtered.length}</span> of{" "}
        <span className="font-semibold text-[#2B2A2A]">{rows.length}</span> labeled rows
      </p>

      {error ? <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p> : null}
      {modelDownloadError ? <p className="mt-2 text-[14px] text-[#C23A42]">{modelDownloadError}</p> : null}

      <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Labeled
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Label
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Assignment
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Instructor
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Submission
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#345079]">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#5D6A80]">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#5D6A80]">
                    No triage labels yet. Instructors save labels from the Plagiarism and AI tab while grading.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r.submissionId}-${r.facultyId}`} className="border-b border-gray-100 last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#2B2A2A]">{formatLabeledAt(r.labeledAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${labelBadgeClass(r.label)}`}
                      >
                        {labelDisplay(r.label)}
                      </span>
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-[13px] text-[#2B2A2A]">
                      <div className="truncate font-medium" title={`${r.courseCode} ${r.courseName}`}>
                        {r.courseCode ? `${r.courseCode} · ` : ""}
                        {r.courseName}
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[13px] text-[#2B2A2A]" title={r.assignmentName}>
                      {r.assignmentName}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-[13px]">
                      <div className="truncate font-medium text-[#2B2A2A]" title={r.facultyName}>
                        {r.facultyName}
                      </div>
                      <div className="truncate text-[12px] text-[#5D6A80]" title={r.facultyEmail}>
                        {r.facultyEmail}
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-[13px] text-[#2B2A2A]" title={r.studentName}>
                      {r.studentName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[#44506B]">{r.submissionId}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[12px] text-[#5D6A80]" title={r.notes ?? ""}>
                      {r.notes?.trim() ? r.notes : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
