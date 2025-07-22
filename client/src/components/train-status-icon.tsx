import { Train } from "lucide-react";

interface TrainStatusIconProps {
  isScheduled: boolean;
}

export default function TrainStatusIcon({ isScheduled }: TrainStatusIconProps) {
  return (
    <div className="flex justify-center">
      <Train 
        className={`h-4 w-4 ${isScheduled ? 'text-green-600' : 'text-gray-400'}`}
        fill={isScheduled ? 'currentColor' : 'none'}
      />
    </div>
  );
}