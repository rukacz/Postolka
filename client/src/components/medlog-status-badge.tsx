import { Badge } from "@/components/ui/badge";
import { MedlogStatus } from "@/lib/types";

interface MedlogStatusBadgeProps {
  status: MedlogStatus;
}

const getMedlogStatusStyle = (status: MedlogStatus) => {
  switch (status) {
    case "New":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Documentation Ready":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Customs Cleared":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Released":
      return "bg-green-100 text-green-800 border-green-200";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "On Hold":
      return "bg-red-100 text-red-800 border-red-200";
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