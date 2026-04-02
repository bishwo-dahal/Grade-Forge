
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Users,
  Code2,
  Plus,
  CalendarDays,
  User,
  Mail,
  ChevronDown,
  X,
  CircleCheck,
  CircleX,
  Trash2,
  Zap,
  Cog,
  Bug,
  Lock,
  Phone,
  MapPin,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router";
import type {
  AcademicSemester,
  FacultyCreatePayload,
  FacultyMember,
  SemesterCreatePayload,
  SupportedLanguage,
  UniversitySummaryStat,
} from "../../types/universityAdmin";
import {
  createAcademicSemester,
  createFaculty,
  listAcademicSemesters,
  listDepartmentOptions,
  listFacultyMembers,
  listSupportedLanguages,
} from "../../services/universityAdminService";
import { clearAuthenticated } from "../auth";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

type FacultyFormState = FacultyCreatePayload;
type SemesterFormState = SemesterCreatePayload;

const DEFAULT_FACULTY_FORM: FacultyFormState = {
  name: "",
  email: "",
  department: "",
  qualifications: "",
  phoneNumber: "",
  officeLocation: "",
  password: "",
};

const DEFAULT_SEMESTER_FORM: SemesterFormState = {
  name: "",
  startDate: "",
  endDate: "",
};

export function UniversityAdminDashboard() {
  const navigate = useNavigate();
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const [facultyLoading, setFacultyLoading] = useState(true);
  const [semesterLoading, setSemesterLoading] = useState(true);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [semesterError, setSemesterError] = useState<string | null>(null);

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [facultyForm, setFacultyForm] = useState<FacultyFormState>(DEFAULT_FACULTY_FORM);
  const [semesterForm, setSemesterForm] = useState<SemesterFormState>(DEFAULT_SEMESTER_FORM);
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [facultyFormError, setFacultyFormError] = useState<string | null>(null);
  const [semesterFormError, setSemesterFormError] = useState<string | null>(null);

  const summaryCards = useMemo<UniversitySummaryStat[]>(
    () => [
      {
        iconKey: "users",
        label: "Active Faculty",
        value: String(facultyMembers.filter((member) => member.status === "active").length),
        accent: "blue",
      },
      {
        iconKey: "code",
        label: "Supported Languages",
        value: String(supportedLanguages.length),
        accent: "orange",
      },
      {
        iconKey: "users",
        label: "Total Classes",
        value: String(facultyMembers.reduce((sum, member) => sum + member.classes, 0)),
        accent: "blue",
      },
      {
        iconKey: "users",
        label: "Total Students",
        value: String(facultyMembers.reduce((sum, member) => sum + member.students, 0)),
        accent: "orange",
      },
    ],
    [facultyMembers, supportedLanguages]
  );

  const loadFaculty = async () => {
    setFacultyLoading(true);
    setFacultyError(null);

    try {
      const data = await listFacultyMembers();
      setFacultyMembers(data);
    } catch (error) {
      setFacultyError(getApiErrorMessage(error, "Could not load faculty members."));
    } finally {
      setFacultyLoading(false);
    }
  };

  const loadSemesters = async () => {
    setSemesterLoading(true);
    setSemesterError(null);

    try {
      const data = await listAcademicSemesters();
      setAcademicSemesters(data);
    } catch (error) {
      setSemesterError(getApiErrorMessage(error, "Could not load semesters."));
    } finally {
      setSemesterLoading(false);
    }
  };

  useEffect(() => {
    void loadFaculty();
    void loadSemesters();
    listSupportedLanguages().then(setSupportedLanguages);
    listDepartmentOptions().then(setDepartmentOptions);
  }, []);

  const closeFacultyModal = () => {
    setShowFacultyModal(false);
    setFacultyForm(DEFAULT_FACULTY_FORM);
    setFacultyFormError(null);
  };

  const closeSemesterModal = () => {
    setShowSemesterModal(false);
    setSemesterForm(DEFAULT_SEMESTER_FORM);
    setSemesterFormError(null);
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
      await createFaculty(facultyForm);
      closeFacultyModal();
      await loadFaculty();
    } catch (error) {
      setFacultyFormError(getApiErrorMessage(error, "Could not create faculty member."));
    } finally {
      setIsCreatingFaculty(false);
    }
  };

  const handleCreateSemester = async () => {
    if (!semesterForm.name || !semesterForm.startDate || !semesterForm.endDate) {
      setSemesterFormError("Semester name, start date, and end date are required.");
      return;
    }

    if (new Date(semesterForm.endDate) < new Date(semesterForm.startDate)) {
      setSemesterFormError("End date must be the same day or after the start date.");
      return;
    }

    setIsCreatingSemester(true);
    setSemesterFormError(null);

    try {
      await createAcademicSemester(semesterForm);
      closeSemesterModal();
      await loadSemesters();
    } catch (error) {
      setSemesterFormError(getApiErrorMessage(error, "Could not create semester."));
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleLogout = () => {
    // NOTE: University-admin logout uses the same session clear flow as other dashboards.
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#F5F2F2] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#5A7ACD] text-white flex items-center justify-center">
              <Shield className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2430] leading-tight">University Administration</h1>
              <p className="text-[15px] text-[#506080]">Manage faculty accounts and system configurations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-[15px] font-semibold text-[#C23A42] border border-[#F3CDD1] hover:bg-[#FFF5F6] transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.iconKey === "code" ? Code2 : Users;
            const iconClass = card.accent === "blue" ? "text-[#5A7ACD] bg-[#E8EEFF]" : "text-[#F5A54A] bg-[#FFF1E1]";

            return (
              <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="mb-1 text-3xl font-bold text-[#1F2430]">{card.value}</p>
                <p className="text-[15px] text-[#506080]">{card.label}</p>
              </div>
            );
          })}
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2430] leading-tight">Faculty Management</h2>
              <p className="text-[15px] text-[#506080]">Add, view, and manage faculty accounts</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFacultyModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7A1226] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#65101F] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Add Faculty</span>
            </button>
          </div>

          {facultyError && <p className="mb-3 text-sm text-[#C23A42]">{facultyError}</p>}

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Faculty Member</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Department</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Classes</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Students</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold tracking-wider text-[#345079] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyLoading && (
                    <tr>
                      <td className="px-6 py-5 text-[15px] text-[#506080]" colSpan={6}>
                        Loading faculty members...
                      </td>
                    </tr>
                  )}

                  {!facultyLoading && facultyMembers.length === 0 && (
                    <tr>
                      <td className="px-6 py-5 text-[15px] text-[#506080]" colSpan={6}>
                        No faculty members found.
                      </td>
                    </tr>
                  )}

                  {!facultyLoading &&
                    facultyMembers.map((member, idx) => (
                      <tr key={member.email} className={idx < facultyMembers.length - 1 ? "border-b border-gray-200" : ""}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5A7ACD] text-[14px] font-semibold text-white">
                              {member.initials}
                            </div>
                            <div>
                              <p className="text-[16px] font-semibold text-[#1F2430]">{member.name}</p>
                              <p className="text-[14px] text-[#506080]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[15px] text-[#2D3B53]">{member.department}</td>
                        <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{member.classes}</td>
                        <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{member.students}</td>
                        <td className="px-6 py-4">
                          {member.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F6EA] px-3 py-1 text-[14px] text-[#0D9A4B]">
                              <CircleCheck className="h-4 w-4" strokeWidth={2} />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF0F4] px-3 py-1 text-[14px] text-[#6F7B8D]">
                              <CircleX className="h-4 w-4" strokeWidth={2} />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2430] leading-tight">Academic Semesters</h2>
              <p className="text-[15px] text-[#506080]">Create and manage academic semesters for course assignments</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSemesterModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7A1226] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#65101F] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Create Semester</span>
            </button>
          </div>

          {semesterError && <p className="mb-3 text-sm text-[#C23A42]">{semesterError}</p>}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {semesterLoading && (
              <article className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-[15px] text-[#506080]">Loading semesters...</p>
              </article>
            )}

            {!semesterLoading && academicSemesters.length === 0 && (
              <article className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-[15px] text-[#506080]">No semesters found.</p>
              </article>
            )}

            {!semesterLoading &&
              academicSemesters.map((semester) => (
                <article key={`${semester.name}-${semester.startDate}`} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#5A7ACD]">
                      <CalendarDays className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-[28px] leading-none font-semibold text-[#1F2430] mb-2">{semester.name}</h3>
                      {semester.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E5F6EA] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0D9A4B]">
                          <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          <span>Active</span>
                        </span>
                      )}
                      {semester.status === "upcoming" && (
                        <span className="inline-flex items-center rounded-lg bg-[#E8EEFF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2D63D7]">
                          Upcoming
                        </span>
                      )}
                      {semester.status === "past" && (
                        <span className="inline-flex items-center rounded-lg bg-[#EDF0F4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6F7B8D]">
                          Past
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-[15px] text-[#2D3B53]">
                    <p>Start: {semester.startDate}</p>
                    <p>End: {semester.endDate}</p>
                    <p>Courses: {semester.courses}</p>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2430] leading-tight">Supported Programming Languages</h2>
              <p className="text-[15px] text-[#506080]">Add or remove programming languages for assignments</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLanguageModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F5A54A] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#e7983f] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Add Language</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {supportedLanguages.map((language) => (
              <div key={language.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F5F8] text-[#5A7ACD]">
                      {language.icon === "python" && <Code2 className="h-5 w-5" strokeWidth={2} />}
                      {language.icon === "javascript" && <Zap className="h-5 w-5 text-[#F5A54A]" strokeWidth={2} />}
                      {language.icon === "java" && <Cog className="h-5 w-5" strokeWidth={2} />}
                      {language.icon === "cpp" && <Cog className="h-5 w-5 text-[#8E79B6]" strokeWidth={2} />}
                      {language.icon === "rust" && <Bug className="h-5 w-5 text-[#F03A8C]" strokeWidth={2} />}
                      {language.icon === "go" && <Code2 className="h-5 w-5 text-[#3A7AE0]" strokeWidth={2} />}
                      {language.icon === "code" && <Code2 className="h-5 w-5" strokeWidth={2} />}
                    </div>
                    <div>
                      <p className="text-[18px] font-semibold text-[#1F2430]">{language.name}</p>
                      <p className="text-[14px] text-[#506080]">{language.version}</p>
                    </div>
                  </div>

                  <button type="button" aria-label={`Remove ${language.name}`} className="text-[#8B96A8] transition-colors hover:text-[#E0474C]">
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                <p className="text-[14px] text-[#6D7B91]">{language.addedOn}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[560px] rounded-3xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8EEFF] text-[#5A7ACD]">
                  <Users className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-[32px] font-bold leading-none text-[#1F2430]">Add New Faculty</h3>
              </div>
              <button
                type="button"
                onClick={closeFacultyModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
                aria-label="Close Add Faculty dialog"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4 px-6 pb-6">
              {facultyFormError && <p className="text-sm text-[#C23A42]">{facultyFormError}</p>}

              <div>
                <label htmlFor="faculty-name" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="faculty-name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={facultyForm.name}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-email" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="faculty-email"
                    type="email"
                    placeholder="john.smith@university.edu"
                    value={facultyForm.email}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-department" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Department
                </label>
                <div className="relative">
                  <select
                    id="faculty-department"
                    value={facultyForm.department}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, department: event.target.value }))}
                    className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D6A80]" strokeWidth={2} />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-qualifications" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Qualifications
                </label>
                <input
                  id="faculty-qualifications"
                  type="text"
                  placeholder="e.g., PhD in Computer Science"
                  value={facultyForm.qualifications}
                  onChange={(event) => setFacultyForm((prev) => ({ ...prev, qualifications: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="faculty-phone-number" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                    <input
                      id="faculty-phone-number"
                      type="text"
                      placeholder="e.g., +1 555 123 4567"
                      value={facultyForm.phoneNumber}
                      onChange={(event) => setFacultyForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="faculty-office-location" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                    Office Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                    <input
                      id="faculty-office-location"
                      type="text"
                      placeholder="e.g., ENG-214"
                      value={facultyForm.officeLocation}
                      onChange={(event) => setFacultyForm((prev) => ({ ...prev, officeLocation: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="faculty-password" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="faculty-password"
                    type="password"
                    placeholder="Enter temporary password"
                    value={facultyForm.password}
                    onChange={(event) => setFacultyForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeFacultyModal}
                  className="rounded-2xl bg-[#EEF1F5] py-3 text-[15px] font-semibold text-[#44506B] transition-colors hover:bg-[#e4e8ef]"
                  disabled={isCreatingFaculty}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFaculty}
                  className="rounded-2xl bg-[#7A1226] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#65101F] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isCreatingFaculty}
                >
                  {isCreatingFaculty ? "Adding..." : "Add Faculty"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[560px] rounded-3xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8EEFF] text-[#5A7ACD]">
                  <CalendarDays className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-[32px] font-bold leading-none text-[#1F2430]">Create Semester</h3>
              </div>
              <button
                type="button"
                onClick={closeSemesterModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
                aria-label="Close Create Semester dialog"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-5 px-6 pb-6">
              {semesterFormError && <p className="text-sm text-[#C23A42]">{semesterFormError}</p>}

              <div>
                <label htmlFor="semester-name-modal" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Semester Name
                </label>
                <input
                  id="semester-name-modal"
                  type="text"
                  placeholder="Fall 2026"
                  value={semesterForm.name}
                  onChange={(event) => setSemesterForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="semester-start-modal" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                    Start Date
                  </label>
                  <input
                    id="semester-start-modal"
                    type="date"
                    value={semesterForm.startDate}
                    onChange={(event) => setSemesterForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="semester-end-modal" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                    End Date
                  </label>
                  <input
                    id="semester-end-modal"
                    type="date"
                    value={semesterForm.endDate}
                    onChange={(event) => setSemesterForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeSemesterModal}
                  className="rounded-2xl bg-[#EEF1F5] py-3 text-[15px] font-semibold text-[#44506B] transition-colors hover:bg-[#e4e8ef]"
                  disabled={isCreatingSemester}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSemester}
                  className="rounded-2xl bg-[#7A1226] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#65101F] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isCreatingSemester}
                >
                  {isCreatingSemester ? "Creating..." : "Create Semester"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[520px] rounded-3xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1E1] text-[#F5A54A]">
                  <Code2 className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-[32px] font-bold leading-none text-[#1F2430]">Add Programming Language</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
                aria-label="Close Add Programming Language dialog"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-5 px-6 pb-6">
              <div>
                <label htmlFor="language-name-modal" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Language Name
                </label>
                <input
                  id="language-name-modal"
                  type="text"
                  placeholder="e.g., Python, Java, C++"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5A54A]"
                />
              </div>

              <div>
                <label htmlFor="language-version-modal" className="mb-2 block text-[15px] font-medium text-[#1F2430]">
                  Version
                </label>
                <input
                  id="language-version-modal"
                  type="text"
                  placeholder="e.g., 3.11, ES2023, 17 LTS"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5A54A]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(false)}
                  className="rounded-2xl bg-[#EEF1F5] py-3 text-[15px] font-semibold text-[#44506B] transition-colors hover:bg-[#e4e8ef]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-[#F5A54A] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#e7983f]"
                >
                  Add Language
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
