import { useState } from "react";
import { OverviewTab } from "./OverviewTab";
import { RubricTab } from "./RubricTab";
import { TestsTab } from "./TestsTab";
import { FeedbackTab } from "./FeedbackTab";

interface GradingRightPanelProps {
  submission: any;
}

export function GradingRightPanel({ submission }: GradingRightPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "rubric" | "tests" | "feedback">("overview");

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 px-4 bg-white">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 text-[12px] font-medium transition-colors relative ${
            activeTab === "overview"
              ? "text-[#5A7ACD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
          {activeTab === "overview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A7ACD]"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("rubric")}
          className={`px-4 py-3 text-[12px] font-medium transition-colors relative ${
            activeTab === "rubric"
              ? "text-[#5A7ACD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Rubric
          {activeTab === "rubric" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A7ACD]"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("tests")}
          className={`px-4 py-3 text-[12px] font-medium transition-colors relative ${
            activeTab === "tests"
              ? "text-[#5A7ACD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tests
          {activeTab === "tests" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A7ACD]"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-3 text-[12px] font-medium transition-colors relative ${
            activeTab === "feedback"
              ? "text-[#5A7ACD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Feedback
          {activeTab === "feedback" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A7ACD]"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab submission={submission} />}
        {activeTab === "rubric" && <RubricTab submission={submission} />}
        {activeTab === "tests" && <TestsTab submission={submission} />}
        {activeTab === "feedback" && <FeedbackTab submission={submission} />}
      </div>
    </div>
  );
}
