import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import type { ActivitySummary } from "../../types/grade";
import { getActivitySummary } from "../../services/resultService";

export function ActivityChart() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [summary, setSummary] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    getActivitySummary().then(setSummary);
  }, []);

  const data = summary?.data ?? [];
  const totalSubmissions = summary?.totalSubmissions ?? 0;
  const totalGraded = summary?.totalGraded ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg text-gray-800">Weekly Activity</h2>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-6 text-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#E0DBFF] rounded"></div>
            <span className="text-gray-500">Submissions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-200 rounded"></div>
            <span className="text-gray-500">Graded</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dx={-10}
            />
            <Bar 
              dataKey="submissions" 
              fill="#E0DBFF"
              radius={[8, 8, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="graded" 
              fill="#FED7AA"
              radius={[8, 8, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-gray-400 mb-1">Total Submissions</div>
              <div className="text-xl text-gray-800">{totalSubmissions}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-1">Total Graded</div>
              <div className="text-xl text-gray-800">{totalGraded}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
