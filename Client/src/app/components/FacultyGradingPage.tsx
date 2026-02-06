import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GradingHeader } from "./grading/GradingHeader";
import { GradingRightPanel } from "./grading/GradingRightPanel";
import { GradingLeftPanel } from "./grading/GradingLeftPanel";
import { FinalizeModal } from "./grading/FinalizeModal";
import type { GradingAssignmentContext } from "../../types/assignment";
import type { SubmissionDetail, SubmissionSummary } from "../../types/submission";
import { getGradingAssignmentContext } from "../../services/assignmentService";
import { getSubmissionDetailById, listSubmissionsForAssignment } from "../../services/submissionService";

export default function FacultyGradingPage() {
  const { assignmentId, submissionId } = useParams();
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(submissionId || "sub-001");
  // NOTE: Grading data now comes from mock services to keep backend seams centralized.
  const [assignment, setAssignment] = useState<GradingAssignmentContext | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionSummary[]>([]);

  useEffect(() => {
    if (submissionId) {
      setSelectedSubmissionId(submissionId);
    }
  }, [submissionId]);

  useEffect(() => {
    const resolvedAssignmentId = assignmentId || "assignment-8";
    getGradingAssignmentContext(resolvedAssignmentId).then(setAssignment);
    listSubmissionsForAssignment(resolvedAssignmentId).then(setAllSubmissions);
  }, [assignmentId]);

  useEffect(() => {
    const resolvedSubmissionId = selectedSubmissionId || "sub-001";
    getSubmissionDetailById(resolvedSubmissionId).then(setSubmission);
  }, [selectedSubmissionId]);

  const handleFinalizeGrade = () => {
    setShowFinalizeModal(true);
  };

  const handleSaveDraft = () => {
    // Save draft logic
    console.log("Draft saved");
  };

  const handleRerunTests = () => {
    // Rerun tests logic
    console.log("Rerunning tests");
  };

  const confirmFinalize = () => {
    setShowFinalizeModal(false);
    // Finalize logic - update submission status to 'finalized'
    console.log("Grade finalized");
  };

  if (!assignment || !submission) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F2F2]">
      {/* Sticky Header */}
      <GradingHeader
        assignment={assignment}
        submission={submission}
        allSubmissions={allSubmissions}
        selectedSubmissionId={selectedSubmissionId}
        onSubmissionChange={setSelectedSubmissionId}
        onFinalizeGrade={handleFinalizeGrade}
        onSaveDraft={handleSaveDraft}
        onRerunTests={handleRerunTests}
      />

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Right Panel - Submission Context */}
          <Panel defaultSize={35} minSize={25}>
            <GradingRightPanel submission={submission} />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-[#5A7ACD] transition-colors" />

          {/* Left Panel - Code Viewer */}
          <Panel defaultSize={65} minSize={40}>
            <GradingLeftPanel submission={submission} />
          </Panel>
        </PanelGroup>
      </div>

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <FinalizeModal
          submission={submission}
          onConfirm={confirmFinalize}
          onCancel={() => setShowFinalizeModal(false)}
        />
      )}
    </div>
  );
}
