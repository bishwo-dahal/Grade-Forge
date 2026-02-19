import { useEffect, useMemo, useState } from "react";
import { Code2, Plus, Search, Trash2, X } from "lucide-react";
import {
  createSupportedLanguage,
  listSupportedLanguages,
  removeSupportedLanguage,
} from "../../services/universityAdminService";
import type { LanguageCreatePayload, SupportedLanguage } from "../../types/universityAdmin";

const DEFAULT_LANGUAGE_FORM: LanguageCreatePayload = {
  name: "",
  dockerImage: "",
  executionCode: "",
  isActive: true,
};

interface UniversityLanguagesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  languages: SupportedLanguage[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onRemoveLanguage: (languageId: number) => void;
}

function UniversityLanguagesView({
  languages,
  isLoading,
  error,
  searchTerm,
  onSearchTermChange,
  onOpenCreateModal,
  onRemoveLanguage,
}: UniversityLanguagesViewProps) {
  const filteredLanguages = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return languages;
    }
    return languages.filter((language) => {
      return (
        language.name.toLowerCase().includes(normalizedSearch) ||
        language.dockerImage.toLowerCase().includes(normalizedSearch) ||
        language.executionCode.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [languages, searchTerm]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Programming Languages</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">Create and manage supported assignment languages</p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2B2A2A] px-4 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add Language
        </button>
      </section>

      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B5]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search languages by name, docker image, or execution command..."
            className="w-full rounded-2xl border border-[#CFD2D9] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
          />
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Language</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Docker Image</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Execution Command</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={5}>
                    Loading languages...
                  </td>
                </tr>
              )}

              {!isLoading && filteredLanguages.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={5}>
                    No languages found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredLanguages.map((language, index) => (
                  <tr key={language.id} className={index < filteredLanguages.length - 1 ? "border-b border-gray-100" : ""}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#5A7ACD]">
                          <Code2 className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <p className="text-[15px] font-semibold text-[#1F2430]">{language.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#2D3B53]">{language.dockerImage || "-"}</td>
                    <td className="px-6 py-4 text-[14px] text-[#2D3B53]">{language.executionCode || "-"}</td>
                    <td className="px-6 py-4 text-[14px]">
                      <span
                        className={
                          language.isActive
                            ? "inline-flex rounded-full bg-[#E5F6EA] px-2.5 py-1 text-[12px] font-medium text-[#0D9A4B]"
                            : "inline-flex rounded-full bg-[#EDF0F4] px-2.5 py-1 text-[12px] font-medium text-[#6F7B8D]"
                        }
                      >
                        {language.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => onRemoveLanguage(language.id)}
                          aria-label={`Remove ${language.name}`}
                          className="text-[#E0474C] hover:text-[#CB2F34]"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export function UniversityLanguagesPage() {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [languageForm, setLanguageForm] = useState<LanguageCreatePayload>(DEFAULT_LANGUAGE_FORM);
  const [languageFormError, setLanguageFormError] = useState<string | null>(null);

  const getErrorMessage = (unknownError: unknown, fallback: string): string => {
    if (typeof unknownError === "object" && unknownError !== null) {
      const response = (unknownError as { response?: { data?: { message?: unknown } } }).response;
      const message = response?.data?.message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
    return fallback;
  };

  const loadLanguages = () => {
    setIsLoading(true);
    setError(null);
    listSupportedLanguages()
      .then(setLanguages)
      .catch((loadError) => setError(getErrorMessage(loadError, "Could not load languages.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // NOTE: Container-level data loading keeps the language table view presentation-only for easier backend handoff.
    loadLanguages();
  }, []);

  const handleOpenCreateModal = () => {
    setLanguageForm(DEFAULT_LANGUAGE_FORM);
    setLanguageFormError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setLanguageFormError(null);
  };

  const handleCreateLanguage = async () => {
    if (!languageForm.name.trim()) {
      setLanguageFormError("Language name is required.");
      return;
    }

    setIsSavingLanguage(true);
    setLanguageFormError(null);

    try {
      // NOTE: Popup payload now matches backend ProgrammingLanguageRequest fields for direct API integration.
      await createSupportedLanguage({
        name: languageForm.name.trim(),
        dockerImage: languageForm.dockerImage.trim(),
        executionCode: languageForm.executionCode.trim(),
        isActive: languageForm.isActive,
      });
      handleCloseCreateModal();
      loadLanguages();
    } catch (creationError) {
      setLanguageFormError(getErrorMessage(creationError, "Could not create language."));
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleRemoveLanguage = async (languageId: number) => {
    // NOTE: Language row delete is backend-connected so university admin actions persist in the database.
    await removeSupportedLanguage(languageId);
    loadLanguages();
  };

  return (
    <>
      <UniversityLanguagesView
        languages={languages}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onOpenCreateModal={handleOpenCreateModal}
        onRemoveLanguage={handleRemoveLanguage}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-[22px] font-semibold text-[#1F2430]">Add Programming Language</h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                aria-label="Close Add Programming Language dialog"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {languageFormError && <p className="text-[13px] text-[#C23A42]">{languageFormError}</p>}
              <div>
                <label htmlFor="language-name-create" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Language Name
                </label>
                <input
                  id="language-name-create"
                  type="text"
                  value={languageForm.name}
                  onChange={(event) => setLanguageForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g., Kotlin"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>
              <div>
                <label htmlFor="language-docker-image-create" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Docker Image
                </label>
                <input
                  id="language-docker-image-create"
                  type="text"
                  value={languageForm.dockerImage}
                  onChange={(event) => setLanguageForm((prev) => ({ ...prev, dockerImage: event.target.value }))}
                  placeholder="e.g., python:3.11"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>
              <div>
                <label htmlFor="language-execution-code-create" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Execution Command
                </label>
                <input
                  id="language-execution-code-create"
                  type="text"
                  value={languageForm.executionCode}
                  onChange={(event) => setLanguageForm((prev) => ({ ...prev, executionCode: event.target.value }))}
                  placeholder="e.g., python Main.py"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] text-[#2D3B53]">
                <input
                  type="checkbox"
                  checked={languageForm.isActive}
                  onChange={(event) => setLanguageForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                />
                Active language
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A]"
                disabled={isSavingLanguage}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLanguage}
                className="rounded-xl bg-[#2B2A2A] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                disabled={isSavingLanguage}
              >
                {isSavingLanguage ? "Saving..." : "Add Language"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
