import { Badge } from "@/components/ui/badge";
import { CarrierStatus } from "@/lib/types";

interface CarrierStatusBadgeProps {
  status: CarrierStatus;
}

const getCarrierStatusStyle = (status: CarrierStatus) => {
  switch (status) {
    case "Pre-Order":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "MIPS Send":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "Do Not Release":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function CarrierStatusBadge({ status }: CarrierStatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${getCarrierStatusStyle(status)} px-2 py-1 text-xs font-medium border`}
    >
      {status}
    </Badge>
  );
}