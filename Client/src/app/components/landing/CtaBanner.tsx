import React from "react";
import { Link } from "react-router";
import { useFadeIn } from "./useFadeIn";

export function CtaBanner() {
  const ref = useFadeIn();

  return (
    <section
      className="bg-[#2B2A2A] py-20"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <div
        ref={ref}
        className="max-w-3xl mx-auto px-6 text-center"
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      >
        <h2 className="text-[28px] md:text-[38px] font-extrabold text-white leading-tight mb-4 tracking-tight">
          Start grading smarter today
        </h2>
        <p className="text-[15px] text-[#9d9d9d] mb-8 leading-relaxed">
          Join universities already using Grade-Forge to save time, ensure academic integrity,
          and give students the instant feedback they deserve.
        </p>
        <Link
          to="/signup"
          className="inline-block px-8 py-3.5 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[15px] font-bold transition-colors shadow-lg"
        >
          Sign up for free
        </Link>
      </div>
    </section>
  );
}
