import { useState } from "react";
import { Eye, Edit3 } from "lucide-react";

interface FeedbackTabProps {
  submission: any;
}

export function FeedbackTab({ submission }: FeedbackTabProps) {
  const [feedback, setFeedback] = useState(submission.instructorFeedback || "");
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-2 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Instructor Feedback
        </h3>
        <p className="text-[11px] text-gray-600">
          This feedback will be visible to the student after you finalize the grade.
        </p>
      </div>

      {/* Toggle Preview/Edit */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setIsPreview(false)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
            !isPreview
              ? "bg-[#5A7ACD] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Edit3 className="w-3 h-3 inline mr-1" strokeWidth={2} />
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
            isPreview
              ? "bg-[#5A7ACD] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Eye className="w-3 h-3 inline mr-1" strokeWidth={2} />
          Preview
        </button>
      </div>

      {/* Content */}
      {!isPreview ? (
        <div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide detailed feedback to the student about their submission...

You can include:
• Strengths of their solution
• Areas for improvement
• Specific code suggestions
• Next steps for learning"
            rows={16}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-[#2B2A2A] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] resize-none font-mono"
          />
          <div className="mt-2 text-[10px] text-gray-500">
            Supports plain text. Markdown support coming soon.
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-5 min-h-[400px]">
          {feedback ? (
            <div className="text-[13px] text-[#2B2A2A] leading-relaxed whitespace-pre-wrap">
              {feedback}
            </div>
          ) : (
            <div className="text-[13px] text-gray-400 italic">
              No feedback provided yet. Switch to Edit mode to add feedback.
            </div>
          )}
        </div>
      )}

      {/* Inline Comments Summary (Future Feature) */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-[12px] font-semibold text-[#2B2A2A] mb-2">
          Inline Code Comments
        </h4>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-[11px] text-gray-500 italic">
            Inline code commenting feature coming soon. You'll be able to add comments
            directly to specific lines in the code viewer.
          </p>
        </div>
      </div>
    </div>
  );
}
