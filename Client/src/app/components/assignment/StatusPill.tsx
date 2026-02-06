type Status = 'not_submitted' | 'submitted' | 'late' | 'graded';

interface StatusPillProps {
  status: Status;
}

export function StatusPill({ status }: StatusPillProps) {
  const styles = {
    not_submitted: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Not Submitted'
    },
    submitted: {
      bg: 'bg-[#5A7ACD]/10',
      text: 'text-[#5A7ACD]',
      label: 'Submitted'
    },
    late: {
      bg: 'bg-[#FEB05D]/10',
      text: 'text-[#FEB05D]',
      label: 'Late'
    },
    graded: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      label: 'Graded'
    }
  };

  const style = styles[status];

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
