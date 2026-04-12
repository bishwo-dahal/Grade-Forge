import { SummaryCards } from "./SummaryCards";
import { ClassesOverview } from "./ClassesOverview";
import { AssignmentsList } from "./AssignmentsList";
import { ActivityChart } from "./ActivityChart";

export function MainContent() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-12 py-10">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-2xl text-gray-800 mb-2">
            Welcome back, Sarah
          </h1>
          <p className="text-sm text-gray-400">
            Wednesday, February 4, 2026
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Classes Overview */}
        <ClassesOverview />

        {/* Assignments & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <AssignmentsList />
          <ActivityChart />
        </div>
      </div>
    </main>
  );
}
