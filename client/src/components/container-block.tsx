import React from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/status-badge";
import RouteVisualizer from "@/components/route-visualizer";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import { BLStatus, RouteStep, UserGroup, CarrierStatus, MedlogStatus } from "@/lib/types";

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
    <tr className={`${isNewContainer ? 'bg-yellow-50' : 'bg-white'} hover:bg-gray-50`}>
      {/* Checkbox */}
      <td className="border border-gray-300 px-2 py-1 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(container.id, checked as boolean)}
        />
      </td>
      
      {/* Job Number */}
      <td className="border border-gray-300 px-2 py-1 text-xs font-semibold">
        {container.jobNumber}
      </td>
      
      {/* Container Number */}
      <td className={`border border-gray-300 px-2 py-1 text-xs font-mono ${
        container.changedFields?.includes('containerNumber') ? 'bg-yellow-100' : ''
      }`}>
        {container.containerNumber}
      </td>
      
      {/* Size/Type */}
      <td className={`border border-gray-300 px-2 py-1 text-xs ${
        container.changedFields?.includes('sizeType') ? 'bg-yellow-100' : ''
      }`}>
        {container.size}/{container.containerType}
      </td>
      
      {/* Date/Time */}
      <td className={`border border-gray-300 px-2 py-1 text-xs ${
        container.changedFields?.includes('dateTime') ? 'bg-yellow-100' : ''
      }`}>
        {container.dateTime ? new Date(container.dateTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'N/A'}
      </td>
      
      {/* Route */}
      <td className="border border-gray-300 px-2 py-1 text-center">
        <RouteVisualizer currentStep={container.routeStep as RouteStep} />
      </td>
      
      {/* Status */}
      <td className={`border border-gray-300 px-2 py-1 ${
        container.changedFields?.includes('status') ? 'bg-yellow-100' : ''
      }`}>
        <StatusBadge status={container.status as BLStatus} />
      </td>
      
      {/* Carrier Status */}
      <td className="border border-gray-300 px-2 py-1">
        <CarrierStatusBadge status={container.carrierStatus as CarrierStatus} />
      </td>
      
      {/* Medlog Status */}
      <td className="border border-gray-300 px-2 py-1">
        <MedlogStatusBadge status={container.medlogStatus as MedlogStatus} />
      </td>
      
      {/* Train Name */}
      <td className="border border-gray-300 px-2 py-1 text-xs font-mono">
        {container.trainName || '-'}
      </td>
      
      {/* Train ETD */}
      <td className="border border-gray-300 px-2 py-1 text-xs">
        {container.trainEtd || '-'}
      </td>
      
      {/* Notes */}
      <td className="border border-gray-300 px-2 py-1 min-w-48">
        <div className="space-y-1">
          <Input
            value={container.carrierNote || ""}
            onChange={(e) => handleNoteChange('carrier', e.target.value)}
            placeholder="Carrier note..."
            className="text-xs h-6"
            disabled={!isCarrier}
          />
          <Input
            value={container.medlogNote || ""}
            onChange={(e) => handleNoteChange('medlog', e.target.value)}
            placeholder="Medlog note..."
            className="text-xs h-6"
            disabled={!isMedlog}
          />
        </div>
      </td>
    </tr>
  );
};

export default ContainerBlock;