import React from "react";
import { useFadeIn } from "./useFadeIn";

function MockDetectionCard() {
  // Circle r=38, circumference = 2 * π * 38 ≈ 238.76
  // 12% AI risk filled: dashoffset = 238.76 * (1 - 0.12) ≈ 210.1
  const CIRC = 238.76;
  const aiRiskPercent = 12;
  const dashOffset = CIRC * (1 - aiRiskPercent / 100);

  const plagiarismRows = [
    { name: "Alex Johnson", pct: 34, color: "bg-amber-400", textColor: "text-amber-600" },
    { name: "Maria Chen", pct: 8, color: "bg-green-400", textColor: "text-green-600" },
    { name: "David Park", pct: 5, color: "bg-green-400", textColor: "text-green-600" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#e8e3e8] overflow-hidden w-full max-w-md mx-auto">
      {/* AI Detection panel */}
      <div className="px-5 pt-5 pb-4 border-b border-[#e8e3e8]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[12px] font-bold text-[#2B2A2A] uppercase tracking-wider">
            AI Authorship Analysis
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* Circular gauge */}
          <svg width="80" height="80" viewBox="0 0 100 100" className="shrink-0">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e8e3e8" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#22c55e"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
            <text x="50" y="47" textAnchor="middle" fill="#2B2A2A" fontSize="14" fontWeight="800">
              {aiRiskPercent}%
            </text>
            <text x="50" y="61" textAnchor="middle" fill="#5d667a" fontSize="8.5">
              AI Risk
            </text>
          </svg>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-semibold text-green-700">Low Risk</span>
            </div>
            <p className="text-[12px] text-[#5d667a] leading-relaxed">
              Writing patterns, variable naming, and structure match student's prior submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Plagiarism panel */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[12px] font-bold text-[#2B2A2A] uppercase tracking-wider">
            Plagiarism Similarity
          </span>
        </div>
        <div className="space-y-2.5">
          {plagiarismRows.map(({ name, pct, color, textColor }) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-[11px] text-[#5d667a] w-24 shrink-0">{name}</span>
              <div className="flex-1 bg-[#F5F4F6] rounded-full h-2">
                <div
                  className={`${color} h-2 rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[11px] font-bold ${textColor} w-8 text-right shrink-0`}>
                {pct}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#e8e3e8]">
          <span className="text-[11px] text-amber-600 font-semibold">
            ⚠ 1 pair flagged for review — 34% token overlap
          </span>
        </div>
      </div>
    </div>
  );
}

const BULLETS = [
  "Deterministic AI authorship heuristics — no black box decisions",
  "Token-based plagiarism similarity across all class submissions",
  "Color-coded risk levels: Low, Medium, and High",
  "Side-by-side diff view for suspected plagiarism pairs",
];

export function AiDetectionSection() {
  const ref = useFadeIn();

  return (
    <section
      id="ai-detection"
      className="bg-[#F5F4F6] py-20 md:py-28"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div
        ref={ref}
        className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-14"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      >
        {/* Text (right visually, first in DOM due to flex-row-reverse) */}
        <div className="flex-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7A1226] mb-3 block">
            AI &amp; Plagiarism Detection
          </span>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#2B2A2A] leading-tight mb-4 tracking-tight">
            Know what students wrote — and what they didn't
          </h2>
          <p className="text-[15px] text-[#5d667a] mb-6 leading-relaxed">
            Grade-Forge's analysis pipeline scores every submission for AI authorship risk and
            cross-submission similarity, giving faculty clear, explainable signals — not opaque
            verdicts.
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

        {/* Mock card (left visually) */}
        <div className="flex-1 w-full">
          <MockDetectionCard />
        </div>
      </div>
    </section>
  );
}
