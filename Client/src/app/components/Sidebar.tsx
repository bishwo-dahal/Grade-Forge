import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  Users, 
  Settings,
  Bell
} from "lucide-react";

export function Sidebar() {
  const navigationGroups = [
    {
      title: "MAIN",
      items: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BookOpen, label: "My Classes", active: false },
        { icon: FileText, label: "Assignments", active: false },
        { icon: Calendar, label: "Calendar", active: false },
      ]
    },
    {
      title: "COMMUNITY",
      items: [
        { icon: Users, label: "Faculty", active: false },
        { icon: Bell, label: "Notifications", active: false },
      ]
    },
    {
      title: "SETTINGS",
      items: [
        { icon: Settings, label: "Preferences", active: false },
      ]
    }
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex-shrink-0 py-8 px-4">
      {/* Logo Area */}
      <div className="mb-12 px-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E0DBFF] rounded-lg flex items-center justify-center">
            <span className="text-[#5B4FCF] text-sm">AG</span>
          </div>
          <span className="text-sm text-gray-800">AutoGrade</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="space-y-8">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-3">
              <span className="text-[10px] tracking-wider text-gray-400">
                {group.title}
              </span>
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? "bg-[#E0DBFF] bg-opacity-40 text-gray-800"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-[13px]">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
