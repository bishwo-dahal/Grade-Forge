import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Calendar,
  FolderOpen,
  MessageSquare,
  RefreshCw,
  Users,
  ClipboardCheck
} from "lucide-react";

interface GradeForgeSidebarProps {
  viewMode: 'student' | 'faculty';
  onViewChange: (view: 'student' | 'faculty') => void;
}

export function GradeForgeSidebar({ viewMode, onViewChange }: GradeForgeSidebarProps) {
  const studentItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "My Courses", active: false },
    { icon: FileText, label: "Assignments", active: false },
    { icon: Calendar, label: "Calendar", active: false },
  ];

  const facultyItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "My Classes", active: false },
    { icon: ClipboardCheck, label: "Grading", active: false },
    { icon: Users, label: "Students", active: false },
    { icon: Calendar, label: "Schedule", active: false },
  ];

  const resourceItems = [
    { icon: FolderOpen, label: "Materials", active: false },
    { icon: MessageSquare, label: "Discussions", active: false },
  ];

  const learningItems = viewMode === 'student' ? studentItems : facultyItems;

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#2B2A2A] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded"></div>
          </div>
          <span className="text-[15px] font-semibold text-[#2B2A2A]">Grade Forge</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {/* Learning Section */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
              {viewMode === 'student' ? 'Learning' : 'Teaching'}
            </span>
          </div>
          <ul className="space-y-1">
            {learningItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  <span className="text-[14px]">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources Section */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
              Resources
            </span>
          </div>
          <ul className="space-y-1">
            {resourceItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  <span className="text-[14px]">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* View Switcher */}
      <div className="p-4">
        <button 
          onClick={() => onViewChange(viewMode === 'student' ? 'faculty' : 'student')}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#5A7ACD]/10 hover:bg-[#5A7ACD]/20 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#5A7ACD]" strokeWidth={2} />
            </div>
            <div className="text-left">
              <div className="text-[13px] font-semibold text-[#2B2A2A]">
                {viewMode === 'student' ? 'Student View' : 'Faculty View'}
              </div>
              <div className="text-[11px] text-gray-600">
                Switch to {viewMode === 'student' ? 'Faculty' : 'Student'}
              </div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}