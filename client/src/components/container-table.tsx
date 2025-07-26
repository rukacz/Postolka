import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, MoreHorizontal } from "lucide-react";
import RouteVisualizer from "./route-visualizer";
import StatusBadge from "./status-badge";
import ContainerNotes from "./container-notes";
import { RouteStep, BLStatus, UserGroup } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContainerTableProps {
  data: Container[];
  isLoading?: boolean;
  currentUserGroup?: UserGroup;
}

// Helper component for container field change styling
const ContainerFieldWrapper = ({ fieldName, container, children, className = "" }: { 
  fieldName: string; 
  container: Container;
  children: React.ReactNode; 
  className?: string;
}) => {
  const isChanged = container.changedFields?.includes(fieldName) || false;
  return (
    <div className={`${className} ${isChanged ? 'bg-yellow-100 border-l-4 border-yellow-400 pl-2 py-1 rounded' : ''}`}>
      {children}
    </div>
  );
};

const ContainerFieldLabel = ({ fieldName, container, children }: { 
  fieldName: string; 
  container: Container;
  children: React.ReactNode 
}) => {
  return (
    <span>
      {children}
    </span>
  );
};

export default function ContainerTable({ data, isLoading, currentUserGroup = 'medlog' }: ContainerTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Mutation for updating container notes
  const updateNoteMutation = useMutation({
    mutationFn: async ({ containerId, group, note }: { containerId: number; group: 'carrier' | 'medlog'; note: string }) => {
      const response = await fetch(`/api/containers/${containerId}/note`, {
        method: 'PATCH',
        body: JSON.stringify({ group, note }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    },
    onSuccess: (_, { containerId }) => {
      toast({
        title: "Note updated",
        description: "Container note has been saved successfully.",
      });
      // Invalidate container queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/containers']
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update container note. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper function to update container notes
  const handleUpdateContainerNote = (containerId: number, group: 'carrier' | 'medlog', note: string) => {
    updateNoteMutation.mutate({ containerId, group, note });
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(container => container.id)));
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading containers...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Container Jobs</h3>
        <Button className="bg-primary hover:bg-blue-700">
          <span className="mr-2">+</span>Add Container
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="w-8 px-4 py-3">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Job #</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Container #</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Size/Type</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date/Time</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Route</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">(Un)Load Address</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Seal</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((container) => {
              // Check if this container is newly added (when BL has "containers" in changedFields)
              const isNewContainer = container.isNewContainer;
              const rowClassName = isNewContainer 
                ? "hover:bg-yellow-100 bg-yellow-50 border-l-4 border-l-yellow-400" 
                : "hover:bg-gray-50";
              
              return (
                <React.Fragment key={container.id}>
                  <TableRow className={`${rowClassName} border-b-0`}>
                <TableCell className="px-4 py-3">
                  <Checkbox
                    checked={selectedRows.has(container.id)}
                    onCheckedChange={() => toggleRowSelection(container.id)}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 font-medium">{container.jobNumber}</TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="containerNumber" container={container}>
                    <ContainerFieldLabel fieldName="containerNumber" container={container}>
                      <span className="font-mono text-sm">{container.containerNumber}</span>
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="sizeType" container={container}>
                    <ContainerFieldLabel fieldName="sizeType" container={container}>
                      <span className="text-sm">{container.size}/{container.containerType}</span>
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="dateTime" container={container}>
                    <ContainerFieldLabel fieldName="dateTime" container={container}>
                      <span className="text-sm">
                        {container.dateTime ? new Date(container.dateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <RouteVisualizer currentStep={container.routeStep as RouteStep} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="status" container={container}>
                    <ContainerFieldLabel fieldName="status" container={container}>
                      <StatusBadge status={container.status as BLStatus} />
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="unloadAddress" container={container}>
                    <ContainerFieldLabel fieldName="unloadAddress" container={container}>
                      <span className="text-sm">{container.unloadAddress || 'N/A'}</span>
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContainerFieldWrapper fieldName="sealNumber" container={container}>
                    <ContainerFieldLabel fieldName="sealNumber" container={container}>
                      <span className="font-mono text-sm">{container.sealNumber || "N/A"}</span>
                    </ContainerFieldLabel>
                  </ContainerFieldWrapper>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1" title="Track">
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 p-1" title="Update Status">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 p-1" title="More Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {/* Container Notes Row */}
              <TableRow key={`${container.id}-notes`} className="border-b">
                <TableCell colSpan={9} className="px-0 py-0">
                  <ContainerNotes
                    carrierNote={container.carrierNote || ""}
                    medlogNote={container.medlogNote || ""}
                    onCarrierNoteChange={(note) => handleUpdateContainerNote(container.id, 'carrier', note)}
                    onMedlogNoteChange={(note) => handleUpdateContainerNote(container.id, 'medlog', note)}
                    userGroup={currentUserGroup}
                  />
                </TableCell>
              </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline">
          Edit Selected Jobs
        </Button>
        <Button className="bg-primary hover:bg-blue-700">
          Update Status
        </Button>
      </div>
    </div>
  );
}
