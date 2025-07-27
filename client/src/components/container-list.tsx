import React, { useState } from "react";
import { Container } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ContainerBlock from "@/components/container-block";
import { UserGroup } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContainerListProps {
  data: Container[];
  isLoading?: boolean;
  currentUserGroup?: UserGroup;
}

export default function ContainerList({ data, isLoading, currentUserGroup = 'medlog' }: ContainerListProps) {
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
      // Only show success toast if user explicitly requested it, not on auto-save
      // Invalidate container queries to refresh the data silently
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

  const toggleRowSelection = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedRows);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
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
    <div className="p-4">
      <div className="mb-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-gray-900">Container Jobs</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === data.length && data.length > 0}
              onCheckedChange={toggleAllSelection}
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>
        </div>
        <Button className="bg-primary hover:bg-blue-700" size="sm">
          <span className="mr-1">+</span>Add Container
        </Button>
      </div>

      {/* Container Table */}
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No containers found for this booking
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium w-8">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Job</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Container</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Size/Type</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Date/Time</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Route</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Status</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Carrier Status</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Medlog Status</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Train Name</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Train ETD</th>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((container) => (
                <ContainerBlock
                  key={container.id}
                  container={container}
                  userGroup={currentUserGroup}
                  onNoteChange={handleUpdateContainerNote}
                  onSelectChange={toggleRowSelection}
                  isSelected={selectedRows.has(container.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline" size="sm">
          Edit Selected Jobs
        </Button>
        <Button className="bg-primary hover:bg-blue-700" size="sm">
          Update Status
        </Button>
      </div>
    </div>
  );
}