interface StatusPillProps {
  status: "not-graded" | "auto-graded" | "manually-adjusted" | "finalized";
}

export function StatusPill({ status }: StatusPillProps) {
  const config = {
    "not-graded": {
      label: "Not Graded",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600"
    },
    "auto-graded": {
      label: "Auto Graded",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700"
    },
    "manually-adjusted": {
      label: "Manually Adjusted",
      bgColor: "bg-[#FEB05D]/20",
      textColor: "text-[#FEB05D]"
    },
    "finalized": {
      label: "Finalized",
      bgColor: "bg-green-100",
      textColor: "text-green-700"
    }
  };

  const { label, bgColor, textColor } = config[status];

  return (
    <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${bgColor} ${textColor}`}>
      {label}
    </div>
  );
}
