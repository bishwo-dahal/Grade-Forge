import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRubric } from "../../../../services/rubricService";
import type { Rubric, RubricCreatePayload, RubricSummary } from "../../../../types/rubric";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";
import { RubricForm } from "./RubricForm";
import { getApiErrorMessage } from "../../../../utils/apiErrorMessage";
import { toast } from "sonner";

export function FacultyRubricCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromRubric = (location.state as { fromRubric?: RubricSummary } | null)?.fromRubric;
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialRubric: Rubric | null = useMemo(() => {
    if (!fromRubric) return null;
    return {
      id: 0,
      name: `${fromRubric.name} (copy)`,
      description: fromRubric.description,
      facultyId: null,
      criteria: fromRubric.criteria,
    };
  }, [fromRubric]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleSubmit = async (payload: RubricCreatePayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await createRubric(payload);
      toast.success("Rubric created successfully.");
      navigate("/faculty/rubrics");
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Unable to save rubric right now.");
      setErrorMessage(message);
      toast.error(message);
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
        <RubricForm
          mode="create"
          initialRubric={initialRubric}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      }
    />
  );
}

