import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { listMyRubrics, deleteRubric } from "../../../../services/rubricService";
import type { RubricSummary } from "../../../../types/rubric";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { roundTo2 } from "../../../../utils/number";
import { getApiErrorMessage } from "../../../../utils/apiErrorMessage";
import { DeleteReasonDialog } from "../../ui/DeleteReasonDialog";

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
  onToggleExpand,
  onEditRubric,
  onDeleteRubric,
  onDuplicateRubric,
}: FacultyRubricsViewProps & {
  onNewRubric: () => void;
  onToggleExpand: (id: number) => void;
  onEditRubric: (id: number) => void;
  onDeleteRubric: (rubric: RubricSummary) => void;
  onDuplicateRubric: (rubric: RubricSummary) => void;
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
      <div className="2xl:max-w-7xl 2xl:mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[15px] text-gray-600">
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
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {rubrics.map((rubric) => {
              const isExpanded = expandedId === rubric.id;
              return (
                <div
                  key={rubric.id}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:border-[#5A7ACD]/60 hover:shadow-sm transition-colors cursor-pointer"
                  onClick={() => onToggleExpand(rubric.id)}
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
                          onEditRubric(rubric.id);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-2xl bg-[#5A7ACD] px-3 text-[12px] font-semibold text-white hover:bg-[#4a6abd]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDuplicateRubric(rubric);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-[#2B2A2A] hover:bg-[#EEF2FB]"
                      >
                        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Duplicate</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRubric(rubric);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-2xl border border-red-200 bg-red-50 px-3 text-[12px] font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && rubric.criteria.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#8D97AC]">
                        Criteria
                      </p>
                      <ul className="space-y-2">
                        {rubric.criteria.map((criterion, index) => {
                          const isLast = index === rubric.criteria.length - 1;
                          return (
                            <li
                              key={criterion.id ?? `${criterion.title}-${criterion.maxScore}-${index}`}
                              className="flex items-start gap-3"
                            >
                              <div className="flex flex-col items-center pt-1">
                                <div className="h-2 w-2 rounded-full bg-[#5A7ACD]" />
                                {!isLast && (
                                  <div className="mt-1 h-full w-px bg-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 flex items-start gap-2">
                                <div className="mt-2 h-px w-4 bg-gray-300" />
                                <div className="flex-1 flex items-start justify-between gap-3">
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
                                      <div className="mt-0.5">weight {roundTo2(criterion.weight)}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<RubricSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load rubrics."));
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

  const handleToggleExpand = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleEditRubric = (id: number) => {
    navigate(`/faculty/rubrics/${id}`);
  };

  const handleDeleteRubricRequest = (rubric: RubricSummary) => {
    setRubricToDelete(rubric);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRubric = async () => {
    if (!rubricToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRubric(rubricToDelete.id);
      setRubrics((prev) => prev.filter((r) => r.id !== rubricToDelete.id));
      toast.success("Rubric deleted successfully.");
      setIsDeleteDialogOpen(false);
      setRubricToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to delete rubric.");
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateRubric = (rubric: RubricSummary) => {
    navigate("/faculty/rubrics/new", { state: { fromRubric: rubric } });
  };

  return (
    <>
      <AuthShell
        roleView="faculty"
        topBar={
          <AuthTopBar
            roleView="faculty"
            profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
            showSearch={false}
            pageTitle="Rubrics"
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
            onToggleExpand={handleToggleExpand}
            onEditRubric={handleEditRubric}
            onDeleteRubric={handleDeleteRubricRequest}
            onDuplicateRubric={handleDuplicateRubric}
          />
        }
      />
      <DeleteReasonDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete rubric"
        description={
          rubricToDelete
            ? `Delete "${rubricToDelete.name}"? This action cannot be undone.`
            : "Delete this rubric? This action cannot be undone."
        }
        onConfirm={handleDeleteRubric}
        isSubmitting={isDeleting}
      />
    </>
  );
}

