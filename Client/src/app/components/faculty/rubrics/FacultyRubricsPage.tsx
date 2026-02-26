import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { listMyRubrics, deleteRubric } from "../../../../services/rubricService";
import type { RubricSummary } from "../../../../types/rubric";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";
import { Pencil, Trash2 } from "lucide-react";

interface FacultyRubricsViewProps {
  rubrics: RubricSummary[];
  loading: boolean;
  error: string | null;
  totalRubrics: number;
  expandedId: number | null;
}

function FacultyRubricsView({
  rubrics,
  loading,
  error,
  totalRubrics,
  expandedId,
  onNewRubric,
  onViewRubric,
  onDeleteRubric,
}: FacultyRubricsViewProps & {
  onNewRubric: () => void;
  onViewRubric: (id: number) => void;
  onDeleteRubric: (id: number) => void;
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#2B2A2A]">Rubrics</h1>
          <p className="text-[13px] text-gray-600">
            Manage reusable grading rubrics for your assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-[#3E4E67]">
            <span className="h-2 w-2 rounded-full bg-[#5A7ACD]" />
            <span className="font-medium">{totalRubrics}</span>
            <span className="text-[#7C879A]">rubrics</span>
          </div>
          <button
            type="button"
            onClick={onNewRubric}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#5A7ACD] px-5 text-[14px] leading-none font-semibold text-white"
          >
            New Rubric
          </button>
        </div>
      </div>

      <div className="mt-1">
        {loading && <p className="text-[13px] text-gray-600">Loading rubrics…</p>}
        {error && !loading && (
          <p className="text-[13px] text-red-600">
            {error}
          </p>
        )}
        {!loading && !error && rubrics.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
            <p className="text-[13px] text-gray-600">
              You don&apos;t have any rubrics yet. Create one to reuse grading criteria across assignments.
            </p>
            <button
              type="button"
              onClick={onNewRubric}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#5A7ACD] px-6 text-[13px] font-semibold text-white"
            >
              New Rubric
            </button>
          </div>
        )}
        {!loading && !error && rubrics.length > 0 && (
          <ul className="space-y-3">
            {rubrics.map((rubric) => {
              const isExpanded = expandedId === rubric.id;
              return (
                <li
                  key={rubric.id}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:border-[#5A7ACD]/60 hover:shadow-sm transition-colors cursor-pointer"
                  onClick={() => onViewRubric(rubric.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-medium text-[#2B2A2A]">{rubric.name}</div>
                      <div className="mt-0.5 text-[12px] text-gray-600 line-clamp-2">
                        {rubric.description || "No description provided."}
                      </div>
                      <div className="mt-1 text-[11px] text-[#7C879A]">
                        {rubric.criteriaCount} criteria • {rubric.totalMaxScore} total points
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewRubric(rubric.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5A7ACD] text-white hover:bg-[#4a6abd]"
                        aria-label="Edit rubric"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRubric(rubric.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        aria-label="Delete rubric"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && rubric.criteria.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-[#F9FAFB] px-3 py-3">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#8D97AC]">
                        Criteria
                      </p>
                      <ul className="space-y-2">
                        {rubric.criteria.map((criterion) => (
                          <li
                            key={criterion.id ?? `${criterion.title}-${criterion.maxScore}`}
                            className="flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="text-[13px] font-medium text-[#1F2430]">
                                {criterion.title}
                              </div>
                              {criterion.description && (
                                <div className="text-[12px] text-[#6D7B91]">
                                  {criterion.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-[11px] text-[#6D7B91]">
                              <div>{criterion.maxScore} pts</div>
                              {criterion.weight != null && (
                                <div className="mt-0.5">weight {criterion.weight}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

export function FacultyRubricsPage() {
  const navigate = useNavigate();
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SM";

  const [rubrics, setRubrics] = useState<RubricSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalRubrics = useMemo(() => rubrics.length, [rubrics]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMyRubrics()
      .then((data) => {
        if (!cancelled) {
          setRubrics(data);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const message = err?.response?.data?.message ?? err?.message ?? "Failed to load rubrics.";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleNewRubric = () => {
    // TODO: Implement rubric create flow (inline or dedicated route).
    // For now, navigate to a placeholder route so the button is wired.
    navigate("/faculty/rubrics/new");
  };

  const handleViewRubric = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleDeleteRubric = async (id: number) => {
    const confirm = window.confirm("Delete this rubric? This action cannot be undone.");
    if (!confirm) return;
    try {
      await deleteRubric(id);
      setRubrics((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to delete rubric.";
      setError(message);
    }
  };

  return (
    <AuthShell
      roleView="faculty"
      topBar={
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <FacultyRubricsView
          rubrics={rubrics}
          loading={loading}
          error={error}
          totalRubrics={totalRubrics}
          expandedId={expandedId}
          onNewRubric={handleNewRubric}
          onViewRubric={handleViewRubric}
          onDeleteRubric={handleDeleteRubric}
        />
      }
    />
  );
}

