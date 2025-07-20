import { Priority } from "@/lib/types";

interface PriorityIndicatorProps {
  priority: Priority;
}

export default function PriorityIndicator({ priority }: PriorityIndicatorProps) {
  const getIndicator = () => {
    switch (priority) {
      case 'high':
        return <span className="text-error text-lg">🔴</span>;
      case 'medium':
        return <span className="text-warning text-lg">🟡</span>;
      case 'low':
        return <span className="text-success text-lg">🟢</span>;
      default:
        return <span className="text-neutral text-lg">⚪</span>;
    }
  };

  return getIndicator();
}
