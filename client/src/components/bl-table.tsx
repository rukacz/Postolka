import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BLSummary, Container } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CarrierStatusBadge from "./carrier-status-badge";
import MedlogStatusBadge from "./medlog-status-badge";
import TrainStatusIcon from "./train-status-icon";
import ChangeIndicatorDot from "./change-indicator-dot";
import { CarrierStatus, MedlogStatus, JobType, UserGroup } from "@/lib/types";

interface BLTableProps {
  data: BLSummary[];
  isLoading?: boolean;
  currentUserGroup?: UserGroup;
}

// Component to properly calculate and display change indicators including container changes
const BLChangeIndicator = ({ bl, currentUserGroup, onClick }: { 
  bl: BLSummary; 
  currentUserGroup: UserGroup; 
  onClick: () => void 
}) => {
  const { data: containers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers', bl.blNumber],
    enabled: !!bl.blNumber,
  });

  // Calculate total changes: booking field changes + container changes
  const bookingChangesCount = bl.changedFields?.length || 0;
  const containerChangesCount = containers.reduce((total, container) => {
    return total + (container.changedFields?.length || 0);
  }, 0);
  const totalUnseenChanges = bookingChangesCount + containerChangesCount;

  // Red dot (time) should only show for container-level time changes (ETA, delivery times)
  // Orange dot (other) for all other changes including booking-level date changes
  const containerHasTimeChanges = containers.some(container => 
    container.changedFields?.some(field => 
      field.includes('eta') || field.includes('time') || field.includes('delivery') || field.includes('dateTime')
    )
  );
  
  const changeType = containerHasTimeChanges ? 'time' : 'other';

  return (
    <ChangeIndicatorDot 
      count={totalUnseenChanges} 
      type={changeType}
      onClick={onClick}
    />
  );
};

function BLTable({ data, isLoading, currentUserGroup = 'medlog' }: BLTableProps) {
  const [, setLocation] = useLocation();
  const [sortConfig, setSortConfig] = useState<{ key: keyof BLSummary | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key: keyof BLSummary) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRowClick = (blNumber: string) => {
    setLocation(`/bl/${blNumber}`);
  };

  if (isLoading) {
    return <div className="bg-white rounded-lg shadow-sm border p-8 text-center">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="w-8 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              Changes
            </TableHead>
            <TableHead className="w-8 px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              <Button
                variant="ghost"
                onClick={() => handleSort('blNumber')}
                className="p-0 h-auto font-semibold hover:bg-gray-100"
              >
                BL/Booking <ArrowUpDown className="ml-1 h-4 w-4" />
              </Button>
            </TableHead>

            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              <Button
                variant="ghost"
                onClick={() => handleSort('client')}
                className="p-0 h-auto font-semibold hover:bg-gray-100"
              >
                Client <ArrowUpDown className="ml-1 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Destination</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">POD/POL</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ETA/Closing</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Containers</TableHead>
            <TableHead className="w-8 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Train
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Carrier Status</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Medlog Status</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Carrier</TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-900">PIC</TableHead>

            <TableHead className="w-16 px-4 py-3"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((bl) => (
            <TableRow
              key={bl.blNumber}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleRowClick(bl.blNumber)}
            >
              <TableCell className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                <BLChangeIndicator bl={bl} currentUserGroup={currentUserGroup} onClick={() => handleRowClick(bl.blNumber)} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={bl.type === 'Import' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                  {bl.type}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <button className="text-primary font-medium hover:underline">
                  {bl.blNumber}
                </button>
              </TableCell>

              <TableCell className="px-4 py-3 font-medium">{bl.client}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-600">{bl.destination}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-600">{bl.podPol}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-600">{bl.etaClosing}</TableCell>
              <TableCell className="px-4 py-3 text-center">
                <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                  {bl.containerCount}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <TrainStatusIcon isScheduled={bl.trainScheduled || false} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <CarrierStatusBadge status={bl.carrierStatus as CarrierStatus} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <MedlogStatusBadge status={bl.medlogStatus as MedlogStatus} />
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-600">
                {bl.carrier || "Not assigned"}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-600">{bl.pic}</TableCell>

              <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default BLTable;
