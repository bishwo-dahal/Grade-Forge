import { Link, Navigate } from "react-router";
import { getAuthenticatedRole, getDefaultRouteForRole, isAuthenticated } from "../auth";
import React from "react";

export default function LandingPage() {
  if (isAuthenticated()) {
    // NOTE: Redirect authenticated users directly to the route allowed for their role.
    return <Navigate to={getDefaultRouteForRole(getAuthenticatedRole())} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F4F6] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-[#2B2A2A]">Grade Forge</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="/docs/"
            className="px-3 sm:px-4 py-2 text-[14px] font-medium text-[#2B2A2A] hover:text-[#7A1226] transition-colors"
          >
            Documentation
          </a>
          <Link
            to="/signin"
            className="px-3 sm:px-4 py-2 text-[14px] font-medium text-[#2B2A2A] hover:text-[#7A1226] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[14px] font-semibold transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2B2A2A] mb-4">
            AI-based code submission and grading for universities
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Master coding, build your future. Submit assignments, get instant feedback, and track your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signin"
              className="px-8 py-3 bg-[#7A1226] hover:bg-[#65101F] text-white rounded-lg text-[16px] font-semibold transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 bg-white border-2 border-[#2B2A2A] hover:bg-gray-50 text-[#2B2A2A] rounded-lg text-[16px] font-semibold transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
