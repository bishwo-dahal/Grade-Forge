import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  getAllGradingAssistants,
  createGradingAssistant,
  updateGradingAssistant,
  deleteGradingAssistant,
} from "../../../../services/gradingAssistantService";
import type {
  GradingAssistantResponse,
  GradingAssistantRequest,
} from "../../../../types/gradingAssistant";
import { clearAuthenticated, getAuthenticatedUser } from "../../../auth";
import { AuthShell } from "../../layout/AuthShell";
import { AuthTopBar } from "../../layout/AuthTopBar";
import type { SettingsSection } from "../../layout/AuthTopBar";
import { AlertCircle, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { getApiErrorMessage } from "../../../../utils/apiErrorMessage";
import { TimedSuccessModal } from "../../ui/ActionFeedbackModal";

function getErrorMessage(err: unknown, fallback: string): string {
  const friendly = getApiErrorMessage(err, fallback);
  if (/foreign key|course_assistants|still referenced/i.test(friendly)) {
    return "This assistant is still assigned to one or more courses. Remove them from those courses first, then try again.";
  }
  return friendly;
}

const emptyForm: GradingAssistantRequest = {
  name: "",
  email: "",
  password: "",
  officeHours: "",
  department: "",
};

function GradingAssistantFormModal({
  assistant,
  onClose,
  onSuccess,
  onSuccessMessage,
}: {
  assistant: GradingAssistantResponse | null;
  onClose: () => void;
  onSuccess: () => void;
  onSuccessMessage: (message: string) => void;
}) {
  const isEdit = !!assistant;
  const [form, setForm] = useState<GradingAssistantRequest>(() =>
    assistant
      ? {
          name: assistant.name,
          email: assistant.email,
          password: "",
          officeHours: assistant.officeHours ?? "",
          department: assistant.department ?? "",
        }
      : { ...emptyForm }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim() || !form.email?.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!isEdit && !form.password?.trim()) {
      setError("Password is required when creating a new assistant.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: GradingAssistantRequest = {
        name: form.name.trim(),
        email: form.email.trim(),
        officeHours: form.officeHours?.trim() || undefined,
        department: form.department?.trim() || undefined,
      };
      if (form.password?.trim()) payload.password = form.password.trim();
      if (isEdit && assistant) {
        await updateGradingAssistant(assistant.id, payload);
        onSuccessMessage("Grading assistant updated successfully.");
      } else {
        await createGradingAssistant(payload);
        onSuccessMessage("Grading assistant created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Something went wrong."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#2B2A2A]">
            {isEdit ? "Edit Grading Assistant" : "Add Grading Assistant"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#2B2A2A]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="ga-name"
              className="mb-1 block text-[13px] font-medium text-[#1F2430]"
            >
              Name
            </label>
            <input
              id="ga-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>
          <div>
            <label
              htmlFor="ga-email"
              className="mb-1 block text-[13px] font-medium text-[#1F2430]"
            >
              Email
            </label>
            <input
              id="ga-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder="jane@university.edu"
              required
              readOnly={isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-[11px] text-gray-500">
                Email cannot be changed after creation.
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="ga-password"
              className="mb-1 block text-[13px] font-medium text-[#1F2430]"
            >
              Password {isEdit && "(leave blank to keep current)"}
            </label>
            <input
              id="ga-password"
              type="password"
              value={form.password ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder={isEdit ? "••••••••" : "Minimum 8 characters"}
              required={!isEdit}
              minLength={isEdit ? 0 : 8}
            />
          </div>
          <div>
            <label
              htmlFor="ga-officeHours"
              className="mb-1 block text-[13px] font-medium text-[#1F2430]"
            >
              Office Hours
            </label>
            <input
              id="ga-officeHours"
              type="text"
              value={form.officeHours ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, officeHours: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder="e.g. Mon 2-4pm, Wed 10-12"
            />
          </div>
          <div>
            <label
              htmlFor="ga-department"
              className="mb-1 block text-[13px] font-medium text-[#1F2430]"
            >
              Department
            </label>
            <input
              id="ga-department"
              type="text"
              value={form.department ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder="e.g. Computer Science"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#5A7ACD] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60"
            >
              {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FacultyGradingAssistantsPage() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const displayName = user?.name ?? "Faculty";
  const displayEmail = user?.email ?? "";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "F";

  const [assistants, setAssistants] = useState<GradingAssistantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAssistant, setModalAssistant] = useState<GradingAssistantResponse | null | "create">(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);

  const loadAssistants = useCallback(() => {
    setLoading(true);
    setError(null);
    getAllGradingAssistants()
      .then(setAssistants)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load grading assistants."));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleRemoveClick = (assistant: GradingAssistantResponse) => {
    setDeleteConfirm({ id: assistant.id, name: assistant.name });
  };

  const handleDeleteCancel = () => {
    if (!deleting) setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteGradingAssistant(deleteConfirm.id);
      setAssistants((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      const msg = getErrorMessage(err, "Failed to remove grading assistant.");
      setDeleteConfirm(null);
      setErrorDialog(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AuthShell
      roleView="faculty"
      topBar={
        <AuthTopBar
          roleView="faculty"
          profile={{
            name: displayName,
            email: displayEmail,
            initials: displayInitials,
          }}
          showSearch={false}
          pageTitle="Grading Assistants"
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
          <div className="2xl:max-w-7xl 2xl:mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[15px] text-gray-600">
                Create and manage grading assistants who can help grade submissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-[#3E4E67]">
                <span className="h-2 w-2 rounded-full bg-[#5A7ACD]" />
                <span className="font-medium">{assistants.length}</span>
                <span className="text-[#7C879A]">assistants</span>
              </div>
              <button
                type="button"
                onClick={() => setModalAssistant("create")}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#5A7ACD] px-5 text-[14px] leading-none font-semibold text-white hover:bg-[#4a6abd]"
              >
                <UserPlus className="h-4 w-4" strokeWidth={2} />
                Add Assistant
              </button>
            </div>
          </div>

          {loading && (
            <p className="text-[13px] text-gray-600">Loading grading assistants…</p>
          )}
          {error && !loading && (
            <p className="text-[13px] text-red-600">{error}</p>
          )}
          {!loading && !error && assistants.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
              <p className="text-[13px] text-gray-600">
                You don&apos;t have any grading assistants yet. Add one to delegate grading tasks.
              </p>
              <button
                type="button"
                onClick={() => setModalAssistant("create")}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#5A7ACD] px-6 text-[13px] font-semibold text-white hover:bg-[#4a6abd]"
              >
                <UserPlus className="h-4 w-4" strokeWidth={2} />
                Add Grading Assistant
              </button>
            </div>
          )}
          {!loading && !error && assistants.length > 0 && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:border-[#5A7ACD]/60 hover:shadow-sm transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-medium text-[#2B2A2A]">
                        {assistant.name}
                      </div>
                      <div className="mt-0.5 text-[12px] text-gray-600">
                        {assistant.email}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#7C879A]">
                        {assistant.department && (
                          <span>{assistant.department}</span>
                        )}
                        {assistant.officeHours && (
                          <span>Office: {assistant.officeHours}</span>
                        )}
                        {assistant.role && (
                          <span className="capitalize">{assistant.role.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalAssistant(assistant)}
                        className="inline-flex h-8 items-center gap-1 rounded-2xl bg-[#5A7ACD] px-3 text-[12px] font-semibold text-white hover:bg-[#4a6abd]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveClick(assistant)}
                        className="inline-flex h-8 items-center gap-1 rounded-2xl border border-red-200 bg-red-50 px-3 text-[12px] font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {modalAssistant !== null && (
            <GradingAssistantFormModal
              assistant={modalAssistant === "create" ? null : modalAssistant}
              onClose={() => setModalAssistant(null)}
              onSuccess={loadAssistants}
              onSuccessMessage={setSuccessModalMessage}
            />
          )}

          {deleteConfirm !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
                <h3 className="text-[16px] font-semibold text-[#2B2A2A]">
                  Remove grading assistant?
                </h3>
                <p className="mt-2 text-[14px] text-gray-600">
                  <span className="font-medium text-[#2B2A2A]">{deleteConfirm.name}</span> will lose access to the system. This action cannot be undone.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorDialog !== null && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold text-[#2B2A2A]">
                      Could not remove assistant
                    </h3>
                    <p className="mt-2 text-[14px] text-gray-600 whitespace-pre-wrap">
                      {errorDialog}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setErrorDialog(null)}
                    className="rounded-xl bg-[#5A7ACD] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd]"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          <TimedSuccessModal
            open={successModalMessage !== null}
            title="Success"
            description={successModalMessage ?? ""}
            onClose={() => setSuccessModalMessage(null)}
          />
          </div>
        </main>
      }
    />
  );
}
