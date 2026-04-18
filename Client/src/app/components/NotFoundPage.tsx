import React, { useState } from "react";
import { Link } from "react-router";

const NAV_TABS = [
  { label: "Overview", href: "/#overview" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "For Universities", href: "/#for-universities" },
  { label: "FAQs", href: "/#faqs" },
];

export default function NotFoundPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F4F6] flex flex-col" style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-[#c9c4c9] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Brand */}
        <Link to="/" className="text-[18px] font-bold text-[#2B2A2A] hover:text-[#7A1226] transition-colors shrink-0">
          Grade Forge
        </Link>

        {/* Desktop Nav Tabs */}
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

        {/* Desktop Auth Buttons */}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md text-[#5d667a] hover:text-[#2B2A2A] hover:bg-[#F5F4F6] transition-colors"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#c9c4c9] px-4 py-3 flex flex-col gap-1 shadow-sm">
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

      {/* Main 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Subtle radial background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(122,18,38,0.06) 0%, transparent 70%)",
          }}
        />

        {/* 404 Numeral */}
        <div className="relative select-none" aria-hidden="true">
          <span
            className="font-extrabold leading-none tracking-tighter text-[#7A1226]"
            style={{
              fontSize: "clamp(120px, 22vw, 240px)",
              opacity: 0.15,
              display: "block",
            }}
          >
            404
          </span>
          <span
            className="font-extrabold leading-none tracking-tighter text-[#7A1226] absolute inset-0 flex items-center justify-center"
            style={{
              fontSize: "clamp(120px, 22vw, 240px)",
              WebkitTextStroke: "2px #7A1226",
              color: "transparent",
            }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <div className="relative text-center max-w-md mt-2">
          <h1 className="text-[22px] md:text-[26px] font-semibold text-[#2B2A2A] mb-3">
            Sorry, that page could not be found
          </h1>
          <p className="text-[14px] md:text-[15px] text-[#5d667a] mb-8 leading-relaxed">
            The requested page either doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-2.5 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[14px] font-semibold transition-colors shadow-sm"
          >
            Go Back Home
          </Link>
        </div>
      </main>
    </div>
  );
}
