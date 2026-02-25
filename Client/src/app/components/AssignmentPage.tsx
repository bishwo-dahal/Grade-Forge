import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AssignmentHeader } from "./assignment/AssignmentHeader";
import { TabNavigation } from "./assignment/TabNavigation";
import { DescriptionPanel } from "./assignment/DescriptionPanel";
import { PublicTestsPanel } from "./assignment/PublicTestsPanel";
import { GradingRubricPanel } from "./assignment/GradingRubricPanel";
import { ResultsPanel } from "./assignment/ResultsPanel";
import { CodeWorkspace } from "./assignment/CodeWorkspace";
import { ChevronLeft, GripVertical } from "lucide-react";
import type { AssignmentDescription, AssignmentDetail, EditorCodeExamples } from "../../types/assignment";
import type { PublicTestCase } from "../../types/submission";
import type { AssignmentResult, RubricCategory } from "../../types/grade";
import {
  getAssignmentDescription,
  getAssignmentDetailById,
  getEditorCodeExamples,
  listPublicTestCases,
  listRubricCategories,
} from "../../services/assignmentService";
import { getAssignmentResult } from "../../services/resultService";
import React from "react";

type TabType = 'description' | 'tests' | 'rubric' | 'results';

export function AssignmentPage() {
  const { assignmentId } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // NOTE: Load all assignment-related data here so child panels remain presentation-only.
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [description, setDescription] = useState<AssignmentDescription | null>(null);
  const [publicTests, setPublicTests] = useState<PublicTestCase[]>([]);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [results, setResults] = useState<AssignmentResult | null>(null);
  const [editorCodeExamples, setEditorCodeExamples] = useState<EditorCodeExamples>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolvedId = assignmentId || "1";
    setErrorMessage(null);
    setIsLoading(true);
    // NOTE: Keep data loading centralized in page container so assignment panels remain presentation-only.
    Promise.all([
      getAssignmentDetailById(resolvedId),
      getAssignmentDescription(resolvedId),
      listPublicTestCases(resolvedId),
      listRubricCategories(resolvedId),
      getAssignmentResult(resolvedId),
      getEditorCodeExamples(resolvedId),
    ])
      .then(([assignmentData, descriptionData, publicTestsData, rubricData, resultsData, codeExamplesData]) => {
        setAssignment(assignmentData);
        setDescription(descriptionData);
        setPublicTests(publicTestsData);
        setRubricCategories(rubricData);
        setResults(resultsData);
        setEditorCodeExamples(codeExamplesData);
        // FIX: Results tab now reflects whether at least one real submission exists for this assignment.
        setHasSubmitted(assignmentData.submissionsUsed > 0);
      })
      .catch(() => {
        setErrorMessage("Unable to load assignment data.");
      })
      .finally(() => setIsLoading(false));
  }, [assignmentId]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#F5F2F2]">
        {/* NOTE: Skeleton shell keeps assignment workspace visible while backend data initializes. */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-1 overflow-hidden gap-1 p-0">
          <div className="w-[35%] min-w-[320px] bg-white border-r border-gray-200 p-4 animate-pulse">
            <div className="h-7 w-52 rounded bg-gray-200 mb-4" />
            <div className="h-10 w-full rounded bg-gray-100 mb-4" />
            <div className="space-y-3">
              <div className="h-24 w-full rounded bg-gray-100" />
              <div className="h-24 w-full rounded bg-gray-100" />
              <div className="h-24 w-full rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex-1 p-4 animate-pulse">
            <div className="h-full w-full rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    if (errorMessage) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-[#C23A42]">
          {errorMessage}
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-gray-600">
        Assignment not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F2F2]">
      {/* Top Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/dashboard" className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/dashboard" className="text-gray-500 hover:text-[#2B2A2A]">{assignment.courseCode}</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B2A2A] font-medium">Assignments</span>
        </div>
      </div>

      {/* Main Content Area - Two Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Assignment Content */}
          <Panel defaultSize={35} minSize={30}>
            <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
              {/* Assignment Header */}
              <AssignmentHeader assignment={assignment} />

              {/* Tab Navigation */}
              <TabNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                hasResults={hasSubmitted}
              />

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'description' && <DescriptionPanel description={description} />}
                {activeTab === 'tests' && <PublicTestsPanel testCases={publicTests} />}
                {activeTab === 'rubric' && <GradingRubricPanel rubricCategories={rubricCategories} />}
                {activeTab === 'results' && <ResultsPanel results={results} />}
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="hidden lg:block w-1 bg-gray-200 hover:bg-[#5A7ACD] transition-colors relative group">
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-12 bg-gray-300 group-hover:bg-[#5A7ACD] rounded-full flex items-center justify-center transition-colors">
                <GripVertical className="w-3 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </PanelResizeHandle>

          {/* Right Panel - Code Workspace */}
          <Panel defaultSize={65} minSize={40}>
            <CodeWorkspace
              assignmentId={assignmentId ?? assignment.id}
              assignment={assignment}
              codeExamples={editorCodeExamples}
              onRunTests={() => console.log("Run tests")}
              onSubmit={() => setHasSubmitted(true)}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
