import React from "react";
import { useFadeIn } from "./useFadeIn";

const FEATURES = [
  {
    name: "Code Submission",
    description: "Submit single or multi-file assignments directly from the browser with no local tooling required.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    name: "Autograding",
    description: "Run test suites automatically on every submission and return scores within seconds.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    name: "AI Detection",
    description: "Score every submission for AI authorship risk using deterministic, explainable heuristics.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    name: "Plagiarism Check",
    description: "Token-based similarity analysis across all submissions in a class, flagged with a diff view.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    name: "Grading Rubrics",
    description: "Build structured rubrics once and apply them consistently across every submission in a class.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    name: "Instant Feedback",
    description: "Students see test results and grading feedback the moment the autograder finishes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    name: "Multi-language Support",
    description: "Grade assignments written in Python, Java, C/C++, JavaScript, and more.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    name: "Canvas Sync",
    description: "Sync assignments and push grades back to Canvas LMS automatically. (Coming Soon)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    name: "Role Management",
    description: "Students, faculty, grading assistants, and admins — each with precisely scoped access.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export function FeaturesGrid() {
  const ref = useFadeIn();

  return (
    <section
      id="features"
      className="bg-white py-20 md:py-28"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div
        ref={ref}
        className="max-w-6xl mx-auto px-6"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      >
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7A1226] block mb-3">
            Most Popular Features
          </span>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#2B2A2A] tracking-tight">
            Everything you need in one platform
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ name, description, icon }) => (
            <div
              key={name}
              className="flex gap-4 p-5 rounded-xl border border-[#e8e3e8] hover:border-[#c9c4c9] hover:shadow-sm transition-all"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[#fef2f2] text-[#7A1226] flex items-center justify-center">
                {icon}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#2B2A2A] mb-1">{name}</div>
                <div className="text-[13px] text-[#5d667a] leading-relaxed">{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
