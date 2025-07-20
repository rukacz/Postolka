import { Badge } from "@/components/ui/badge";
import { BLStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: BLStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'Delivered':
      case 'Confirmed':
        return "bg-success text-white";
      case 'In Progress':
        return "bg-info text-white";
      case 'Attention Required':
        return "bg-warning text-white";
      case 'Issues':
        return "bg-error text-white";
      case 'Draft':
        return "bg-neutral text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Badge className={`${getStatusStyle()} text-xs font-medium ${className}`}>
      {status}
    </Badge>
  );
}
