import { Train } from "lucide-react";

interface TrainStatusIconProps {
  isScheduled: boolean;
  isDeliveryNotPossible?: boolean;
}

export default function TrainStatusIcon({ isScheduled, isDeliveryNotPossible = false }: TrainStatusIconProps) {
  // Logic:
  // Red: Train exists BUT delivery not possible (train date > delivery date)
  // Green: Train exists AND delivery possible
  // Gray: No train scheduled
  
  let color = 'text-gray-400'; // Default: no train
  let filled = false;
  
  if (isScheduled) {
    if (isDeliveryNotPossible) {
      color = 'text-red-600'; // Train exists but delivery impossible
      filled = true;
    } else {
      color = 'text-green-600'; // Train exists and delivery possible
      filled = true;
    }
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