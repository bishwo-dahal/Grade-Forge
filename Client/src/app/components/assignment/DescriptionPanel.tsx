import { Download } from "lucide-react";
import type { AssignmentDescription } from "../../../types/assignment";

interface DescriptionPanelProps {
  // NOTE: Data is injected by the page to keep this panel presentation-only.
  description: AssignmentDescription | null;
}

export function DescriptionPanel({ description }: DescriptionPanelProps) {
  if (!description) {
    return null;
  }

  return (
    <div className="p-6 prose prose-sm max-w-none">
      {/* Assignment Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#2B2A2A] mb-4">Problem Description</h2>
        <div className="text-[14px] text-gray-700 leading-relaxed space-y-4">
          {description.problemDescription.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Required Methods</h3>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="space-y-3 text-[13px]">
            {description.requiredMethods.map((method) => (
              <div key={method.name} className="flex items-start gap-3">
                <code className="text-[#5A7ACD] font-mono bg-white px-2 py-0.5 rounded">{method.name}</code>
                <span className="text-gray-600">{method.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Example Usage</h3>
        <div className="bg-[#2B2A2A] rounded-xl p-4 overflow-x-auto">
          <pre className="text-[13px] text-gray-100 font-mono leading-relaxed">
{description.exampleCode}
          </pre>
        </div>
      </div>

      {/* Input/Output Specifications */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Input/Output Format</h3>
        <div className="text-[14px] text-gray-700 space-y-3">
          <div>
            <strong className="text-[#2B2A2A]">Input:</strong>
            <p className="mt-1">{description.inputOutput.input}</p>
          </div>
          <div>
            <strong className="text-[#2B2A2A]">Output:</strong>
            <p className="mt-1">{description.inputOutput.output}</p>
          </div>
        </div>
      </div>

      {/* Starter Code */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Starter Code</h3>
        <p className="text-[14px] text-gray-600 mb-3">
          Download the starter code template to begin your implementation:
        </p>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2B2A2A] rounded-lg transition-colors text-[13px] font-medium">
          <Download className="w-4 h-4" strokeWidth={2} />
          Download Starter Code
        </button>
      </div>

      {/* CLEANUP: Rubric details live in dedicated Grading Rubric tab to avoid duplicate sections in Description. */}

      {/* Constraints */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Constraints</h3>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-gray-700">
          {description.constraints.map((constraint, index) => (
            <li key={index}>{constraint}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
