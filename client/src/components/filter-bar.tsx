import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Bookmark } from "lucide-react";
import { FilterState } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export default function FilterBar({ filters, onFiltersChange, onClearFilters }: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const { toast } = useToast();

  const updateFilter = (key: keyof FilterState, value: string | boolean | string[]) => {
    if (typeof value === 'boolean') {
      onFiltersChange({ ...filters, [key]: value });
    } else if (Array.isArray(value)) {
      onFiltersChange({ ...filters, [key]: value.length === 0 ? undefined : value });
    } else {
      onFiltersChange({ ...filters, [key]: value === 'all' ? undefined : value || undefined });
    }
  };

  const saveDefaultFilters = () => {
    try {
      localStorage.setItem('defaultFilters', JSON.stringify(filters));
      toast({
        title: "Success",
        description: "Default filters saved to browser cookies.",
      });
    } catch (error) {
      console.error('Failed to save default filters:', error);
      toast({
        title: "Error",
        description: "Failed to save default filters. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get all containers to extract unique cities
  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Extract unique cities from containers
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    allContainers.forEach(container => {
      if (container.destination) cities.add(container.destination);
      if (container.unloadAddress) cities.add(container.unloadAddress);
    });
    return Array.from(cities).sort();
  }, [allContainers]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="grid grid-cols-10 gap-4 items-end">
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Client</Label>
          <MultiSelect
            options={[
              { label: "ŠKODA AUTO", value: "ŠKODA AUTO" },
              { label: "TESCO", value: "TESCO" },
              { label: "IKEA", value: "IKEA" },
              { label: "NTB", value: "NTB" },
              { label: "AUDI", value: "AUDI" },
              { label: "VOLKSWAGEN", value: "VOLKSWAGEN" }
            ]}
            value={Array.isArray(filters.client) ? filters.client : filters.client ? [filters.client] : []}
            onValueChange={(value) => updateFilter('client', value)}
            placeholder="All Clients"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">POD/POL</Label>
          <MultiSelect
            options={[
              { label: "HAM CTA", value: "HAM CTA" },
              { label: "HAM CTB", value: "HAM CTB" },
              { label: "HAM CTT", value: "HAM CTT" },
              { label: "BRV MSC", value: "BRV MSC" },
              { label: "BRV NTB", value: "BRV NTB" },
              { label: "Rotterdam", value: "Rotterdam" },
              { label: "Antwerpen", value: "Antwerpen" },
              { label: "Trieste", value: "Trieste" },
              { label: "Koper", value: "Koper" },
              { label: "Gdansk", value: "Gdansk" },
              { label: "Gdynia", value: "Gdynia" }
            ]}
            value={Array.isArray(filters.podPol) ? filters.podPol : filters.podPol ? [filters.podPol] : []}
            onValueChange={(value) => updateFilter('podPol', value)}
            placeholder="All POD/POL"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">ETA/Closing</Label>
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
            options={[
              { label: "MSC", value: "MSC" },
              { label: "Hapag-Lloyd", value: "Hapag-Lloyd" },
              { label: "ONE", value: "ONE" }
            ]}
            value={Array.isArray(filters.carrier) ? filters.carrier : filters.carrier ? [filters.carrier] : []}
            onValueChange={(value) => updateFilter('carrier', value)}
            placeholder="All Carriers"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">PIC</Label>
          <MultiSelect
            options={[
              { label: "Jan Novák", value: "Jan Novák" },
              { label: "Eva Svobodová", value: "Eva Svobodová" },
              { label: "Tomáš Dvořák", value: "Tomáš Dvořák" },
              { label: "Marie Černá", value: "Marie Černá" },
              { label: "Petr Procházka", value: "Petr Procházka" }
            ]}
            value={Array.isArray(filters.pic) ? filters.pic : filters.pic ? [filters.pic] : []}
            onValueChange={(value) => updateFilter('pic', value)}
            placeholder="All PIC"
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Un/Load Location</Label>
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
          <Label className="text-sm font-medium text-gray-700 mb-1">Un/Load Date From</Label>
          <Input
            type="date"
            value={filters.unloadDateFrom || ""}
            onChange={(e) => updateFilter('unloadDateFrom', e.target.value)}
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Un/Load Date To</Label>
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
          <Button variant="outline" onClick={saveDefaultFilters} className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Bookmark className="w-4 h-4 mr-2" />
            Set default filters
          </Button>
        </div>
      </div>

    </div>
  );
}
