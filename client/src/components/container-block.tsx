import React, { useState, useEffect } from "react";
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

  // Local state for notes to avoid constant API calls
  const [carrierNote, setCarrierNote] = useState(container.carrierNote || "");
  const [medlogNote, setMedlogNote] = useState(container.medlogNote || "");

  // Update local state when container data changes
  useEffect(() => {
    setCarrierNote(container.carrierNote || "");
    setMedlogNote(container.medlogNote || "");
  }, [container.carrierNote, container.medlogNote]);

  // Debounced save for carrier note
  useEffect(() => {
    if (carrierNote !== (container.carrierNote || "")) {
      const timer = setTimeout(() => {
        onNoteChange(container.id, 'carrier', carrierNote);
      }, 1000); // Wait 1 second after user stops typing
      return () => clearTimeout(timer);
    }
  }, [carrierNote, container.carrierNote, container.id, onNoteChange]);

  // Debounced save for medlog note
  useEffect(() => {
    if (medlogNote !== (container.medlogNote || "")) {
      const timer = setTimeout(() => {
        onNoteChange(container.id, 'medlog', medlogNote);
      }, 1000); // Wait 1 second after user stops typing
      return () => clearTimeout(timer);
    }
  }, [medlogNote, container.medlogNote, container.id, onNoteChange]);

  // Check if this container is newly added
  const isNewContainer = container.isNewContainer;

  return (
    <div className={`border border-gray-300 bg-gray-50 rounded-lg px-4 py-3 mb-4 shadow-lg ${
      isNewContainer ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : ''
    }`}>
      {/* First row - Container details */}
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
          <div>
            <CarrierStatusBadge status={container.carrierStatus as CarrierStatus} />
          </div>
          <div>
            <MedlogStatusBadge status={container.medlogStatus as MedlogStatus} />
          </div>
          <div className="text-sm font-mono">
            {container.trainName || '-'}
          </div>
          <div className="text-sm">
            {container.trainEtd || '-'}
          </div>
        </div>
      </div>

      {/* Second row - Notes */}
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
              value={carrierNote}
              onChange={(e) => setCarrierNote(e.target.value)}
              readOnly={!isCarrier}
              placeholder="Note"
            />
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
              value={medlogNote}
              onChange={(e) => setMedlogNote(e.target.value)}
              readOnly={!isMedlog}
              placeholder="Note"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerBlock;