import { RouteStep } from "@/lib/types";

interface RouteVisualizerProps {
  currentStep: RouteStep;
}

export default function RouteVisualizer({ currentStep }: RouteVisualizerProps) {
  const steps: RouteStep[] = ['W', 'D', 'C', 'R'];
  const stepNames = {
    'W': 'Warehouse',
    'D': 'Departure',
    'C': 'Transit',
    'R': 'Return'
  };

  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center space-x-1">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <span 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              index <= currentStepIndex 
                ? (index === currentStepIndex ? 'bg-info' : 'bg-success')
                : 'bg-gray-300 text-gray-600'
            }`}
            title={stepNames[step]}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div 
              className={`w-4 h-0.5 ${
                index < currentStepIndex ? 'bg-success' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
