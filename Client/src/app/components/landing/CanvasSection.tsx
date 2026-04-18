import React from "react";
import { useFadeIn } from "./useFadeIn";

function MockCanvasCard() {
  const rows = [
    { course: "CS 101 — Intro to Programming", assignment: "HW3: Sorting", students: 42, status: "Synced", statusStyle: "bg-green-50 text-green-700 border-green-200" },
    { course: "CS 301 — Data Structures", assignment: "Lab 5: Trees", students: 31, status: "Synced", statusStyle: "bg-green-50 text-green-700 border-green-200" },
    { course: "CS 401 — Algorithms", assignment: "Project 2", students: 28, status: "Pending", statusStyle: "bg-amber-50 text-amber-700 border-amber-200" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#e8e3e8] overflow-hidden w-full max-w-md mx-auto">
      {/* Header */}
      <div className="px-5 py-4 bg-[#F5F4F6] border-b border-[#e8e3e8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#E66000] flex items-center justify-center text-white text-[11px] font-bold">
            C
          </div>
          <span className="text-[13px] font-bold text-[#2B2A2A]">Canvas LMS Sync</span>
        </div>
        <span className="text-[10px] font-semibold text-[#7A1226] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 rounded-full uppercase tracking-wider">
          Coming Soon
        </span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[#e8e3e8]">
        {rows.map((row) => (
          <div key={row.course} className="px-5 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#2B2A2A] truncate">{row.course}</div>
              <div className="text-[11px] text-[#5d667a] truncate">{row.assignment}</div>
            </div>
            <div className="text-[11px] text-[#5d667a] shrink-0">{row.students} students</div>
            <span
              className={`shrink-0 px-2 py-0.5 border rounded-full text-[10px] font-semibold ${row.statusStyle}`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[#F5F4F6] border-t border-[#e8e3e8] flex items-center justify-between">
        <span className="text-[11px] text-[#5d667a]">Last synced: 2 minutes ago</span>
        <button
          disabled
          aria-label="Sync Now (coming soon)"
          className="px-3 py-1.5 bg-[#7A1226] text-white text-[11px] font-semibold rounded-lg opacity-50 cursor-not-allowed"
        >
          Sync Now
        </button>
      </div>
    </div>
  );
}

const BULLETS = [
  "One-click assignment import from existing Canvas courses",
  "Automatic grade passback — no manual entry after grading",
  "Student roster sync — no separate enrollment needed",
  "Works alongside existing Canvas rubrics and SpeedGrader",
];

export function CanvasSection() {
  const ref = useFadeIn();

  return (
    <section
      id="canvas"
      className="bg-white py-20 md:py-28"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div
        ref={ref}
        className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-14"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      >
        {/* Left: text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7A1226]">
              Canvas Integration
            </span>
            <span className="text-[10px] font-bold bg-[#fef2f2] text-[#7A1226] border border-[#fecaca] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#2B2A2A] leading-tight mb-4 tracking-tight">
            Sync seamlessly with Canvas LMS
          </h2>
          <p className="text-[15px] text-[#5d667a] mb-6 leading-relaxed">
            Grade-Forge will connect directly with your institution's Canvas environment. Create
            assignments once, sync grades automatically, and keep students in a single workflow
            they already know.
          </p>
          <ul className="space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[14px] text-[#2B2A2A]">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#7A1226] flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: mock card */}
        <div className="flex-1 w-full">
          <MockCanvasCard />
        </div>
      </div>
    </section>
  );
}
