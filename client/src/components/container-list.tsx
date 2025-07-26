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
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Container Jobs</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === data.length && data.length > 0}
              onCheckedChange={toggleAllSelection}
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <span className="mr-2">+</span>Add Container
        </Button>
      </div>

      {/* Container blocks */}
      <div>
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