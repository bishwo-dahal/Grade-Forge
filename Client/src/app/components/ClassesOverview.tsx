import { useEffect, useState } from "react";
import { User, FileText, CheckCircle2 } from "lucide-react";
import type { ClassOverviewItem } from "../../types/class";
import { listClassesOverview } from "../../services/classService";

export function ClassesOverview() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [classes, setClasses] = useState<ClassOverviewItem[]>([]);

  useEffect(() => {
    listClassesOverview().then(setClasses);
  }, []);

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-lg text-gray-800">Your Classes</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${cls.color} bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm ${cls.color.replace('bg-', 'text-')}`}>
                  {cls.code.split(' ')[1]}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <h3 className="text-[15px] text-gray-800 mb-1">
                    {cls.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-gray-400">
                    <User className="w-3 h-3" strokeWidth={1.5} />
                    <span>{cls.instructor}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-[12px]">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{cls.assignments} assignments</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{cls.completed} completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
