import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listUniversityCourses } from "../../services/universityAdminService";
import type { UniversityCourseRow } from "../../types/universityAdmin";

interface UniversityCoursesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  courses: UniversityCourseRow[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

function UniversityCoursesView({ courses, isLoading, error, searchTerm, onSearchTermChange }: UniversityCoursesViewProps) {
  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return courses;
    }
    return courses.filter((course) => {
      return (
        course.code.toLowerCase().includes(normalizedSearch) ||
        course.name.toLowerCase().includes(normalizedSearch) ||
        course.instructor.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [courses, searchTerm]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* FIX: Reduced section heading size so university pages match the natural typography used elsewhere. */}
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Courses</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">Manage all courses across semesters</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2B2A2A] px-4 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add Course
        </button>
      </section>

      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B5]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search courses by name, code, or instructor..."
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
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Course</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Instructor</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Semester</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Students</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Assignments</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={6}>
                    Loading courses...
                  </td>
                </tr>
              )}

              {!isLoading && filteredCourses.length === 0 && (
                <tr>
                  {/* NOTE: Courses table intentionally starts empty until university courses endpoint is integrated. */}
                  <td className="px-6 py-5 text-[14px] text-[#5D6A80]" colSpan={6}>
                    No courses available yet.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredCourses.map((course, index) => (
                  <tr key={course.id} className={index < filteredCourses.length - 1 ? "border-b border-gray-100" : ""}>
                    <td className="px-6 py-4">
                      <p className="text-[16px] font-semibold text-[#1F2430]">{course.code}</p>
                      <p className="text-[14px] text-[#506080]">{course.name}</p>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#2D3B53]">{course.instructor}</td>
                    <td className="px-6 py-4 text-[14px] text-[#2D3B53]">{course.semester}</td>
                    <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{course.students}</td>
                    <td className="px-6 py-4 text-[16px] font-semibold text-[#1F2430]">{course.assignments}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-[#6E7890]">
                        <button type="button" aria-label={`Edit ${course.code}`} className="hover:text-[#4A546B]">
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button type="button" aria-label={`Delete ${course.code}`} className="text-[#E0474C] hover:text-[#CB2F34]">
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

export function UniversityCoursesPage() {
  const [courses, setCourses] = useState<UniversityCourseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // NOTE: Container-level data loading keeps the table view presentation-only for easier backend handoff.
    listUniversityCourses()
      .then(setCourses)
      .catch(() => setError("Could not load courses."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <UniversityCoursesView
      courses={courses}
      isLoading={isLoading}
      error={error}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
    />
  );
}
