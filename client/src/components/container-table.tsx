import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, Undo2, Scale, ChevronRight } from "lucide-react";
import DangerousGoodsFlag from "@/components/dangerous-goods-flag";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import BulkNoteModal from "@/components/bulk-note-modal";
import { UserGroup } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ContainerTableProps {
  containers: Container[];
  userGroup: UserGroup;
  blDetail?: { jobType: 'Import' | 'Export'; toLocation?: string } | null;
  onNoteChange: (containerId: number, group: 'carrier' | 'medlog', note: string) => void;
  onHazardousChange: (containerIds: number[], hazardous: boolean) => void;
}

const sizeTypeOptions = [
  "20DV", "40DV", "40HC", "20RE", "40HR", "20OT", "40OT", "45DV", "45HC", "20FT", "40FT"
];

const carrierStatusOptions = [
  "Pre-Order", "MIPS Send", "Cancelled", "Do Not Release"
];

const medlogStatusOptions = [
  "New", "Approved", "Rejected", "Changed"
];

// Container number validation function
const validateContainerNumber = (containerNumber: string): boolean => {
  const regex = /^[A-Z]{4}[0-9]{7}$/;
  return regex.test(containerNumber);
};

const ContainerTable = ({ containers, userGroup, blDetail, onNoteChange, onHazardousChange }: ContainerTableProps) => {
  const [selectedContainers, setSelectedContainers] = useState<number[]>([]);
  const [showBulkNoteModal, setShowBulkNoteModal] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const [editingFields, setEditingFields] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkHazardousMutation = useMutation({
    mutationFn: async ({ containerIds, hazardous }: { containerIds: number[]; hazardous: boolean }) => {
      return apiRequest("PATCH", "/api/containers/bulk/hazardous", { containerIds, hazardous });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/containers'] });
    },
  });

  const updateContainerMutation = useMutation({
    mutationFn: async ({ containerId, field, value }: { containerId: number; field: string; value: any }) => {
      return apiRequest("PATCH", `/api/containers/${containerId}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/containers'] });
    },
  });

  const isCarrier = userGroup === "carrier";
  const isMedlog = userGroup === "medlog";

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContainers(containers.map(c => c.id));
    } else {
      setSelectedContainers([]);
    }
  };

  const handleSelectContainer = (containerId: number, checked: boolean) => {
    if (checked) {
      setSelectedContainers(prev => [...prev, containerId]);
    } else {
      setSelectedContainers(prev => prev.filter(id => id !== containerId));
    }
  };

  const handleBulkHazardous = (hazardous: boolean) => {
    const previousStates = selectedContainers.map(id => ({
      id,
      hazardous: containers.find(c => c.id === id)?.dangerousCargo || false
    }));

    setLastAction({
      type: 'hazardous',
      data: { containerIds: selectedContainers, previousStates }
    });

    bulkHazardousMutation.mutate({ containerIds: selectedContainers, hazardous });
    
    toast({
      title: `Containers ${hazardous ? 'marked' : 'unmarked'} as hazardous`,
      description: `${selectedContainers.length} containers updated`,
      action: (
        <Button variant="outline" size="sm" onClick={handleUndo}>
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const handleBulkNote = (note: string) => {
    const noteType = isMedlog ? 'medlog' : 'carrier';
    const previousNotes = selectedContainers.map(id => {
      const container = containers.find(c => c.id === id);
      return {
        id,
        note: noteType === 'medlog' ? container?.medlogNote : container?.carrierNote
      };
    });

    setLastAction({
      type: 'note',
      data: { containerIds: selectedContainers, previousNotes, noteType }
    });

    selectedContainers.forEach(id => {
      onNoteChange(id, noteType, note);
    });

    toast({
      title: "Notes added to selected containers",
      description: `${selectedContainers.length} containers updated`,
      action: (
        <Button variant="outline" size="sm" onClick={handleUndo}>
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>
      ),
    });

    setShowBulkNoteModal(false);
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'hazardous') {
      lastAction.data.previousStates.forEach(({ id, hazardous }: any) => {
        onHazardousChange([id], hazardous);
      });
    } else if (lastAction.type === 'note') {
      lastAction.data.previousNotes.forEach(({ id, note }: any) => {
        onNoteChange(id, lastAction.data.noteType, note || '');
      });
    }

    setLastAction(null);
    toast({
      title: "Action undone",
      description: "Changes have been reverted",
    });
  };

  const handleFieldUpdate = (containerId: number, field: string, value: any) => {
    updateContainerMutation.mutate({ containerId, field, value });
  };

  const formatRouteSteps = (routeStep: string) => {
    const steps = routeStep.split('');
    return steps.join(' ');
  };

  const hasSelectedContainers = selectedContainers.length > 0;
  const allSelected = selectedContainers.length === containers.length && containers.length > 0;

  return (
    <div className="space-y-4">
      {/* Bulk Editing Controls */}
      {hasSelectedContainers && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedContainers.length} container(s) selected - Bulk Edit
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkNoteModal(true)}
                className="h-8"
              >
                <FileText className="w-4 h-4 mr-1" />
                Add Note to Selected
              </Button>
            </div>
          </div>
          
          {/* Bulk Edit Controls Row - Aligned with Table Columns */}
          <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "3rem 3rem minmax(120px, 1fr) 80px 80px 100px 100px 100px 100px 100px 60px" }}>
            {/* Empty space for checkbox column */}
            <div></div>
            
            {/* DG Column */}
            <div className="flex justify-center">
              <Switch
                onCheckedChange={(checked) => handleBulkHazardous(checked)}
                className="scale-75"
              />
            </div>

            {/* Container # Column */}
            <div>
              <Input
                placeholder="ABCD1234567"
                maxLength={11}
                className="h-7 text-xs font-mono"
                onBlur={(e) => {
                  if (e.target.value && validateContainerNumber(e.target.value)) {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'containerNumber', e.target.value.toUpperCase()));
                    e.target.value = '';
                  }
                }}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>

            {/* Size/Type Column */}
            <div>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'size', value))}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {sizeTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route Column (no edit) */}
            <div></div>

            {/* Date/Time Column */}
            <div>
              <Input
                type="datetime-local"
                className="h-7 text-xs"
                onChange={(e) => {
                  if (e.target.value) {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'dateTime', e.target.value));
                  }
                }}
              />
            </div>

            {/* Destination Column */}
            <div>
              <Input
                placeholder={blDetail?.toLocation || "Destination"}
                className="h-7 text-xs"
                onBlur={(e) => {
                  if (e.target.value) {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'destination', e.target.value));
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Customs Clearance (Import) or Weight (Export) Column */}
            <div>
              {blDetail?.jobType === 'Import' && (
                <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'customsClearance', value))}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Customs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Melnik">Melnik</SelectItem>
                    <SelectItem value="Mosnov">Mosnov</SelectItem>
                    <SelectItem value="Obrnice">Obrnice</SelectItem>
                    <SelectItem value="Bratislava">Bratislava</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {blDetail?.jobType === 'Export' && (
                <Switch
                  onCheckedChange={(checked) => selectedContainers.forEach(id => handleFieldUpdate(id, 'weighingRequested', checked))}
                  className="scale-75"
                />
              )}
            </div>

            {/* Carrier Status Column */}
            <div>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'carrierStatus', value))}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carrierStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medlog Status Column */}
            <div>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'medlogStatus', value))}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Medlog" />
                </SelectTrigger>
                <SelectContent>
                  {medlogStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes Column */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkNoteModal(true)}
                className="h-7 px-2 text-xs w-full"
              >
                📝
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Container Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-12">DG</TableHead>
            <TableHead>Container #</TableHead>
            <TableHead>Size/Type</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Date/Time</TableHead>
            <TableHead>Destination</TableHead>
            {blDetail?.jobType === 'Import' && <TableHead>Customs Clearance</TableHead>}
            {blDetail?.jobType === 'Export' && <TableHead>Weight</TableHead>}
            <TableHead>Carrier Status</TableHead>
            <TableHead>Medlog Status</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((container) => (
            <TableRow key={container.id}>
              <TableCell>
                <Checkbox
                  checked={selectedContainers.includes(container.id)}
                  onCheckedChange={(checked) => handleSelectContainer(container.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                {container.dangerousCargo && <DangerousGoodsFlag />}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {container.containerNumber}
              </TableCell>
              <TableCell>
                {container.size}/{container.containerType}
              </TableCell>
              <TableCell className="text-gray-500">
                <span className="font-mono text-sm">
                  {formatRouteSteps(container.routeStep)}
                </span>
              </TableCell>
              <TableCell>
                {container.dateTime ? new Date(container.dateTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
              </TableCell>
              <TableCell>
                {container.destination || blDetail?.toLocation || '-'}
              </TableCell>
              {blDetail?.jobType === 'Import' && (
                <TableCell>
                  {container.customsClearance || blDetail?.toLocation || '-'}
                </TableCell>
              )}
              {blDetail?.jobType === 'Export' && (
                <TableCell>
                  {container.weighingRequested && (
                    <Scale className="w-4 h-4 text-gray-600" />
                  )}
                </TableCell>
              )}
              <TableCell>
                <CarrierStatusBadge status={container.carrierStatus as any} />
              </TableCell>
              <TableCell>
                <MedlogStatusBadge status={container.medlogStatus as any} />
              </TableCell>
              <TableCell className="w-48">
                <div className="space-y-1">
                  <div className="text-xs flex items-center justify-between">
                    <span className="truncate">Carrier: {container.carrierNote || '-'}</span>
                    {(container.carrierNote && container.carrierNote.length > 20) || (container.medlogNote && container.medlogNote.length > 20) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkNoteModal(true)}
                        className="h-5 w-5 p-0 ml-1 bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="text-xs truncate">Medlog: {container.medlogNote || '-'}</div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bulk Note Modal */}
      <BulkNoteModal
        isOpen={showBulkNoteModal}
        onClose={() => setShowBulkNoteModal(false)}
        onSave={handleBulkNote}
        selectedCount={selectedContainers.length}
      />
    </div>
  );
};

export default ContainerTable;