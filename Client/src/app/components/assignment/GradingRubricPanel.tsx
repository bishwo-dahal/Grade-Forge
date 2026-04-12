import type { RubricCategory } from "../../../types/grade";

interface GradingRubricPanelProps {
  // NOTE: Rubric categories are supplied by the page to keep this panel presentational.
  rubricCategories: RubricCategory[];
}

export function GradingRubricPanel({ rubricCategories }: GradingRubricPanelProps) {
  const totalPoints = rubricCategories.reduce((sum, cat) => sum + cat.points, 0);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[#2B2A2A] mb-1">Grading Rubric</h2>
        <p className="text-[13px] text-gray-500">
          Total: {totalPoints} points
        </p>
      </div>

      {/* Rubric Categories */}
      <div className="space-y-6">
        {rubricCategories.map((category, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className="bg-[#F5F2F2] px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[#2B2A2A]">
                  {category.name}
                </h3>
                <span className="text-[14px] font-semibold text-[#FEB05D]">
                  {category.points} pts
                </span>
              </div>
            </div>

            {/* Criteria List */}
            <div className="bg-white">
              {category.criteria.map((criterion, criterionIndex) => (
                <div
                  key={criterionIndex}
                  className={`px-4 py-3 flex items-start justify-between gap-4 ${
                    criterionIndex < category.criteria.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <p className="text-[13px] text-gray-700 leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                  <span className="text-[13px] font-medium text-gray-600 flex-shrink-0">
                    {criterion.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-[#F5F2F2] rounded-lg border border-gray-200">
        <p className="text-[13px] text-gray-600 leading-relaxed">
          <span className="font-medium text-[#2B2A2A]">Note:</span> Your submission will be
          automatically graded based on test cases. Manual review may adjust scores for code
          quality, efficiency, and documentation.
        </p>
      </div>
    </div>
  );
}
