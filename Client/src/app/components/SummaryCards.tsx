import { useEffect, useState } from "react";
import type { SummaryMetric } from "../../types/grade";
import { listSummaryMetrics } from "../../services/resultService";

export function SummaryCards() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [cards, setCards] = useState<SummaryMetric[]>([]);

  useEffect(() => {
    listSummaryMetrics().then(setCards);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {cards.map((card, index) => (
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
