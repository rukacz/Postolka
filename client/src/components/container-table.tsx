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
      {/* Bulk Actions Bar */}
      {hasSelectedContainers && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedContainers.length} container(s) selected
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkHazardous(true)}
              className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Mark as Hazardous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkHazardous(false)}
              className="h-8"
            >
              Unmark DG
            </Button>
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
                <Switch
                  checked={container.dangerousCargo || false}
                  onCheckedChange={(checked) => handleFieldUpdate(container.id, 'dangerousCargo', checked)}
                />
              </TableCell>
              <TableCell className="font-mono">
                <Input
                  value={container.containerNumber}
                  onChange={(e) => handleFieldUpdate(container.id, 'containerNumber', e.target.value)}
                  className="min-w-32 font-mono text-sm border-0 bg-transparent p-1 focus:border focus:border-blue-300 focus:bg-white"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={container.size}
                  onValueChange={(value) => handleFieldUpdate(container.id, 'size', value)}
                >
                  <SelectTrigger className="w-24 border-0 bg-transparent p-1 focus:border focus:border-blue-300 focus:bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-gray-500">
                <span className="font-mono text-sm">
                  {formatRouteSteps(container.routeStep)}
                </span>
              </TableCell>
              <TableCell>
                <Input
                  type="datetime-local"
                  value={container.dateTime ? new Date(container.dateTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleFieldUpdate(container.id, 'dateTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="min-w-44 text-sm border-0 bg-transparent p-1 focus:border focus:border-blue-300 focus:bg-white"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={container.carrierStatus}
                  onValueChange={(value) => handleFieldUpdate(container.id, 'carrierStatus', value)}
                >
                  <SelectTrigger className="w-32 border-0 bg-transparent p-1 focus:border focus:border-blue-300 focus:bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {carrierStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={container.medlogStatus}
                  onValueChange={(value) => handleFieldUpdate(container.id, 'medlogStatus', value)}
                >
                  <SelectTrigger className="w-32 border-0 bg-transparent p-1 focus:border focus:border-blue-300 focus:bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {medlogStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="space-y-1 cursor-pointer" onClick={() => setShowBulkNoteModal(true)}>
                  <div className="text-xs text-gray-500">Carrier:</div>
                  <div className="text-sm truncate">{container.carrierNote || '-'}</div>
                  <div className="text-xs text-gray-500">Medlog:</div>
                  <div className="text-sm truncate">{container.medlogNote || '-'}</div>
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