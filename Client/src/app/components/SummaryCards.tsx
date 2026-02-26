import { useEffect, useState } from "react";
import type { SummaryMetric } from "../../types/grade";
import { listSummaryMetrics } from "../../services/resultService";

export function SummaryCards() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [cards, setCards] = useState<SummaryMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOTE: Keep summary-card placeholders visible to avoid blank space during initial data load.
    setIsLoading(true);
    listSummaryMetrics()
      .then(setCards)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`summary-card-skeleton-${index}`}
              // NOTE: Skeleton cards mirror metric-card size and spacing while summary values load.
              className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse"
            >
              <div className="mb-4 h-10 w-10 rounded-xl bg-[#EEF2FA]" />
              <div className="h-8 w-24 rounded bg-gray-200 mb-2" />
              <div className="h-4 w-28 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
          ))
        : null}
      {!isLoading &&
        cards.map((card, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={1.5} />
              </div>
            </div>
            <div className="text-3xl text-gray-800 mb-1">{card.value}</div>
            <div className="text-[13px] text-gray-800 mb-1">{card.title}</div>
            <div className="text-[11px] text-gray-400">{card.subtitle}</div>
          </div>
        ))}
    </div>
  );
}
