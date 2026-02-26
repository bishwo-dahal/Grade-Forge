import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getRubric, updateRubric } from "../../../../services/rubricService";
import type { Rubric, RubricCreatePayload } from "../../../../types/rubric";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";
import { RubricForm } from "./RubricForm";

export function FacultyRubricDetailPage() {
  const navigate = useNavigate();
  const { rubricId } = useParams();
  const resolvedId = rubricId ?? "";

  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials = useMemo(() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "SM"
    );
  }, [displayName]);

  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedId) {
      navigate("/faculty/rubrics", { replace: true });
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    getRubric(resolvedId)
      .then((data) => {
        if (!cancelled) {
          setRubric(data);
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          const message =
            error?.response?.data?.message ??
            error?.message ??
            "Unable to load rubric details right now.";
          setErrorMessage(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedId, navigate]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleSubmit = async (payload: RubricCreatePayload) => {
    if (!resolvedId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await updateRubric(resolvedId, payload);
      navigate("/faculty/rubrics");
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Unable to save rubric right now.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/faculty/rubrics");
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
        isLoading || !rubric ? (
          <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-7">
            <div className="mx-auto w-full max-w-[960px]">
              <div className="h-7 w-40 rounded-xl bg-gray-200" />
              <div className="mt-3 h-4 w-64 rounded-xl bg-gray-200" />
              <div className="mt-8 space-y-4">
                <div className="h-10 w-full rounded-xl bg-gray-200" />
                <div className="h-20 w-full rounded-xl bg-gray-200" />
                <div className="h-40 w-full rounded-3xl bg-gray-200" />
              </div>
            </div>
          </main>
        ) : (
          <RubricForm
            mode="edit"
            initialRubric={rubric}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )
      }
    />
  );
}

