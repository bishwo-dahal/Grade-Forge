import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { FacultyCreatePayload, FacultyMember } from "../../types/universityAdmin";
import { createFaculty, deleteFacultyById, listDepartmentOptions, listFacultyMembers } from "../../services/universityAdminService";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import { toast } from "sonner";
import { DeleteReasonDialog } from "./ui/DeleteReasonDialog";

const DEFAULT_FACULTY_FORM: FacultyCreatePayload = {
  name: "",
  email: "",
  department: "",
  qualifications: "",
  phoneNumber: "",
  officeLocation: "",
  password: "",
};

interface UniversityFacultyViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  members: FacultyMember[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onDeleteFaculty: (faculty: FacultyMember) => void;
  deletingFacultyId: number | null;
}

function UniversityFacultyView({
  members,
  isLoading,
  error,
  searchTerm,
  onSearchTermChange,
  onOpenCreateModal,
  onDeleteFaculty,
  deletingFacultyId,
}: UniversityFacultyViewProps) {
  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return members;
    }
    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        member.department.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [members, searchTerm]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* FIX: Reduced section heading size so university pages match the natural typography used elsewhere. */}
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Faculty Management</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">Manage faculty accounts and permissions</p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2B2A2A] px-4 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add Faculty
        </button>
      </section>

      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B5]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search faculty by name, email, or department..."
            className="w-full rounded-2xl border border-[#CFD2D9] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
          />
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Faculty Member</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Department</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`university-faculty-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                      {/* NOTE: Skeleton rows keep faculty management table structure visible during fetch. */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-[#F1F3F7]" />
                          <div className="space-y-2">
                            <div className="h-4 w-36 rounded bg-gray-200" />
                            <div className="h-3 w-44 rounded bg-gray-200" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="ml-auto h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                : null}

              {!isLoading && filteredMembers.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={4}>
                    No faculty members found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredMembers.map((member, index) => (
                  <tr key={member.email} className={index < filteredMembers.length - 1 ? "border-b border-gray-100" : ""}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5A54A] text-[13px] font-semibold text-white">
                          {member.initials}
                        </div>
                        <div>
                          <p className="text-[16px] font-semibold text-[#1F2430]">{member.name}</p>
                          <p className="text-[14px] text-[#506080]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#2D3B53]">{member.department}</td>
                    <td className="px-6 py-4">
                      {member.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5EC] px-3 py-1 text-[13px] text-[#0D9A4B]">
                          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF0F4] px-3 py-1 text-[13px] text-[#667186]">
                          <XCircle className="h-4 w-4" strokeWidth={2} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteFaculty(member)}
                        aria-label={deletingFacultyId === member.id ? `Deleting ${member.name}` : `Delete ${member.name}`}
                        // FIX: Added visible hover background so icon-only delete action has clearer affordance.
                        className="rounded-lg p-1.5 text-[#E0474C] transition-colors hover:bg-[#FDEBEC] hover:text-[#CB2F34] disabled:opacity-60"
                        disabled={deletingFacultyId === member.id}
                      >
                        {/* CLEANUP: Switched to icon-only delete action to match the language table action style. */}
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
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

export function UniversityFacultyPage() {
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [facultyForm, setFacultyForm] = useState<FacultyCreatePayload>(DEFAULT_FACULTY_FORM);
  const [facultyFormError, setFacultyFormError] = useState<string | null>(null);
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [deletingFacultyId, setDeletingFacultyId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyMember | null>(null);

  const loadMembers = () => {
    setIsLoading(true);
    setError(null);
    listFacultyMembers()
      .then(setMembers)
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load faculty members.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // NOTE: Container-level data loading keeps the table view presentation-only for easier backend handoff.
    loadMembers();
    listDepartmentOptions().then(setDepartmentOptions);
  }, []);

  const handleOpenCreateModal = () => {
    setFacultyForm(DEFAULT_FACULTY_FORM);
    setFacultyFormError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFacultyFormError(null);
  };

  const handleCreateFaculty = async () => {
    if (!facultyForm.name || !facultyForm.email || !facultyForm.department || !facultyForm.qualifications || !facultyForm.password) {
      setFacultyFormError("Name, email, department, qualifications, and password are required.");
      return;
    }

    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facultyForm.email);
    if (!emailLooksValid) {
      setFacultyFormError("Please enter a valid email address.");
      return;
    }

    setIsCreatingFaculty(true);
    setFacultyFormError(null);

    try {
      // NOTE: Uses existing backend-connected university faculty create endpoint.
      await createFaculty(facultyForm);
      handleCloseCreateModal();
      toast.success("Faculty member created successfully.");
      loadMembers();
    } catch (creationError) {
      const message = getApiErrorMessage(creationError, "Could not create faculty member.");
      setFacultyFormError(message);
      toast.error(message);
    } finally {
      setIsCreatingFaculty(false);
    }
  };

  const handleDeleteFacultyRequest = (faculty: FacultyMember) => {
    setFacultyToDelete(faculty);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return;
    setDeletingFacultyId(facultyToDelete.id);
    setError(null);

    try {
      // NOTE: Delete action is backend-connected and removes faculty + associated user from DB.
      await deleteFacultyById(facultyToDelete.id);
      toast.success("Faculty member deleted successfully.");
      setIsDeleteDialogOpen(false);
      setFacultyToDelete(null);
      loadMembers();
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, "Could not delete faculty member.");
      setError(message);
      toast.error(message);
    } finally {
      setDeletingFacultyId(null);
    }
  };

  return (
    <>
      <UniversityFacultyView
        members={members}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onOpenCreateModal={handleOpenCreateModal}
        onDeleteFaculty={handleDeleteFacultyRequest}
        deletingFacultyId={deletingFacultyId}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[560px] overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[24px] font-semibold text-[#1F2430]">Add New Faculty</h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
                aria-label="Close Add Faculty dialog"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {facultyFormError && <p className="text-[13px] text-[#C23A42]">{facultyFormError}</p>}

              <div>
                <label htmlFor="university-faculty-name" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="university-faculty-name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={facultyForm.name}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="university-faculty-email" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="university-faculty-email"
                    type="email"
                    placeholder="john.smith@university.edu"
                    value={facultyForm.email}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="university-faculty-department" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Department
                </label>
                <div className="relative">
                  <select
                    id="university-faculty-department"
                    value={facultyForm.department}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, department: event.target.value }))}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D6A80]" strokeWidth={2} />
                </div>
              </div>

              <div>
                <label htmlFor="university-faculty-qualifications" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Qualifications
                </label>
                <input
                  id="university-faculty-qualifications"
                  type="text"
                  placeholder="e.g., PhD in Computer Science"
                  value={facultyForm.qualifications}
                  onChange={(event) => setFacultyForm((prev) => ({ ...prev, qualifications: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="university-faculty-phone" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                    <input
                      id="university-faculty-phone"
                      type="text"
                      placeholder="e.g., +1 555 123 4567"
                      value={facultyForm.phoneNumber}
                      onChange={(event) => setFacultyForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="university-faculty-office" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Office Location
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                    <input
                      id="university-faculty-office"
                      type="text"
                      placeholder="e.g., ENG-214"
                      value={facultyForm.officeLocation}
                      onChange={(event) => setFacultyForm((prev) => ({ ...prev, officeLocation: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="university-faculty-password" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="university-faculty-password"
                    type="password"
                    placeholder="Enter temporary password"
                    value={facultyForm.password}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A]"
                disabled={isCreatingFaculty}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFaculty}
                className="rounded-xl bg-[#2B2A2A] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                disabled={isCreatingFaculty}
              >
                {isCreatingFaculty ? "Adding..." : "Add Faculty"}
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteReasonDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete faculty member"
        description={
          facultyToDelete
            ? `Delete "${facultyToDelete.name}"? This action permanently removes the account.`
            : "Delete this faculty member? This action permanently removes the account."
        }
        onConfirm={handleDeleteFaculty}
        isSubmitting={deletingFacultyId != null}
      />
    </>
  );
}
