import React from "react";
import { Link } from "react-router";
import { useFadeIn } from "./useFadeIn";

function MockDashboardCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#e8e3e8] w-full max-w-sm mx-auto"
      style={{ transform: "rotate(1.5deg)" }}
    >
      {/* Dark code panel */}
      <div className="bg-[#1e1e2e] px-4 pt-4 pb-3">
        <div className="flex gap-2 mb-3">
          <div className="px-3 py-1 bg-[#2d2d3f] rounded text-[11px] text-[#ce9178] font-medium">
            solution.py
          </div>
          <div className="px-3 py-1 rounded text-[11px] text-[#5d667a]">tests.py</div>
        </div>
        <div className="font-mono text-[12px] space-y-1 leading-relaxed">
          <div>
            <span className="text-[#569cd6]">def </span>
            <span className="text-[#dcdcaa]">bubble_sort</span>
            <span className="text-white">(arr):</span>
          </div>
          <div className="pl-4">
            <span className="text-[#c586c0]">for </span>
            <span className="text-[#9cdcfe]">i </span>
            <span className="text-[#c586c0]">in </span>
            <span className="text-[#dcdcaa]">range</span>
            <span className="text-white">(</span>
            <span className="text-[#dcdcaa]">len</span>
            <span className="text-white">(arr)):</span>
          </div>
          <div className="pl-8">
            <span className="text-[#c586c0]">for </span>
            <span className="text-[#9cdcfe]">j </span>
            <span className="text-[#c586c0]">in </span>
            <span className="text-[#dcdcaa]">range</span>
            <span className="text-white">(len(arr)-i-</span>
            <span className="text-[#b5cea8]">1</span>
            <span className="text-white">):</span>
          </div>
          <div className="pl-12">
            <span className="text-[#c586c0]">if </span>
            <span className="text-white">arr[j] &gt; arr[j+</span>
            <span className="text-[#b5cea8]">1</span>
            <span className="text-white">]:</span>
          </div>
        </div>
      </div>

      {/* Test results strip */}
      <div className="px-4 py-2.5 border-b border-[#e8e3e8] flex gap-1.5 flex-wrap bg-white">
        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-semibold">
          ✓ test_sorted
        </span>
        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-semibold">
          ✓ test_empty
        </span>
        <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-semibold">
          ✗ test_duplicates
        </span>
      </div>

      {/* Score bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#7A1226] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
            92
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#2B2A2A]">92 / 100</div>
            <div className="text-[11px] text-[#5d667a]">Final Score</div>
          </div>
        </div>
        <span className="px-2 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] text-green-700 font-semibold">
          Low AI Risk
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  const ref = useFadeIn();

  return (
    <section
      id="overview"
      className="bg-[#F5F4F6] relative overflow-hidden"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      {/* Subtle radial glow behind mock card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 65% 55%, rgba(122,18,38,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        ref={ref}
        className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
      >
        {/* Left: text */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-[#2B2A2A] leading-tight mb-5 tracking-tight">
            AI-powered code submission{" "}
            <span className="text-[#7A1226]">and grading</span> for universities
          </h1>
          <p className="text-[16px] md:text-[17px] text-[#5d667a] mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
            Submit assignments, run automated tests, detect plagiarism, and get AI-assisted
            grading reports — all in one platform built for modern CS education.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              to="/signup"
              className="px-7 py-3 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[15px] font-semibold transition-colors shadow-sm"
            >
              Sign up for free
            </Link>
            <Link
              to="/signin"
              className="px-7 py-3 bg-white border-2 border-[#2B2A2A] hover:bg-[#F5F4F6] text-[#2B2A2A] rounded-lg text-[15px] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Right: mock dashboard card */}
        <div className="flex-1 flex justify-center md:justify-end w-full">
          <MockDashboardCard />
        </div>
      </div>
    </section>
  );
}
