import { Train } from "lucide-react";

interface TrainStatusIconProps {
  isScheduled: boolean;
  isDeliveryNotPossible?: boolean;
}

export default function TrainStatusIcon({ isScheduled, isDeliveryNotPossible = false }: TrainStatusIconProps) {
  // Red when delivery is not possible, green when scheduled, gray when not scheduled
  const color = isDeliveryNotPossible ? 'text-red-600' : (isScheduled ? 'text-green-600' : 'text-gray-400');
  const filled = isScheduled || isDeliveryNotPossible;

  return (
    <div className="flex justify-center">
      <Train 
        className={`h-4 w-4 ${color}`}
        fill={filled ? 'currentColor' : 'none'}
      />
    </div>
  );
}