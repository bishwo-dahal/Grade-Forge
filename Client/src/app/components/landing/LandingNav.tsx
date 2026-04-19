import React, { useState } from "react";
import { Link } from "react-router";

const NAV_TABS = [
  { label: "Features", href: "#features" },
  { label: "AI Detection", href: "#ai-detection" },
  { label: "For Students", href: "#for-students" },
  { label: "For Faculty", href: "#for-faculty" },
  { label: "Canvas", href: "#canvas" },
  { label: "Contact", href: "#contact" },
];

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="bg-white border-b border-[#c9c4c9] px-6 py-3 flex items-center justify-between sticky top-0 z-50"
        style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
      >
        <Link
          to="/"
          className="text-[18px] font-bold text-[#2B2A2A] hover:text-[#7A1226] transition-colors shrink-0"
        >
          Grade Forge
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_TABS.map((tab) => (
            <a
              key={tab.label}
              href={tab.href}
              className="px-3 py-1.5 text-[13px] font-medium text-[#5d667a] hover:text-[#2B2A2A] rounded-md hover:bg-[#F5F4F6] transition-colors"
            >
              {tab.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            to="/signin"
            className="px-3 py-1.5 text-[13px] font-semibold text-[#2B2A2A] hover:text-[#7A1226] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            Sign up
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-md text-[#5d667a] hover:text-[#2B2A2A] hover:bg-[#F5F4F6] transition-colors"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#c9c4c9] px-4 py-3 flex flex-col gap-1 shadow-sm sticky top-[53px] z-40">
          {NAV_TABS.map((tab) => (
            <a
              key={tab.label}
              href={tab.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-[14px] font-medium text-[#5d667a] hover:text-[#2B2A2A] hover:bg-[#F5F4F6] rounded-md transition-colors"
            >
              {tab.label}
            </a>
          ))}
          <div className="border-t border-[#c9c4c9] mt-2 pt-2 flex flex-col gap-1">
            <Link
              to="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-[14px] font-semibold text-[#2B2A2A] hover:text-[#7A1226] hover:bg-[#F5F4F6] rounded-md transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[14px] font-semibold text-center transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
