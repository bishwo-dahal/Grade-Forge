import React from "react";
import { useFadeIn } from "./useFadeIn";

function MockEditorCard() {
  return (
    <div className="bg-[#1e1e2e] rounded-xl shadow-xl overflow-hidden border border-[#2d2d3f] w-full max-w-md mx-auto">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#16161e] border-b border-[#2d2d3f]">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex gap-0.5">
          {["main.py", "utils.py", "test_main.py"].map((name, i) => (
            <div
              key={name}
              className={`px-3 py-1 rounded-t text-[11px] font-medium ${
                i === 0
                  ? "bg-[#1e1e2e] text-[#ce9178]"
                  : "text-[#5d667a] hover:text-[#9d9d9d]"
              }`}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Code lines */}
      <div className="px-4 py-4 font-mono text-[12px] space-y-1 leading-relaxed">
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">1</span>
          <span>
            <span className="text-[#c586c0]">import </span>
            <span className="text-[#9cdcfe]">heapq</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">2</span>
          <span className="text-white">&nbsp;</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">3</span>
          <span>
            <span className="text-[#569cd6]">def </span>
            <span className="text-[#dcdcaa]">dijkstra</span>
            <span className="text-white">(graph, start):</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">4</span>
          <span className="pl-4">
            <span className="text-[#9cdcfe]">dist </span>
            <span className="text-white">= &#123;</span>
            <span className="text-[#9cdcfe]">node</span>
            <span className="text-white">: </span>
            <span className="text-[#dcdcaa]">float</span>
            <span className="text-white">(</span>
            <span className="text-[#ce9178]">'inf'</span>
            <span className="text-white">) </span>
            <span className="text-[#c586c0]">for </span>
            <span className="text-[#9cdcfe]">node </span>
            <span className="text-[#c586c0]">in </span>
            <span className="text-[#9cdcfe]">graph</span>
            <span className="text-white">&#125;</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">5</span>
          <span className="pl-4">
            <span className="text-[#9cdcfe]">dist</span>
            <span className="text-white">[start] = </span>
            <span className="text-[#b5cea8]">0</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#4d4d5a] w-4 shrink-0 text-right select-none">6</span>
          <span className="pl-4">
            <span className="text-[#9cdcfe]">heap </span>
            <span className="text-white">= [(</span>
            <span className="text-[#b5cea8]">0</span>
            <span className="text-white">, start)]</span>
          </span>
        </div>
      </div>

      {/* Console panel */}
      <div className="border-t border-[#2d2d3f] bg-[#16161e] px-4 py-3">
        <div className="text-[10px] text-[#5d667a] font-semibold uppercase tracking-wider mb-2">
          Console
        </div>
        <div className="font-mono text-[11px] space-y-0.5">
          <div className="text-green-400">✓ All 8 test cases passed</div>
          <div className="text-[#5d667a]">Execution time: 0.03s · Memory: 12.4 MB</div>
        </div>
      </div>
    </div>
  );
}

const BULLETS = [
  "Monaco-powered editor with syntax highlighting for 10+ languages",
  "File tree navigation for multi-file assignments",
  "Integrated console output with real test results",
  "Save drafts and resume any time before the deadline",
];

export function CodeEditorSection() {
  const ref = useFadeIn();

  return (
    <section
      id="code-editor"
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
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7A1226] mb-3 block">
            Code Editor
          </span>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#2B2A2A] leading-tight mb-4 tracking-tight">
            A full coding environment, right in the browser
          </h2>
          <p className="text-[15px] text-[#5d667a] mb-6 leading-relaxed">
            Students write and submit code without leaving the platform. Syntax highlighting,
            file trees, and an integrated console give them a real IDE experience — no setup
            required.
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

        {/* Right: mock editor */}
        <div className="flex-1 w-full">
          <MockEditorCard />
        </div>
      </div>
    </section>
  );
}
