import { Download } from "lucide-react";
import type { AssignmentDescription } from "../../../types/assignment";

interface DescriptionPanelProps {
  // NOTE: Data is injected by the page to keep this panel presentation-only.
  description: AssignmentDescription | null;
  starterCodeFiles?: Array<{ fileName: string; downloadUrl: string }>;
  starterCodeUrl?: string | null;
}

export function DescriptionPanel({
  description,
  starterCodeFiles,
  starterCodeUrl,
}: DescriptionPanelProps) {
  if (!description) {
    return null;
  }

  return (
    <div className="p-6 prose prose-sm max-w-none">
      {/* Assignment Description */}
      {description.problemDescription.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#2B2A2A] mb-4">Problem Description</h2>
          <div className="text-[14px] text-gray-700 leading-relaxed space-y-4">
            {description.problemDescription.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Starter Code — links come from API (presigned URLs). */}
      {(starterCodeFiles?.length ?? 0) > 0 || starterCodeUrl ? (
        <div className="mb-8">
          <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-3">Starter Code</h3>
          <p className="text-[14px] text-gray-600 mb-3">
            Download the starter files to begin your implementation:
          </p>
          <div className="flex flex-col gap-2">
            {(starterCodeFiles ?? []).map((f, idx) => (
              <a
                key={`${f.fileName}-${idx}`}
                href={f.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2B2A2A] rounded-lg transition-colors text-[13px] font-medium w-fit"
              >
                <Download className="w-4 h-4 shrink-0" strokeWidth={2} />
                {f.fileName}
              </a>
            ))}
            {starterCodeUrl && !(starterCodeFiles?.length ?? 0) ? (
              <a
                href={starterCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2B2A2A] rounded-lg transition-colors text-[13px] font-medium w-fit break-all"
              >
                <Download className="w-4 h-4 shrink-0" strokeWidth={2} />
                {starterCodeUrl}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
