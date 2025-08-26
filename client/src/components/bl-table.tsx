import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BL, Container, Company, User, Port, City, ContainerInBl, BLWithResolvedNames } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreVertical, Flame, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CarrierStatusBadge from "./carrier-status-badge";
import MedlogStatusBadge from "./medlog-status-badge";
import TrainStatusIcon from "./train-status-icon";
import ChangeIndicatorDot from "./change-indicator-dot";

import { CarrierStatus, MedlogStatus, JobType, UserGroup } from "@/lib/types";

// Extended BL type with company and user information
interface BLWithDetails extends BLWithResolvedNames {
  clientCompany?: Company;
  carrierCompany?: Company;
  picUser?: User;
  localPortInfo?: Port;
  locationCity?: City;
  containerInBls?: (ContainerInBl & { container?: Container })[];
}

interface BLTableProps {
  data: BLWithDetails[];
  isLoading?: boolean;
  currentUserGroup?: UserGroup;
}

// Component to display change indicators using new boolean flags
const BLChangeIndicator = ({ bl, currentUserGroup, onClick }: { 
  bl: BLWithDetails; 
  currentUserGroup?: UserGroup; 
  onClick?: () => void 
}) => {
  // Get containers for this BL to count container-level changes
  const { data: containerInBls = [] } = useQuery<ContainerInBl[]>({
    queryKey: ['/api/container-in-bl'],
    enabled: !!bl.id
  });

  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Get containers for this specific BL
  const blContainerIds = containerInBls
    .filter((cib: ContainerInBl) => cib.blId === bl.id)
    .map((cib: ContainerInBl) => cib.containerId);
  
  const blContainers = allContainers.filter(container => 
    blContainerIds.includes(container.id)
  );

  // Count changes based on BL-level boolean flags (excluding duplicates with container level)
  const blOnlyChangeFields = [
    bl.blNumberChange, bl.picChange, bl.clientChange, bl.containerChange,
    bl.directionChange, bl.etaChange, bl.localPortChange, 
    bl.medlogBulbChange, bl.carrierBulbChange, bl.vesselChange, bl.voyageChange
  ];
  
  const blChanges = blOnlyChangeFields.filter(Boolean).length;

  // Count container-level changes (these are the authoritative source for container data)
  const containerChanges = blContainers.reduce((total, container) => {
    const containerChangeFields = [
      container.containerIluChange, container.sizeChange, container.weightChange,
      container.customsChange, container.hasDangerousChange, container.unloadDateChange,
      container.isDirectTruckChange, container.medlogStatusChange, container.carrierStatusChange,
      container.medlogNoteChange, container.carrierNoteChange, container.isSentInMipsChange,
      container.locationChange, container.zipChange, container.trainChange,
      container.trainDateChange, container.deliveryNotPossibleChange
    ];
    return total + containerChangeFields.filter(Boolean).length;
  }, 0);

  const totalChanges = blChanges + containerChanges;

  // Determine change type based on changed fields
  const hasTimeChanges = bl.etaChange || blContainers.some(c => c.trainDateChange || c.unloadDateChange);
  const changeType = hasTimeChanges ? 'time' : 'other';

  return (
    <ChangeIndicatorDot 
      count={totalChanges} 
      type={changeType}
      onClick={onClick}
    />
  );
};

// Component to display dangerous goods indicator for a BL
const DangerousGoodsIndicator = ({ bl }: { bl: BLWithDetails }) => {
  // Use the new hasDangerous field from BL
  return (
    <div className="flex justify-center">
      {bl.hasDangerous ? (
        <Flame className="w-4 h-4 text-red-500" />
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      )}
    </div>
  );
};

// Component to check delivery possibility and render train icon
const TrainStatusWithDeliveryCheck = ({ bl }: { bl: BLWithDetails }) => {
  // Train only exists at container level, not BL level
  // Get containers for this BL using the junction table
  const { data: containerInBls = [] } = useQuery<ContainerInBl[]>({
    queryKey: ['/api/container-in-bl'],
    enabled: !!bl.id
  });

  // Get containers for this specific BL
  const blContainerIds = containerInBls
    .filter((cib: ContainerInBl) => cib.blId === bl.id)
    .map((cib: ContainerInBl) => cib.containerId);

  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
    enabled: blContainerIds.length > 0
  });

  // Get containers for this BL
  const blContainers = allContainers.filter(container => 
    blContainerIds.includes(container.id)
  );

  // Check if there are any trains scheduled at container level (any container with train field filled)
  const hasTrainScheduled = blContainers.some(container => 
    container.train
  );

  // Check if delivery is not possible (backend calculates this)
  const hasDeliveryIssues = blContainers.some(container => 
    container.deliveryNotPossible
  );

  // Train status is based on container level information only
  return (
    <TrainStatusIcon 
      isScheduled={hasTrainScheduled}
      isDeliveryNotPossible={hasDeliveryIssues}
    />
  );
};

export default function BLTable({ data, isLoading, currentUserGroup }: BLTableProps) {
  const [, setLocation] = useLocation();
  const [sortField, setSortField] = useState<keyof BLWithDetails>('blNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof BLWithDetails) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-600">No shipments found matching your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Changes</TableHead>
            <TableHead className="w-20">Type</TableHead>
            <TableHead className="w-16">DG</TableHead>
            <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('blNumber')}>
              BL/Booking
              {sortField === 'blNumber' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('clientCompany')}>
              Client
              {sortField === 'clientCompany' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead className="w-40">Un/Load Location</TableHead>
            <TableHead className="w-24">POD/POL</TableHead>
            <TableHead className="w-24">ETA/Closing</TableHead>
            <TableHead className="w-20">Containers</TableHead>
            <TableHead className="w-16">Train</TableHead>
            <TableHead className="w-24">Carrier Status</TableHead>
            <TableHead className="w-24">Medlog Status</TableHead>
            <TableHead className="w-24">Carrier</TableHead>
            <TableHead className="w-24">PIC</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((bl) => (
            <TableRow key={bl.id}>
              <TableCell>
                <BLChangeIndicator bl={bl} currentUserGroup={currentUserGroup} onClick={() => {}} />
              </TableCell>
              <TableCell>
                <Badge 
                  className={`text-xs ${
                    bl.direction === 'Import' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {bl.direction}
                </Badge>
              </TableCell>
              <TableCell>
                <DangerousGoodsIndicator bl={bl} />
              </TableCell>
              <TableCell>
                <Link 
                  to={`/bl/${bl.blNumber}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {bl.blNumber}
                </Link>
              </TableCell>
              <TableCell className="font-medium">
                {bl.clientName || '-'}
              </TableCell>
              <TableCell className="max-w-40 truncate">
                {bl.locationName || '-'}
              </TableCell>
              <TableCell>
                {bl.localPortName || '-'}
              </TableCell>
              <TableCell>
                {bl.eta ? new Date(bl.eta).toLocaleDateString('cs-CZ') : '-'}
              </TableCell>
              <TableCell className="text-center">
                {bl.containerCount || 0}
              </TableCell>
              <TableCell>
                <TrainStatusWithDeliveryCheck 
                  bl={bl}
                />
              </TableCell>
              <TableCell>
                <CarrierStatusBadge status={bl.carrierStatus as CarrierStatus} />
              </TableCell>
              <TableCell>
                <MedlogStatusBadge status={bl.medlogStatus as MedlogStatus} />
              </TableCell>
              <TableCell>
                {bl.carrierName || '-'}
              </TableCell>
              <TableCell>
                {bl.picName || '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link to={`/bl/${bl.blNumber}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
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
