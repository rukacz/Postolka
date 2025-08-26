import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, Undo2, Scale, ChevronRight, Flame, Copy, Trash2, Truck } from "lucide-react";
import DangerousGoodsFlag from "@/components/dangerous-goods-flag";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import BulkNoteModal from "./bulk-note-modal";
import IndividualNoteModal from "./individual-note-modal";
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
  onCopyContainer?: (container: Container) => void;
  onDeleteContainer?: (containerId: number) => void;
}

const sizeTypeOptions = [
  "20DV", "40DV", "40HC", "20RE", "40HR", "20OT", "40OT", "45DV", "45HC", "20FT", "40FT"
];

const carrierStatusOptions = [
  "Pre-Order", "MIPS Send", "Cancelled", "Do Not Release", "Delivery planned"
];

const medlogStatusOptions = [
  "New", "Approved", "Rejected", "Changed"
];

// Container number validation function
const validateContainerNumber = (containerNumber: string): boolean => {
  const regex = /^[A-Z]{4}[0-9]{7}$/;
  return regex.test(containerNumber);
};

const ContainerTable = ({ containers, userGroup, blDetail, onNoteChange, onHazardousChange, changedFields = [], addContainerMode = false, onAddContainerComplete, onCopyContainer, onDeleteContainer }: ContainerTableProps) => {
  const [selectedContainers, setSelectedContainers] = useState<number[]>([]);
  const [showBulkNoteModal, setShowBulkNoteModal] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const [individualNoteModal, setIndividualNoteModal] = useState<{
    isOpen: boolean;
    container: Container | null;
    noteType: 'carrier' | 'medlog';
  }>({ isOpen: false, container: null, noteType: 'medlog' });
  const [editingFields, setEditingFields] = useState<{[key: string]: boolean}>({});
  const [containerQty, setContainerQty] = useState(1);
  const [newContainer, setNewContainer] = useState<{
    containerNumber: string;
    sizeType: string;
    destination: string;
    dangerousCargo: boolean;
    directTransport: boolean;
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
      // Also invalidate BL-specific container queries
      queryClient.invalidateQueries({ queryKey: ['/api/containers/bl'] });
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
      directTransport: false,
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
  const handleSaveNewContainer = (qty = 1) => {
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

    // Generate multiple containers based on quantity
    const containers = [];
    const baseContainerNumber = newContainer.containerNumber.slice(0, -1); // Remove last digit
    const lastDigit = parseInt(newContainer.containerNumber.slice(-1));

    for (let i = 0; i < qty; i++) {
      const newLastDigit = (lastDigit + i) % 10;
      const containerNumber = baseContainerNumber + newLastDigit.toString();
      
      containers.push({
        id: containerNumber, // Use container number as ID since it's varchar primary key
        containerIlu: containerNumber,
        size: newContainer.sizeType, // e.g., "40DV"
        location: newContainer.destination,
        carrierStatus: 'Pre-Order',
        medlogStatus: 'New',
        hasDangerous: newContainer.dangerousCargo,
        carrierNote: '',
        medlogNote: ''
      });
    }

    // Create containers in sequence
    containers.forEach((containerData, index) => {
      setTimeout(() => {
        createContainerMutation.mutate(containerData);
      }, index * 100); // Small delay between creations
    });

    if (qty > 1) {
      toast({
        title: "Containers Created",
        description: `${qty} containers added successfully.`,
      });
    }
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
      hazardous: containers.find(c => c.id === id)?.hasDangerous || false
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

  const handleBulkNote = (noteType: 'carrier' | 'medlog', note: string) => {
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
      title: `${noteType === 'medlog' ? 'Medlog' : 'Carrier'} notes added to selected containers`,
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
            <TableHead className="w-12">DT</TableHead>
            <TableHead className="w-28">Train</TableHead>
            <TableHead className="w-32">Train Date</TableHead>
            <TableHead className="w-32">Date/Time</TableHead>
            <TableHead className="w-24">Location</TableHead>
            {blDetail?.jobType === 'Import' && <TableHead className="w-32">Customs Clearance</TableHead>}
            {blDetail?.jobType === 'Export' && <TableHead className="w-20">VGM</TableHead>}
            <TableHead className="w-36">Carrier Status</TableHead>
            <TableHead className="w-28">Medlog Status</TableHead>
            <TableHead className="w-48">Note</TableHead>
            <TableHead className="w-16"></TableHead>
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
                    containers.find(c => c.id === id)?.hasDangerous
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
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'containerIlu', e.target.value.toUpperCase()));
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
                  selectedContainers.forEach(id => handleFieldUpdate(id, 'size', value));
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

              {/* DT Column */}
              <TableHead className="h-auto p-2">
                <Switch
                  checked={selectedContainers.every(id => 
                    containers.find(c => c.id === id)?.isDirectTruck
                  )}
                  onCheckedChange={(checked) => {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'isDirectTruck', checked));
                  }}
                  className="scale-75"
                />
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
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'unloadDate', e.target.value));
                    }
                  }}
                />
              </TableHead>

              {/* Location Column */}
              <TableHead className="h-auto p-2">
                <Input
                  placeholder="Location name"
                  className="h-7 text-xs w-full"
                  onBlur={(e) => {
                    if (e.target.value) {
                      selectedContainers.forEach(id => handleFieldUpdate(id, 'location', e.target.value));
                      e.target.value = '';
                    }
                  }}
                />
              </TableHead>

              {/* Customs Clearance or VGM Scale for Export */}
              {blDetail?.jobType === 'Import' && (
                <TableHead className="h-auto p-2">
                  <Select onValueChange={(value) => {
                    selectedContainers.forEach(id => handleFieldUpdate(id, 'customs', value));
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
                  onClick={() => {
                    if (selectedContainers.length === 1) {
                      // Single container selected - open individual modal
                      const selectedContainer = containers.find(c => c.id === selectedContainers[0]);
                      if (selectedContainer) {
                        setIndividualNoteModal({
                          isOpen: true,
                          container: selectedContainer,
                          noteType: userGroup as 'carrier' | 'medlog'
                        });
                      }
                    } else {
                      // Multiple containers selected - open bulk modal
                      setShowBulkNoteModal(true);
                    }
                  }}
                  className="text-xs h-7"
                >
                  Add Note
                </Button>
              </TableHead>
              <TableHead className="h-auto p-2">Actions</TableHead>
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
              <TableCell>
                <Switch
                  checked={newContainer.directTransport || false}
                  onCheckedChange={(checked) => setNewContainer({...newContainer, directTransport: checked})}
                  className="scale-75"
                />
              </TableCell>
              <TableCell className="font-mono text-sm">-</TableCell>
              <TableCell className="text-sm">-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Input
                  value={newContainer.destination}
                  onChange={(e) => setNewContainer({...newContainer, destination: e.target.value})}
                  placeholder="Location"
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
              <TableCell className="w-64">
                <div className="flex items-center gap-2 justify-end">
                  {/* Qty input with dropdown */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-gray-600">Qty:</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={containerQty}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setContainerQty(Math.max(1, Math.min(999, value)));
                        }}
                        className="h-7 w-16 text-xs text-center pr-6"
                      />
                      <Select 
                        value={containerQty <= 10 ? containerQty.toString() : "custom"} 
                        onValueChange={(value) => {
                          if (value !== "custom") {
                            setContainerQty(parseInt(value));
                          }
                        }}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-7 w-5 border-0 bg-transparent p-0">
                          <div className="w-2 h-2 border-l border-t border-gray-400 rotate-45 -translate-y-0.5" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCancelNewContainer}
                    disabled={createContainerMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveNewContainer(containerQty)}
                    disabled={createContainerMutation.isPending}
                    size="sm"
                    className={`${
                      containerQty > 1 
                        ? "bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Save {containerQty > 1 ? `${containerQty}x` : ""}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {/* No actions for new container row */}
                -
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
              <TableCell className={container.hasDangerousChange ? "relative" : ""}>
                <div className={container.hasDangerousChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.hasDangerousChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  {container.hasDangerous && <Flame className="w-4 h-4 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className={`font-mono text-sm ${container.containerIluChange ? "relative" : ""}`}>
                <div className={container.containerIluChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.containerIluChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  {container.containerIlu}
                </div>
              </TableCell>
              <TableCell className={container.sizeChange ? "relative" : ""}>
                <div className={container.sizeChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.sizeChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  {container.size || '-'}
                </div>
              </TableCell>
              <TableCell className={container.isDirectTruckChange ? "relative" : ""}>
                <div className={container.isDirectTruckChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.isDirectTruckChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  {container.isDirectTruck && <Truck className="w-4 h-4 text-blue-500" />}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                <FieldWrapper fieldName="train">
                  {container.train || '-'}
                </FieldWrapper>
              </TableCell>
              <TableCell className="text-sm">
                <FieldWrapper fieldName="trainDate">
                  {container.trainDate ? new Date(container.trainDate).toLocaleDateString() : '-'}
                </FieldWrapper>
              </TableCell>
              <TableCell className={container.unloadDateChange ? "relative" : ""}>
                <div className={container.unloadDateChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.unloadDateChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  {container.unloadDate ? new Date(container.unloadDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </div>
              </TableCell>
              <TableCell className={container.locationChange ? "relative" : ""}>
                <div className={container.locationChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.locationChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  <FieldWrapper fieldName="location">
                    {container.location || '-'}
                  </FieldWrapper>
                </div>
              </TableCell>
              {blDetail?.jobType === 'Import' && (
                <TableCell className={container.customsChange ? "relative" : ""}>
                  <div className={container.customsChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                    {container.customsChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                    {container.customs || '-'}
                  </div>
                </TableCell>
              )}
              {blDetail?.jobType === 'Export' && (
                <TableCell className={container.weightChange ? "relative" : ""}>
                  <div className={container.weightChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                    {container.weightChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                    {container.weight && (
                      <Scale className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell className={container.carrierStatusChange ? "relative" : ""}>
                <div className={container.carrierStatusChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.carrierStatusChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  <CarrierStatusBadge status={container.carrierStatus as any} />
                </div>
              </TableCell>
              <TableCell className={container.medlogStatusChange ? "relative" : ""}>
                <div className={container.medlogStatusChange ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {container.medlogStatusChange && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  <MedlogStatusBadge status={container.medlogStatus as any} />
                </div>
              </TableCell>
              <TableCell className={`w-48 ${(container.carrierNoteChange || container.medlogNoteChange) ? "relative" : ""}`}>
                <div className={(container.carrierNoteChange || container.medlogNoteChange) ? "bg-yellow-200 border border-red-400 rounded p-1 relative" : ""}>
                  {(container.carrierNoteChange || container.medlogNoteChange) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  <div className="space-y-1">
                    <div className="text-xs flex items-center justify-between">
                      <span className="truncate">
                        Carrier: {container.carrierNote 
                          ? container.carrierNote.length > 35 
                            ? container.carrierNote.substring(0, 35) + '...' 
                            : container.carrierNote
                          : '-'
                        }
                      </span>
                      {container.carrierNote && container.carrierNote.length > 35 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIndividualNoteModal({
                            isOpen: true,
                            container,
                            noteType: 'carrier'
                          })}
                          className="h-5 w-5 p-0 ml-1 bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      ) : null}
                    </div>
                    <div className="text-xs flex items-center justify-between">
                      <span className="truncate">
                        Medlog: {container.medlogNote 
                          ? container.medlogNote.length > 35 
                            ? container.medlogNote.substring(0, 35) + '...' 
                            : container.medlogNote
                          : '-'
                        }
                      </span>
                      {container.medlogNote && container.medlogNote.length > 50 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIndividualNoteModal({
                            isOpen: true,
                            container,
                            noteType: 'medlog'
                          })}
                          className="h-5 w-5 p-0 ml-1 bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyContainer?.(container)}
                    className="h-6 w-6 p-0"
                    title="Copy container data"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteContainer?.(container.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete container"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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

      <IndividualNoteModal
        isOpen={individualNoteModal.isOpen}
        onClose={() => setIndividualNoteModal({ isOpen: false, container: null, noteType: 'medlog' })}
        onSave={onNoteChange}
        container={individualNoteModal.container}
        noteType={individualNoteModal.noteType}
        userGroup={userGroup as 'carrier' | 'medlog'}
      />
    </div>
  );
};

export default ContainerTable;