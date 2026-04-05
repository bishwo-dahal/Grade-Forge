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
    <aside className="w-56 bg-[#7A1226] border-r border-[#65101F] flex-shrink-0 flex flex-col">
      {/* Logo Area */}
      <div className="h-[76px] border-b border-[#65101F] bg-white px-6 flex items-center">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Grade Forge" className="h-8 w-8 flex-shrink-0 rounded-[10px]" />
          <span className="text-[15px] font-semibold text-[#1F2430] whitespace-nowrap">Grade Forge</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 pt-4 space-y-8">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-3">
              <span className="text-[10px] tracking-wider text-[#D8B7BE]">
                {group.title}
              </span>
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                        : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]"
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
