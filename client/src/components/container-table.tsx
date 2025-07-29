import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, Undo2, Scale, ChevronRight, Flame } from "lucide-react";
import DangerousGoodsFlag from "@/components/dangerous-goods-flag";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import BulkNoteModal from "./bulk-note-modal";
import { UserGroup } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ContainerTableProps {
  containers: Container[];
  userGroup: UserGroup;
  blDetail?: { jobType: 'Import' | 'Export'; toLocation?: string; blNumber?: string } | null;
  onNoteChange: (containerId: number, group: 'carrier' | 'medlog', note: string) => void;
  onHazardousChange: (containerIds: number[], hazardous: boolean) => void;
  changedFields?: string[];
  addContainerMode?: boolean;
  onAddContainerComplete?: () => void;
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

const ContainerTable = ({ containers, userGroup, blDetail, onNoteChange, onHazardousChange, changedFields = [], addContainerMode = false, onAddContainerComplete }: ContainerTableProps) => {
  const [selectedContainers, setSelectedContainers] = useState<number[]>([]);
  const [showBulkNoteModal, setShowBulkNoteModal] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const [editingFields, setEditingFields] = useState<{[key: string]: boolean}>({});
  const [newContainer, setNewContainer] = useState<{
    containerNumber: string;
    sizeType: string;
    destination: string;
    dangerousCargo: boolean;
    isEditing: boolean;
  } | null>(null);
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

  const createContainerMutation = useMutation({
    mutationFn: async (containerData: any) => {
      return apiRequest("POST", "/api/containers", containerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/containers'] });
      setNewContainer(null);
      if (onAddContainerComplete) {
        onAddContainerComplete();
      }
      toast({
        title: "Container added",
        description: "New container has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create container. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isCarrier = userGroup === "carrier";
  const isMedlog = userGroup === "medlog";

  // Function to handle adding new container
  const handleAddContainer = () => {
    setNewContainer({
      containerNumber: '',
      sizeType: '40DV',
      destination: blDetail?.toLocation || '',
      dangerousCargo: false,
      isEditing: true
    });
  };

  // Trigger add container when addContainerMode changes
  React.useEffect(() => {
    if (addContainerMode && !newContainer) {
      handleAddContainer();
    }
  }, [addContainerMode]);

  // Function to save new container
  const handleSaveNewContainer = () => {
    if (!newContainer || !newContainer.containerNumber) {
      toast({
        title: "Validation Error",
        description: "Container number is required.",
        variant: "destructive",
      });
      return;
    }

    if (!validateContainerNumber(newContainer.containerNumber)) {
      toast({
        title: "Validation Error", 
        description: "Container number must be in format ABCD1234567.",
        variant: "destructive",
      });
      return;
    }

    const containerData = {
      blNumber: blDetail?.blNumber || containers[0]?.blNumber,
      jobNumber: '1', // Default job number
      containerNumber: newContainer.containerNumber,
      sizeType: newContainer.sizeType,
      status: 'Active',
      routeStep: 'W',
      destination: newContainer.destination,
      carrierStatus: 'Pre-Order',
      medlogStatus: 'New',
      dangerousCargo: newContainer.dangerousCargo,
      carrierNote: '',
      medlogNote: ''
    };

    createContainerMutation.mutate(containerData);
  };

  // Function to cancel new container
  const handleCancelNewContainer = () => {
    setNewContainer(null);
    if (onAddContainerComplete) {
      onAddContainerComplete();
    }
  };

  // Helper function to check if a field has changes
  const isFieldChanged = (fieldName: string): boolean => {
    return changedFields.includes(fieldName);
  };

  // Helper component for changed field styling in containers
  const FieldWrapper = ({ fieldName, children, className = "" }: { 
    fieldName: string; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isChanged = isFieldChanged(fieldName);
    return (
      <div className={`relative ${className} ${isChanged ? 'bg-yellow-100 border border-yellow-300 rounded px-1' : ''}`}>
        {children}
        {isChanged && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  };

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

  const handleDeselectAll = () => {
    setSelectedContainers([]);
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
            <TableHead className="w-32">Container #</TableHead>
            <TableHead className="w-24">Size/Type</TableHead>
            <TableHead className="w-28">Train</TableHead>
            <TableHead className="w-32">Train Date</TableHead>
            <TableHead className="w-32">Date/Time</TableHead>
            <TableHead className="w-24">Destination</TableHead>
            {blDetail?.jobType === 'Import' && <TableHead className="w-32">Customs Clearance</TableHead>}
            {blDetail?.jobType === 'Export' && <TableHead className="w-20">Weight</TableHead>}
            <TableHead className="w-36">Carrier Status</TableHead>
            <TableHead className="w-28">Medlog Status</TableHead>
            <TableHead className="w-48">Note</TableHead>
          </TableRow>
          {/* Bulk Editing Row */}
          {selectedContainers.length > 0 && (
            <TableRow className="bg-blue-50 border-blue-200">
              <TableHead className="h-auto p-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="text-xs h-6"
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-medium text-blue-700">
                    {selectedContainers.length} selected
                  </span>
                </div>
              </TableHead>

              {/* DG Column */}
              <TableHead className="h-auto p-2">
                <Switch
                  checked={selectedContainers.every(id => 
                    containers.find(c => c.id === id)?.dangerousCargo
                  )}
                  onCheckedChange={(checked) => {
                    handleBulkHazardous(checked);
                  }}
                  className="scale-75"
                />
              </TableHead>

              {/* Container # Column */}
              <TableHead className="h-auto p-2">
                <Input
                  placeholder="ABCD1234567"
                  maxLength={11}
                  className="h-7 text-xs font-mono w-full"
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
              </TableHead>

              {/* Size/Type Column */}
              <TableHead className="h-auto p-2">
                <Select onValueChange={(value) => {
                  selectedContainers.forEach(id => handleFieldUpdate(id, 'sizeType', value));
                }}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Size/Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeTypeOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Train Column - Read only */}
              <TableHead className="h-auto p-2">
                <span className="text-xs text-gray-500">Read only</span>
              </TableHead>

              {/* Train Date Column - Read only */}
              <TableHead className="h-auto p-2">
                <span className="text-xs text-gray-500">Read only</span>
              </TableHead>

              {/* Date/Time Column */}
              <TableHead className="h-auto p-2">
                <Input
                  type="datetime-local"
                  className="h-7 text-xs w-full"
                  onChange={(e) => {
                    if (e.target.value) {
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'dateTime', e.target.value));
                    }
                  }}
                />
              </TableHead>

              {/* Destination Column */}
              <TableHead className="h-auto p-2">
                <Input
                  placeholder="City name"
                  className="h-7 text-xs w-full"
                  onBlur={(e) => {
                    if (e.target.value) {
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'destination', e.target.value));
                      e.target.value = '';
                    }
                  }}
                />
              </TableHead>

              {/* Customs Clearance or Weight Scale for Export */}
              {blDetail?.jobType === 'Import' && (
                <TableHead className="h-auto p-2">
                  <Select onValueChange={(value) => {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'customsClearance', value));
                  }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Customs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In port">In port</SelectItem>
                      <SelectItem value="At customer">At customer</SelectItem>
                      <SelectItem value="Inland depo">Inland depo</SelectItem>
                      <SelectItem value="Customs Office">Customs Office</SelectItem>
                      <SelectItem value="Metrans">Metrans</SelectItem>
                      <SelectItem value="Obrnice">Obrnice</SelectItem>
                      <SelectItem value="Melnik">Melnik</SelectItem>
                      <SelectItem value="Mošnov">Mošnov</SelectItem>
                      <SelectItem value="Bratislava">Bratislava</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
              )}
              {blDetail?.jobType === 'Export' && (
                <TableHead className="h-auto p-2">
                  <Switch
                    checked={false}
                    onCheckedChange={(checked) => {
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'weighingRequested', checked));
                    }}
                    className="scale-75"
                  />
                </TableHead>
              )}

              {/* Carrier Status Column */}
              <TableHead className="h-auto p-2">
                <Select onValueChange={(value) => {
                  selectedContainers.forEach(id => handleFieldUpdate(id, 'carrierStatus', value));
                }}>
                  <SelectTrigger className="h-7 text-xs w-full">
                    <SelectValue placeholder="Carrier Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {carrierStatusOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Medlog Status Column */}
              <TableHead className="h-auto p-2">
                <Select onValueChange={(value) => {
                  selectedContainers.forEach(id => handleFieldUpdate(id, 'medlogStatus', value));
                }}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Medlog Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {medlogStatusOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Notes Column */}
              <TableHead className="h-auto p-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkNoteModal(true)}
                  className="text-xs h-7"
                >
                  Add Note
                </Button>
              </TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {/* New container row for editing */}
          {newContainer && (
            <TableRow className="bg-blue-50 border-l-4 border-l-blue-500">
              <TableCell>
                <Checkbox 
                  checked={true}
                  className="border-blue-500 bg-blue-100"
                />
              </TableCell>
              <TableCell>
                <Flame className="w-4 h-4 text-red-500" style={{ opacity: newContainer.dangerousCargo ? 1 : 0 }} />
              </TableCell>
              <TableCell className="font-mono text-sm">
                <Input
                  value={newContainer.containerNumber}
                  onChange={(e) => setNewContainer({...newContainer, containerNumber: e.target.value.toUpperCase()})}
                  placeholder="ABCD1234567"
                  className="w-full"
                  autoFocus
                />
              </TableCell>
              <TableCell>
                <Select
                  value={newContainer.sizeType}
                  onValueChange={(value) => setNewContainer({...newContainer, sizeType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeTypeOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="font-mono text-sm">-</TableCell>
              <TableCell className="text-sm">-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Input
                  value={newContainer.destination}
                  onChange={(e) => setNewContainer({...newContainer, destination: e.target.value})}
                  placeholder="Destination"
                  className="w-full"
                />
              </TableCell>
              {blDetail?.jobType === 'Import' && (
                <TableCell>-</TableCell>
              )}
              {blDetail?.jobType === 'Export' && (
                <TableCell>
                  <Switch
                    checked={newContainer.dangerousCargo}
                    onCheckedChange={(checked) => setNewContainer({...newContainer, dangerousCargo: checked})}
                  />
                </TableCell>
              )}
              <TableCell>
                <CarrierStatusBadge status="Pre-Order" />
              </TableCell>
              <TableCell>
                <MedlogStatusBadge status="New" />
              </TableCell>
              <TableCell className="w-48">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNewContainer}
                    disabled={createContainerMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelNewContainer}
                    disabled={createContainerMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {containers.slice().sort((a, b) => a.id - b.id).map((container) => (
            <TableRow key={container.id}>
              <TableCell>
                <Checkbox
                  checked={selectedContainers.includes(container.id)}
                  onCheckedChange={(checked) => handleSelectContainer(container.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                {container.dangerousCargo && <Flame className="w-4 h-4 text-red-500" />}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {container.containerNumber}
              </TableCell>
              <TableCell>
                {container.sizeType}
              </TableCell>
              <TableCell className="font-mono text-sm">
                <FieldWrapper fieldName="trainName">
                  {container.trainName || '-'}
                </FieldWrapper>
              </TableCell>
              <TableCell className="text-sm">
                <FieldWrapper fieldName="trainDate">
                  {container.trainEtd || '-'}
                </FieldWrapper>
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
                <FieldWrapper fieldName="destination">
                  {container.destination || '-'}
                </FieldWrapper>
              </TableCell>
              {blDetail?.jobType === 'Import' && (
                <TableCell>
                  {container.customsClearance || '-'}
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
                    {container.carrierNote && container.carrierNote.length > 20 ? (
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
                  <div className="text-xs flex items-center justify-between">
                    <span className="truncate">Medlog: {container.medlogNote || '-'}</span>
                    {container.medlogNote && container.medlogNote.length > 20 ? (
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
        userGroup={userGroup}
      />
    </div>
  );
};

export default ContainerTable;