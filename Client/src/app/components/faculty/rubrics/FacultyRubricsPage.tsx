import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listMyRubrics } from "../../../../services/rubricService";
import type { RubricSummary } from "../../../../types/rubric";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";

interface FacultyRubricsViewProps {
  rubrics: RubricSummary[];
  loading: boolean;
  error: string | null;
}

function FacultyRubricsView({ rubrics, loading, error }: FacultyRubricsViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#2B2A2A]">Rubrics</h1>
          <p className="text-[13px] text-gray-600">Manage grading rubrics for your assignments.</p>
        </div>
      </div>

      <div className="mt-2">
        {loading && <p className="text-[13px] text-gray-600">Loading rubrics…</p>}
        {error && !loading && (
          <p className="text-[13px] text-red-600">
            {error}
          </p>
        )}
        {!loading && !error && rubrics.length === 0 && (
          <p className="text-[13px] text-gray-600">
            You don&apos;t have any rubrics yet. You can create one from here once the creation flow is implemented.
          </p>
        )}
        {!loading && !error && rubrics.length > 0 && (
          <ul className="space-y-3">
            {rubrics.map((rubric) => (
              <li
                key={rubric.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#2B2A2A]">{rubric.name}</div>
                  {rubric.description && (
                    <div className="text-[12px] text-gray-600 line-clamp-2 mt-0.5">{rubric.description}</div>
                  )}
                </div>
                <div className="text-right text-[12px] text-gray-600">
                  <div>{rubric.criteriaCount} criteria</div>
                  <div className="mt-0.5">{rubric.totalMaxScore} pts total</div>
                </div>
              </li>
            ))}
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
      mainContent={<FacultyRubricsView rubrics={rubrics} loading={loading} error={error} />}
    />
  );
}

