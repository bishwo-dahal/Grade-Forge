import React from "react";
import { useFadeIn } from "./useFadeIn";

const STUDENT_BENEFITS = [
  "Write and submit code directly in the browser — no local setup",
  "Get instant automated test feedback on every submission",
  "Track grades and progress across all your courses",
  "See clear feedback on exactly where points were lost",
  "Familiar Monaco editor with syntax highlighting",
  "Submission history and deadline reminders built in",
];

const FACULTY_BENEFITS = [
  "Create assignments with custom automated test suites",
  "Autograde hundreds of submissions in minutes",
  "AI authorship & plagiarism detection on every submission",
  "Build reusable grading rubrics with inline feedback",
  "Delegate grading to assistants with scoped access",
  "University-wide admin dashboard and live monitoring",
];

function GraduationCapIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A1226" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A1226" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export function ForUsersSection() {
  const ref = useFadeIn();

  return (
    <section
      id="for-students"
      className="bg-[#F5F4F6] py-20 md:py-28"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div
        ref={ref}
        className="max-w-6xl mx-auto px-6"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#2B2A2A] tracking-tight">
            Built for every role in your department
          </h2>
          <p className="text-[15px] text-[#5d667a] mt-3 max-w-xl mx-auto">
            Grade-Forge serves students, faculty, and administrators with tailored workflows for each.
          </p>
        </div>

        <div
          id="for-faculty"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Students card */}
          <div className="bg-white rounded-2xl border border-[#e8e3e8] p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#fef2f2] flex items-center justify-center mb-5">
              <GraduationCapIcon />
            </div>
            <h3 className="text-[20px] font-bold text-[#2B2A2A] mb-5">Built for students</h3>
            <ul className="space-y-3">
              {STUDENT_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14px] text-[#5d667a]">
                  <span className="mt-0.5 shrink-0 text-[#7A1226] font-bold" aria-hidden="true">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Faculty card */}
          <div className="bg-white rounded-2xl border border-[#e8e3e8] p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#fef2f2] flex items-center justify-center mb-5">
              <BuildingIcon />
            </div>
            <h3 className="text-[20px] font-bold text-[#2B2A2A] mb-5">
              Built for faculty &amp; universities
            </h3>
            <ul className="space-y-3">
              {FACULTY_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14px] text-[#5d667a]">
                  <span className="mt-0.5 shrink-0 text-[#7A1226] font-bold" aria-hidden="true">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
