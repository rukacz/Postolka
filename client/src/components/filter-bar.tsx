import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { FilterState } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Container, Company, User } from "@shared/schema";

import { useAuth } from "@/contexts/auth-context";

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export default function FilterBar({ filters, onFiltersChange, onClearFilters }: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const { hasPermission } = useAuth();

  const updateFilter = (key: keyof FilterState, value: string | boolean | string[] | undefined) => {
    if (typeof value === 'boolean') {
      // Boolean filters (checkboxes)
      onFiltersChange({ ...filters, [key]: value });
    } else if (Array.isArray(value)) {
      // Array filters (MultiSelect)
      // Only set undefined if array is completely empty
      onFiltersChange({ ...filters, [key]: value.length === 0 ? undefined : value });
    } else {
      // String filters (Input, Select, Date)
      // Only set undefined for 'all' value, preserve empty strings for date inputs
      if (value === 'all') {
        onFiltersChange({ ...filters, [key]: undefined });
      } else {
        // Keep the value as is (including empty string for date inputs)
        onFiltersChange({ ...filters, [key]: value });
      }
    }
  };

  // Get all containers for city filtering
  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Get companies for filtering
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Get users for filtering
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Extract unique cities from containers
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    allContainers.forEach(container => {
      if (container.location) cities.add(container.location);
    });
    return Array.from(cities).sort();
  }, [allContainers]);

  // Filter companies by type
  const clientCompanies = useMemo(() => 
    companies.filter(c => c.type === 'Client'), [companies]
  );
  
  const carrierCompanies = useMemo(() => 
    companies.filter(c => c.type === 'Carrier'), [companies]
  );

  // MSC users can only see MSC carriers
  const availableCarriers = useMemo(() => {
    if (hasPermission('view_msc_carriers_only')) {
      return companies.filter(c => c.type === 'MSC');
    }
    return carrierCompanies;
  }, [hasPermission, companies, carrierCompanies]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Client */}
        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <MultiSelect
            id="client"
            options={clientCompanies}
            value={filters.client}
            onChange={(value) => updateFilter('client', value)}
            placeholder="All Clients"
          />
        </div>

        {/* POD/POL */}
        <div className="space-y-2">
          <Label htmlFor="podPol">POD/POL</Label>
          <MultiSelect
            id="podPol"
            options={[
              { value: 'all', label: 'All POD/POL' },
              { value: 'Import', label: 'Import' },
              { value: 'Export', label: 'Export' }
            ]}
            value={filters.direction}
            onChange={(value) => updateFilter('direction', value)}
            placeholder="All POD/POL"
          />
        </div>

        {/* ETA/Closing */}
        <div className="space-y-2">
          <Label htmlFor="eta">ETA/Closing</Label>
          <Input
            id="eta"
            type="date"
            value={filters.eta || ''}
            onChange={(e) => updateFilter('eta', e.target.value)}
            placeholder="dd.mm.rrrr"
          />
        </div>

        {/* Medlog Status */}
        <div className="space-y-2">
          <Label htmlFor="medlogStatus">Medlog Status</Label>
          <MultiSelect
            id="medlogStatus"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'New', label: 'New' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Changed', label: 'Changed' }
            ]}
            value={filters.medlogStatus}
            onChange={(value) => updateFilter('medlogStatus', value)}
            placeholder="All statuses"
          />
        </div>

        {/* Carrier Status */}
        <div className="space-y-2">
          <Label htmlFor="carrierStatus">Carrier Status</Label>
          <MultiSelect
            id="carrierStatus"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'New', label: 'New' },
              { value: 'Pre-Order', label: 'Pre-Order' },
              { value: 'MIPS Send', label: 'MIPS Send' },
              { value: 'Do Not Release', label: 'Do Not Release' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
            value={filters.carrierStatus}
            onChange={(value) => updateFilter('carrierStatus', value)}
            placeholder="All statuses"
          />
        </div>

        {/* Carrier */}
        <div className="space-y-2">
          <Label htmlFor="carrier">Carrier</Label>
          <MultiSelect
            id="carrier"
            options={availableCarriers}
            value={filters.carrier}
            onChange={(value) => updateFilter('carrier', value)}
            placeholder="All Carriers"
          />
        </div>

        {/* PIC */}
        <div className="space-y-2">
          <Label htmlFor="pic">PIC</Label>
          <MultiSelect
            id="pic"
            options={users}
            value={filters.pic}
            onChange={(value) => updateFilter('pic', value)}
            placeholder="All PIC"
          />
        </div>

        {/* Un/Load Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Un/Load Location</Label>
          <Input
            id="location"
            type="text"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
            placeholder="Enter location"
          />
        </div>

        {/* Container Date From */}
        <div className="space-y-2">
          <Label htmlFor="containerDateFrom">Un/Load Date From</Label>
          <Input
            id="containerDateFrom"
            type="date"
            value={filters.containerDateFrom || ''}
            onChange={(e) => updateFilter('containerDateFrom', e.target.value)}
            placeholder="dd.mm.rrrr"
          />
        </div>

        {/* Container Date To */}
        <div className="space-y-2">
          <Label htmlFor="containerDateTo">Un/Load Date To</Label>
          <Input
            id="containerDateTo"
            type="date"
            value={filters.containerDateTo || ''}
            onChange={(e) => updateFilter('containerDateTo', e.target.value)}
            placeholder="dd.mm.rrrr"
          />
        </div>
      </div>
      
      {/* Additional Filter Checkboxes */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dgFilter"
              checked={filters.dgFilter || false}
              onCheckedChange={(checked) => updateFilter('dgFilter', !!checked)}
            />
            <Label htmlFor="dgFilter" className="text-sm font-medium text-gray-700">
              DG
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onlyEdited"
              checked={filters.onlyEdited || false}
              onCheckedChange={(checked) => updateFilter('onlyEdited', !!checked)}
            />
            <Label htmlFor="onlyEdited" className="text-sm font-medium text-gray-700">
              Changed Only
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="newTrain"
              checked={filters.newTrain || false}
              onCheckedChange={(checked) => updateFilter('newTrain', !!checked)}
            />
            <Label htmlFor="newTrain" className="text-sm font-medium text-gray-700">
              New Train
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="deliveryNotPossible"
              checked={filters.deliveryNotPossible || false}
              onCheckedChange={(checked) => updateFilter('deliveryNotPossible', !!checked)}
            />
            <Label htmlFor="deliveryNotPossible" className="text-sm font-medium text-gray-700">
              Delivery not possible
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="importOnly"
              checked={filters.importOnly || false}
              onCheckedChange={(checked) => updateFilter('importOnly', !!checked)}
            />
            <Label htmlFor="importOnly" className="text-sm font-medium text-gray-700">
              Import only
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="exportOnly"
              checked={filters.exportOnly || false}
              onCheckedChange={(checked) => updateFilter('exportOnly', !!checked)}
            />
            <Label htmlFor="exportOnly" className="text-sm font-medium text-gray-700">
              Export only
            </Label>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

    </div>
  );
}
