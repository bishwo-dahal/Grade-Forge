import {
  Shield,
  Users,
  Code2,
  Plus,
  CalendarDays,
  CircleCheck,
  CircleX,
  Trash2,
  Zap,
  Cog,
  Bug,
} from "lucide-react";

type FacultyMember = {
  initials: string;
  name: string;
  email: string;
  department: string;
  classes: number;
  students: number;
  status: "active" | "inactive";
};

type SupportedLanguage = {
  name: string;
  version: string;
  addedOn: string;
  icon: "python" | "javascript" | "java" | "cpp" | "rust" | "go";
};

type AcademicSemester = {
  name: string;
  status: "active" | "upcoming" | "past";
  startDate: string;
  endDate: string;
  courses: number;
};

const summaryCards = [
  { icon: Users, label: "Active Faculty", value: "3", accent: "blue" as const },
  { icon: Code2, label: "Supported Languages", value: "6", accent: "orange" as const },
  { icon: Users, label: "Total Classes", value: "9", accent: "blue" as const },
  { icon: Users, label: "Total Students", value: "247", accent: "orange" as const },
];

const facultyMembers: FacultyMember[] = [
  {
    initials: "DRC",
    name: "Dr. Rachel Chen",
    email: "r.chen@university.edu",
    department: "Computer Science",
    classes: 4,
    students: 104,
    status: "active",
  },
  {
    initials: "PMT",
    name: "Prof. Michael Torres",
    email: "m.torres@university.edu",
    department: "Computer Science",
    classes: 3,
    students: 87,
    status: "active",
  },
  {
    initials: "DSW",
    name: "Dr. Sarah Williams",
    email: "s.williams@university.edu",
    department: "Software Engineering",
    classes: 2,
    students: 56,
    status: "active",
  },
  {
    initials: "PJK",
    name: "Prof. James Kim",
    email: "j.kim@university.edu",
    department: "Computer Science",
    classes: 0,
    students: 0,
    status: "inactive",
  },
];

const supportedLanguages: SupportedLanguage[] = [
  { name: "Python", version: "v3.11", addedOn: "Added Jan 14, 2023", icon: "python" },
  { name: "JavaScript", version: "vES2023", addedOn: "Added Jan 14, 2023", icon: "javascript" },
  { name: "Java", version: "v17 LTS", addedOn: "Added Jan 14, 2023", icon: "java" },
  { name: "C++", version: "vC++20", addedOn: "Added Feb 19, 2023", icon: "cpp" },
  { name: "Rust", version: "v1.75", addedOn: "Added Jan 9, 2024", icon: "rust" },
  { name: "Go", version: "v1.21", addedOn: "Added Jan 9, 2024", icon: "go" },
];

const academicSemesters: AcademicSemester[] = [
  {
    name: "Fall 2023",
    status: "active",
    startDate: "Aug 14, 2023",
    endDate: "Dec 14, 2023",
    courses: 10,
  },
  {
    name: "Spring 2024",
    status: "upcoming",
    startDate: "Jan 14, 2024",
    endDate: "May 14, 2024",
    courses: 0,
  },
  {
    name: "Summer 2023",
    status: "past",
    startDate: "May 14, 2023",
    endDate: "Aug 14, 2023",
    courses: 5,
  },
];

export function UniversityAdminDashboard() {
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
          const Icon = card.icon;
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
    </main>
  );
}
