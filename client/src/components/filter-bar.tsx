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

  const updateFilter = (key: keyof FilterState, value: string | boolean | string[]) => {
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
      <div className="grid grid-cols-10 gap-4 items-end">
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Client</Label>
          <MultiSelect
            options={clientCompanies.map(c => ({ label: c.name, value: c.name }))}
            value={Array.isArray(filters.client) ? filters.client : filters.client ? [filters.client] : []}
            onValueChange={(value) => updateFilter('client', value)}
            placeholder="All Clients"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Direction</Label>
          <MultiSelect
            options={[
              { label: "Import", value: "Import" },
              { label: "Export", value: "Export" }
            ]}
            value={Array.isArray(filters.direction) ? filters.direction : filters.direction ? [filters.direction] : []}
            onValueChange={(value) => updateFilter('direction', value)}
            placeholder="All Directions"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">ETA</Label>
          <Input
            type="date"
            value={filters.eta || ""}
            onChange={(e) => updateFilter('eta', e.target.value)}
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Medlog Status</Label>
          <MultiSelect
            options={[
              { label: "New", value: "New" },
              { label: "Approved", value: "Approved" },
              { label: "Rejected", value: "Rejected" },
              { label: "Changed", value: "Changed" }
            ]}
            value={Array.isArray(filters.medlogStatus) ? filters.medlogStatus : filters.medlogStatus ? [filters.medlogStatus] : []}
            onValueChange={(value) => updateFilter('medlogStatus', value)}
            placeholder="All statuses"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Carrier Status</Label>
          <MultiSelect
            options={[
              { label: "Pre-Order", value: "Pre-Order" },
              { label: "MIPS Send", value: "MIPS Send" },
              { label: "Do Not Release", value: "Do Not Release" },
              { label: "Cancelled", value: "Cancelled" }
            ]}
            value={Array.isArray(filters.carrierStatus) ? filters.carrierStatus : filters.carrierStatus ? [filters.carrierStatus] : []}
            onValueChange={(value) => updateFilter('carrierStatus', value)}
            placeholder="All statuses"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Carrier</Label>
          <MultiSelect
            options={availableCarriers.map(c => ({ label: c.name, value: c.name }))}
            value={Array.isArray(filters.carrier) ? filters.carrier : filters.carrier ? [filters.carrier] : []}
            onValueChange={(value) => updateFilter('carrier', value)}
            placeholder="All Carriers"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">PIC</Label>
          <MultiSelect
            options={users.map(u => ({ label: u.name, value: u.name }))}
            value={Array.isArray(filters.pic) ? filters.pic : filters.pic ? [filters.pic] : []}
            onValueChange={(value) => updateFilter('pic', value)}
            placeholder="All PIC"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Container Location</Label>
          <Input
            type="text"
            placeholder="Enter location or select..."
            value={filters.unloadCity || ""}
            onChange={(e) => updateFilter('unloadCity', e.target.value)}
            list="city-suggestions"
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <datalist id="city-suggestions">
            {uniqueCities.map(city => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Container Date From</Label>
          <Input
            type="date"
            value={filters.unloadDateFrom || ""}
            onChange={(e) => updateFilter('unloadDateFrom', e.target.value)}
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Container Date To</Label>
          <Input
            type="date"
            value={filters.unloadDateTo || ""}
            onChange={(e) => updateFilter('unloadDateTo', e.target.value)}
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
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
