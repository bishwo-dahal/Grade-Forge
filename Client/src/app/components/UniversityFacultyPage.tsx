import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Search, XCircle } from "lucide-react";
import type { FacultyMember } from "../../types/universityAdmin";
import { listFacultyMembers } from "../../services/universityAdminService";

interface UniversityFacultyViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  members: FacultyMember[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

function UniversityFacultyView({ members, isLoading, error, searchTerm, onSearchTermChange }: UniversityFacultyViewProps) {
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
          <h1 className="text-[34px] leading-none font-bold text-[#2B2A2A]">Faculty Management</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">Manage faculty accounts and permissions</p>
        </div>
        <button
          type="button"
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
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Classes</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Students</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={6}>
                    Loading faculty members...
                  </td>
                </tr>
              )}

              {!isLoading && filteredMembers.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={6}>
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
                    <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{member.classes}</td>
                    <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{member.students}</td>
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
                      {member.status === "active" ? (
                        <button type="button" className="rounded-xl bg-[#FDEBEC] px-4 py-1.5 text-[14px] font-medium text-[#E0474C]">
                          Disable
                        </button>
                      ) : (
                        <button type="button" className="rounded-xl bg-[#EAF5EC] px-4 py-1.5 text-[14px] font-medium text-[#0D9A4B]">
                          Enable
                        </button>
                      )}
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

  useEffect(() => {
    // NOTE: Container-level data loading keeps the table view presentation-only for easier backend handoff.
    listFacultyMembers()
      .then(setMembers)
      .catch(() => setError("Could not load faculty members."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <UniversityFacultyView
      members={members}
      isLoading={isLoading}
      error={error}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
    />
  );
}
