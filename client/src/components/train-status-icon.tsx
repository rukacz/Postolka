import { Train } from "lucide-react";

interface TrainStatusIconProps {
  isScheduled: boolean;
  isDeliveryNotPossible?: boolean;
}

export default function TrainStatusIcon({ isScheduled, isDeliveryNotPossible = false }: TrainStatusIconProps) {
  // Logic:
  // Red: Any container has deliveryNotPossible=true (priority over green)
  // Green: Any container has train data filled
  // Gray: No train scheduled and no delivery issues
  
  let color = 'text-gray-400'; // Default: no train
  let filled = false;
  
  // Red has priority - if any container has delivery issues, show red
  if (isDeliveryNotPossible) {
    color = 'text-red-600';
    filled = true;
  } else if (isScheduled) {
    // Green: if any container has train data and no delivery issues
    color = 'text-green-600';
    filled = true;
  }

  return (
    <div className="flex justify-center">
      <Train 
        className={`h-4 w-4 ${color}`}
        fill={filled ? 'currentColor' : 'none'}
      />
    </div>
  );
}