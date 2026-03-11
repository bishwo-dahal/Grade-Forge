type TabType = 'description' | 'tests' | 'rubric' | 'results';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasResults: boolean;
  isFacultyView?: boolean;
}

export function TabNavigation({ activeTab, onTabChange, hasResults, isFacultyView = false }: TabNavigationProps) {
  const tabs = [
    { id: 'description' as TabType, label: 'Description' },
    { id: 'tests' as TabType, label: 'Test Cases' },
    { id: 'rubric' as TabType, label: 'Grading Rubric' },
    // FIX: Faculty uses Submissions tab label and keeps tab accessible even before first submission.
    { id: 'results' as TabType, label: isFacultyView ? 'Submissions' : 'Results', disabled: isFacultyView ? false : !hasResults },
  ];

  return (
    <div className="border-b border-gray-200 px-6">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              relative py-3 text-[14px] font-medium transition-colors
              ${activeTab === tab.id 
                ? 'text-[#2B2A2A]' 
                : tab.disabled 
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-[#2B2A2A]'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B2A2A]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
