import { useState } from "react";
import { Container } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, MoreHorizontal } from "lucide-react";
import RouteVisualizer from "./route-visualizer";
import StatusBadge from "./status-badge";
import { RouteStep, BLStatus } from "@/lib/types";

interface ContainerTableProps {
  data: Container[];
  isLoading?: boolean;
}

export default function ContainerTable({ data, isLoading }: ContainerTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

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
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Size</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Weight (kg)</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Route</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Seal</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((container) => (
              <TableRow key={container.id} className="hover:bg-gray-50">
                <TableCell className="px-4 py-3">
                  <Checkbox
                    checked={selectedRows.has(container.id)}
                    onCheckedChange={() => toggleRowSelection(container.id)}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 font-medium">{container.jobNumber}</TableCell>
                <TableCell className="px-4 py-3 font-mono text-sm">{container.containerNumber}</TableCell>
                <TableCell className="px-4 py-3 text-sm">{container.size}</TableCell>
                <TableCell className="px-4 py-3 text-sm">{container.weight.toLocaleString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <RouteVisualizer currentStep={container.routeStep as RouteStep} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge status={container.status as BLStatus} />
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-sm">
                  {container.sealNumber || "N/A"}
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
            ))}
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
