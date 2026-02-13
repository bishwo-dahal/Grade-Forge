import { useEffect, useState } from "react";
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
} from "lucide-react";
import type {
  AcademicSemester,
  FacultyMember,
  SupportedLanguage,
  UniversitySummaryStat,
} from "../../types/universityAdmin";
import {
  listAcademicSemesters,
  listDepartmentOptions,
  listFacultyMembers,
  listSupportedLanguages,
  listUniversitySummaryStats,
} from "../../services/universityAdminService";

export function UniversityAdminDashboard() {
  const [summaryCards, setSummaryCards] = useState<UniversitySummaryStat[]>([]);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    listUniversitySummaryStats().then(setSummaryCards);
    listFacultyMembers().then(setFacultyMembers);
    listAcademicSemesters().then(setAcademicSemesters);
    listSupportedLanguages().then(setSupportedLanguages);
    listDepartmentOptions().then(setDepartmentOptions);
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F2F2] px-6 py-6">
      <div className="max-w-[1320px] mx-auto">
      <div className="mb-9 flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#5A7ACD] text-white flex items-center justify-center">
          <Shield className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[42px] leading-none font-bold text-[#1F2430] mb-1">University Administration</h1>
          <p className="text-[15px] text-[#506080]">Manage faculty accounts and system configurations</p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-9">
        {summaryCards.map((card) => {
          const Icon = card.iconKey === "code" ? Code2 : Users;
          const iconClass =
            card.accent === "blue"
              ? "text-[#5A7ACD] bg-[#E8EEFF]"
              : "text-[#F5A54A] bg-[#FFF1E1]";

          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${iconClass}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-[42px] leading-none font-bold text-[#1F2430] mb-2">{card.value}</p>
              <p className="text-[15px] text-[#506080]">{card.label}</p>
            </div>
          );
        })}
      </section>

      <section className="mb-9">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[38px] leading-none font-bold text-[#1F2430] mb-2">Faculty Management</h2>
            <p className="text-[15px] text-[#506080]">Add, view, and manage faculty accounts</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFacultyModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-2xl text-[15px] font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add Faculty</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
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
              {facultyMembers.map((member, idx) => (
                <tr key={member.email} className={`${idx < facultyMembers.length - 1 ? "border-b border-gray-200" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#5A7ACD] text-white flex items-center justify-center text-[16px] font-semibold">
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F6EA] text-[#0D9A4B] text-[14px]">
                        <CircleCheck className="w-4 h-4" strokeWidth={2} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF0F4] text-[#6F7B8D] text-[14px]">
                        <CircleX className="w-4 h-4" strokeWidth={2} />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {member.status === "active" ? (
                      <button type="button" className="px-4 py-1.5 rounded-xl bg-[#FDEBEC] text-[#E0474C] text-[14px] font-medium">
                        Disable
                      </button>
                    ) : (
                      <button type="button" className="px-4 py-1.5 rounded-xl bg-[#EAF5EC] text-[#0D9A4B] text-[14px] font-medium">
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

      <section className="mb-9">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[38px] leading-none font-bold text-[#1F2430] mb-2">Academic Semesters</h2>
            <p className="text-[15px] text-[#506080]">Create and manage academic semesters for course assignments</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSemesterModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-2xl text-[15px] font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Create Semester</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {academicSemesters.map((semester) => (
            <article key={semester.name} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#E8EEFF] text-[#5A7ACD] flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[32px] leading-none font-semibold text-[#1F2430] mb-2">{semester.name}</h3>
                  {semester.status === "active" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E5F6EA] text-[#0D9A4B] text-[11px] font-semibold uppercase tracking-wide">
                      <CircleCheck className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Active</span>
                    </span>
                  )}
                  {semester.status === "upcoming" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#E8EEFF] text-[#2D63D7] text-[11px] font-semibold uppercase tracking-wide">
                      Upcoming
                    </span>
                  )}
                  {semester.status === "past" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#EDF0F4] text-[#6F7B8D] text-[11px] font-semibold uppercase tracking-wide">
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
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[38px] leading-none font-bold text-[#1F2430] mb-2">Supported Programming Languages</h2>
            <p className="text-[15px] text-[#506080]">Add or remove programming languages for assignments</p>
          </div>
          <button
            type="button"
            onClick={() => setShowLanguageModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#F5A54A] hover:bg-[#e7983f] text-white rounded-2xl text-[15px] font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add Language</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {supportedLanguages.map((language) => (
            <div key={language.name} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F3F5F8] flex items-center justify-center text-[#5A7ACD]">
                    {language.icon === "python" && <Code2 className="w-5 h-5" strokeWidth={2} />}
                    {language.icon === "javascript" && <Zap className="w-5 h-5 text-[#F5A54A]" strokeWidth={2} />}
                    {language.icon === "java" && <Cog className="w-5 h-5" strokeWidth={2} />}
                    {language.icon === "cpp" && <Cog className="w-5 h-5 text-[#8E79B6]" strokeWidth={2} />}
                    {language.icon === "rust" && <Bug className="w-5 h-5 text-[#F03A8C]" strokeWidth={2} />}
                    {language.icon === "go" && <Code2 className="w-5 h-5 text-[#3A7AE0]" strokeWidth={2} />}
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold text-[#1F2430]">{language.name}</p>
                    <p className="text-[14px] text-[#506080]">{language.version}</p>
                  </div>
                </div>

                <button type="button" aria-label={`Remove ${language.name}`} className="text-[#8B96A8] hover:text-[#E0474C] transition-colors">
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <p className="text-[14px] text-[#6D7B91]">{language.addedOn}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      {showFacultyModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[560px] bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="px-7 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8EEFF] text-[#5A7ACD] flex items-center justify-center">
                  <Users className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="text-[38px] leading-none font-bold text-[#1F2430]">Add New Faculty</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFacultyModal(false)}
                className="w-8 h-8 rounded-lg text-[#8B96A8] hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close Add Faculty dialog"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-7 pb-7 space-y-5">
              <div>
                <label htmlFor="faculty-name" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="faculty-name"
                    type="text"
                    placeholder="Dr. John Smith"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-email" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B96A8]" strokeWidth={2} />
                  <input
                    id="faculty-email"
                    type="email"
                    placeholder="john.smith@university.edu"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-department" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Department
                </label>
                <div className="relative">
                  <select
                    id="faculty-department"
                    defaultValue=""
                    className="w-full appearance-none px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  >
                    <option value="" disabled>
                      Select Department
                    </option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#5D6A80] pointer-events-none" strokeWidth={2} />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-qualifications" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Qualifications
                </label>
                <input
                  id="faculty-qualifications"
                  type="text"
                  placeholder="e.g., PhD in Computer Science"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="faculty-phone-number" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                    Phone Number
                  </label>
                  <input
                    id="faculty-phone-number"
                    type="text"
                    placeholder="e.g., +1 555 123 4567"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="faculty-office-location" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                    Office Location
                  </label>
                  <input
                    id="faculty-office-location"
                    type="text"
                    placeholder="e.g., ENG-214"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="faculty-password" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Password
                </label>
                <input
                  id="faculty-password"
                  type="password"
                  placeholder="Enter temporary password"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="py-3 rounded-2xl bg-[#EEF1F5] text-[#44506B] text-[15px] font-semibold hover:bg-[#e4e8ef] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-3 rounded-2xl bg-[#5A7ACD] text-white text-[15px] font-semibold hover:bg-[#4a6abd] transition-colors"
                >
                  Add Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[560px] bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="px-7 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8EEFF] text-[#5A7ACD] flex items-center justify-center">
                  <CalendarDays className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="text-[38px] leading-none font-bold text-[#1F2430]">Create Semester</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSemesterModal(false)}
                className="w-8 h-8 rounded-lg text-[#8B96A8] hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close Create Semester dialog"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-7 pb-7 space-y-5">
              <div>
                <label htmlFor="semester-name-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Semester Name
                </label>
                <input
                  id="semester-name-modal"
                  type="text"
                  placeholder="Fall 2026"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="semester-term-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Term
                </label>
                <div className="relative">
                  <select
                    id="semester-term-modal"
                    defaultValue=""
                    className="w-full appearance-none px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  >
                    <option value="" disabled>
                      Select Term
                    </option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#5D6A80] pointer-events-none" strokeWidth={2} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="semester-start-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                    Start Date
                  </label>
                  <input
                    id="semester-start-modal"
                    type="date"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="semester-end-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                    End Date
                  </label>
                  <input
                    id="semester-end-modal"
                    type="date"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  className="py-3 rounded-2xl bg-[#EEF1F5] text-[#44506B] text-[15px] font-semibold hover:bg-[#e4e8ef] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-3 rounded-2xl bg-[#5A7ACD] text-white text-[15px] font-semibold hover:bg-[#4a6abd] transition-colors"
                >
                  Create Semester
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[520px] bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="px-7 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF1E1] text-[#F5A54A] flex items-center justify-center">
                  <Code2 className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="text-[38px] leading-none font-bold text-[#1F2430]">Add Programming Language</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="w-8 h-8 rounded-lg text-[#8B96A8] hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close Add Programming Language dialog"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-7 pb-7 space-y-5">
              <div>
                <label htmlFor="language-name-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Language Name
                </label>
                <input
                  id="language-name-modal"
                  type="text"
                  placeholder="e.g., Python, Java, C++"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#F5A54A] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="language-version-modal" className="block text-[15px] font-medium text-[#1F2430] mb-2">
                  Version
                </label>
                <input
                  id="language-version-modal"
                  type="text"
                  placeholder="e.g., 3.11, ES2023, 17 LTS"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:outline-none focus:ring-2 focus:ring-[#F5A54A] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(false)}
                  className="py-3 rounded-2xl bg-[#EEF1F5] text-[#44506B] text-[15px] font-semibold hover:bg-[#e4e8ef] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-3 rounded-2xl bg-[#F5A54A] text-white text-[15px] font-semibold hover:bg-[#e7983f] transition-colors"
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
