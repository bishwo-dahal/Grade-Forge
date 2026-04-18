import React from "react";
import { Navigate } from "react-router";
import { getAuthenticatedRole, getDefaultRouteForRole, isAuthenticated } from "../auth";
import { LandingNav } from "./landing/LandingNav";
import { HeroSection } from "./landing/HeroSection";
import { CodeEditorSection } from "./landing/CodeEditorSection";
import { AiDetectionSection } from "./landing/AiDetectionSection";
import { CanvasSection } from "./landing/CanvasSection";
import { ForUsersSection } from "./landing/ForUsersSection";
import { FeaturesGrid } from "./landing/FeaturesGrid";
import { CtaBanner } from "./landing/CtaBanner";
import { LandingFooter } from "./landing/LandingFooter";

export default function LandingPage() {
  if (isAuthenticated()) {
    return <Navigate to={getDefaultRouteForRole(getAuthenticatedRole())} replace />;
  }

  return (
    <div
      className="min-h-screen bg-[#F5F4F6] flex flex-col overflow-x-hidden"
      style={{ fontFamily: "Montserrat, 'Segoe UI', Helvetica Neue, Arial, sans-serif" }}
    >
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <CodeEditorSection />
        <AiDetectionSection />
        <CanvasSection />
        <ForUsersSection />
        <FeaturesGrid />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
