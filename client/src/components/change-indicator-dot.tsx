import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChangeIndicatorDotProps {
  count: number;
  type: 'time' | 'other';
  onClick?: () => void;
}

export default function ChangeIndicatorDot({ count, type, onClick }: ChangeIndicatorDotProps) {
  if (count === 0) return null;
  
  const color = type === 'time' ? 'bg-red-500' : 'bg-orange-400';
  const tooltipText = `${count} change${count > 1 ? 's' : ''} made by other group`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`relative w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={onClick}
          >
            {count}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}