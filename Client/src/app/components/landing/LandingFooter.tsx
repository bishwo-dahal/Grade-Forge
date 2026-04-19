import React from "react";
import { Link } from "react-router";

const FOOTER_COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "Code Submission", href: "#features" },
      { label: "Autograding", href: "#features" },
      { label: "AI Detection", href: "#features" },
      { label: "Plagiarism Check", href: "#features" },
      { label: "Grading Rubrics", href: "#features" },
    ],
  },
  {
    heading: "For Users",
    links: [
      { label: "For Students", href: "#for-students" },
      { label: "For Faculty", href: "#for-faculty" },
      { label: "For Universities", href: "#for-faculty" },
      { label: "Canvas Integration", href: "#canvas" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/docs/" },
      { label: "Getting Started", href: "/docs/" },
      { label: "API Reference", href: "/docs/" },
      { label: "Support", href: "#contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#contact" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "#contact" },
      { label: "Terms of Service", href: "#contact" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer
      id="contact"
      className="bg-white border-t border-[#c9c4c9]"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#2B2A2A] mb-4">
                {heading}
              </div>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] text-[#5d667a] hover:text-[#7A1226] transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#c9c4c9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[16px] font-bold text-[#2B2A2A] hover:text-[#7A1226] transition-colors"
          >
            Grade Forge
          </Link>
          <span className="text-[12px] text-[#5d667a]">
            © 2026. All Rights Reserved by Grade-Forge.
          </span>
        </div>
      </div>
    </footer>
  );
}
