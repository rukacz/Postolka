import React from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/status-badge";
import RouteVisualizer from "@/components/route-visualizer";
import { BLStatus, RouteStep, UserGroup } from "@/lib/types";

interface ContainerBlockProps {
  container: Container;
  userGroup: UserGroup;
  onNoteChange: (containerId: number, group: 'carrier' | 'medlog', note: string) => void;
  onSelectChange?: (containerId: number, selected: boolean) => void;
  isSelected?: boolean;
}

const ContainerBlock = ({
  container,
  userGroup,
  onNoteChange,
  onSelectChange,
  isSelected = false,
}: ContainerBlockProps) => {
  const isCarrier = userGroup === "carrier";
  const isMedlog = userGroup === "medlog";

  const isLong = (text: string) => text.length > 80 || text.includes("\n");

  const handleNoteChange = (group: 'carrier' | 'medlog', value: string) => {
    onNoteChange(container.id, group, value);
  };

  const handleFullNoteClick = (note: string) => {
    // Simple alert for now - could be enhanced with a modal later
    alert(note);
  };

  // Check if this container is newly added
  const isNewContainer = container.isNewContainer;

  return (
    <div className={`border border-gray-300 bg-gray-50 rounded-lg px-4 py-3 mb-4 shadow-md ${
      isNewContainer ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : ''
    }`}>
      {/* Main container info row */}
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange?.(container.id, checked as boolean)}
          />
          <span className="font-semibold">{container.jobNumber}</span>
        </div>
        
        <div className="flex items-center gap-6 flex-1 justify-between ml-4">
          <div className={`font-mono text-sm ${container.changedFields?.includes('containerNumber') ? 'bg-yellow-100 px-2 py-1 rounded border-l-2 border-yellow-400' : ''}`}>
            {container.containerNumber}
          </div>
          <div className={`text-sm ${container.changedFields?.includes('sizeType') ? 'bg-yellow-100 px-2 py-1 rounded border-l-2 border-yellow-400' : ''}`}>
            {container.size}/{container.containerType}
          </div>
          <div className={`text-sm ${container.changedFields?.includes('dateTime') ? 'bg-yellow-100 px-2 py-1 rounded border-l-2 border-yellow-400' : ''}`}>
            {container.dateTime ? new Date(container.dateTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <RouteVisualizer currentStep={container.routeStep as RouteStep} />
          </div>
          <div className={`${container.changedFields?.includes('status') ? 'bg-yellow-100 px-2 py-1 rounded border-l-2 border-yellow-400' : ''}`}>
            <StatusBadge status={container.status as BLStatus} />
          </div>
          <div className={`text-sm max-w-32 truncate ${container.changedFields?.includes('unloadAddress') ? 'bg-yellow-100 px-2 py-1 rounded border-l-2 border-yellow-400' : ''}`} title={container.unloadAddress || 'N/A'}>
            {container.unloadAddress || 'N/A'}
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="flex gap-4 mt-3">
        {/* Carrier Note */}
        <div className="flex items-center w-1/2 gap-2">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Carrier:</label>
          <div className="relative flex-1">
            <Input
              type="text"
              className={`text-sm ${
                !isCarrier ? "bg-gray-100 text-gray-600" : ""
              }`}
              value={container.carrierNote || ""}
              onChange={(e) => handleNoteChange('carrier', e.target.value)}
              readOnly={!isCarrier}
              placeholder="Note"
            />
            {isLong(container.carrierNote || "") && (
              <span
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 cursor-pointer hover:text-red-700"
                title="Note is longer than one line - click to view full note"
                onClick={() => handleFullNoteClick(container.carrierNote || "")}
              >
                ↘️
              </span>
            )}
          </div>
        </div>

        {/* Medlog Note */}
        <div className="flex items-center w-1/2 gap-2">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Medlog:</label>
          <div className="relative flex-1">
            <Input
              type="text"
              className={`text-sm ${
                !isMedlog ? "bg-gray-100 text-gray-600" : ""
              }`}
              value={container.medlogNote || ""}
              onChange={(e) => handleNoteChange('medlog', e.target.value)}
              readOnly={!isMedlog}
              placeholder="Note"
            />
            {isLong(container.medlogNote || "") && (
              <span
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 cursor-pointer hover:text-red-700"
                title="Note is longer than one line - click to view full note"
                onClick={() => handleFullNoteClick(container.medlogNote || "")}
              >
                ↘️
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerBlock;