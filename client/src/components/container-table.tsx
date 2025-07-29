import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, Undo2 } from "lucide-react";
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
  onNoteChange: (containerId: number, group: 'carrier' | 'medlog', note: string) => void;
  onHazardousChange: (containerIds: number[], hazardous: boolean) => void;
}

const sizeTypeOptions = [
  "20DV", "40DV", "40HC", "20RE", "40HR", "20OT", "40OT", "45DV", "45HC", "20FT", "40FT"
];

const carrierStatusOptions = [
  "pending", "confirmed", "in_transit", "delivered", "cancelled"
];

const medlogStatusOptions = [
  "pending", "processing", "completed", "on_hold", "cancelled"
];

const ContainerTable = ({ containers, userGroup, onNoteChange, onHazardousChange }: ContainerTableProps) => {
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
          
          {/* Bulk Edit Controls Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-gray-600">DG:</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkHazardous(true)}
                  className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  Mark DG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkHazardous(false)}
                  className="h-7 px-2 text-xs"
                >
                  Unmark DG
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-gray-600">Size/Type:</Label>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'size', value))}>
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue placeholder="Set" />
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

            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-gray-600">Carrier Status:</Label>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'carrierStatus', value))}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue placeholder="Set" />
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

            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-gray-600">Medlog Status:</Label>
              <Select onValueChange={(value) => selectedContainers.forEach(id => handleFieldUpdate(id, 'medlogStatus', value))}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue placeholder="Set" />
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
                <CarrierStatusBadge status={container.carrierStatus as any} />
              </TableCell>
              <TableCell>
                <MedlogStatusBadge status={container.medlogStatus as any} />
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="cursor-pointer" onClick={() => setShowBulkNoteModal(true)}>
                  <div className="text-sm">Carrier: {container.carrierNote || '-'}</div>
                  <div className="text-sm">Medlog: {container.medlogNote || '-'}</div>
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