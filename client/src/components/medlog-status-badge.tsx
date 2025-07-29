import { Badge } from "@/components/ui/badge";
import { MedlogStatus } from "@/lib/types";

interface MedlogStatusBadgeProps {
  status: MedlogStatus;
}

const getMedlogStatusStyle = (status: MedlogStatus) => {
  switch (status) {
    case "New":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "Changed":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function MedlogStatusBadge({ status }: MedlogStatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${getMedlogStatusStyle(status)} px-2 py-1 text-xs font-medium border`}
    >
      {status}
    </Badge>
  );
}