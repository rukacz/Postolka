import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { FilterState } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@shared/schema";

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export default function FilterBar({ filters, onFiltersChange, onClearFilters }: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    if (typeof value === 'boolean') {
      onFiltersChange({ ...filters, [key]: value });
    } else {
      onFiltersChange({ ...filters, [key]: value === 'all' ? undefined : value || undefined });
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
          <Select value={filters.client || "all"} onValueChange={(value) => updateFilter('client', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="ŠKODA AUTO">ŠKODA AUTO</SelectItem>
              <SelectItem value="TESCO">TESCO</SelectItem>
              <SelectItem value="IKEA">IKEA</SelectItem>
              <SelectItem value="NTB">NTB</SelectItem>
              <SelectItem value="AUDI">AUDI</SelectItem>
              <SelectItem value="VOLKSWAGEN">VOLKSWAGEN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">POD/POL</Label>
          <Select value={filters.podPol || "all"} onValueChange={(value) => updateFilter('podPol', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All POD/POL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All POD/POL</SelectItem>
              <SelectItem value="HAM CTA">HAM CTA</SelectItem>
              <SelectItem value="HAM CTB">HAM CTB</SelectItem>
              <SelectItem value="HAM CTT">HAM CTT</SelectItem>
              <SelectItem value="BRV MSC">BRV MSC</SelectItem>
              <SelectItem value="BRV NTB">BRV NTB</SelectItem>
              <SelectItem value="Rotterdam">Rotterdam</SelectItem>
              <SelectItem value="Antwerpen">Antwerpen</SelectItem>
              <SelectItem value="Trieste">Trieste</SelectItem>
              <SelectItem value="Koper">Koper</SelectItem>
              <SelectItem value="Gdansk">Gdansk</SelectItem>
              <SelectItem value="Gdynia">Gdynia</SelectItem>
            </SelectContent>
          </Select>
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
          <Select value={filters.medlogStatus || "all"} onValueChange={(value) => updateFilter('medlogStatus', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All Medlog Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Medlog Status</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Changed">Changed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Carrier Status</Label>
          <Select value={filters.carrierStatus || "all"} onValueChange={(value) => updateFilter('carrierStatus', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All Carrier Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carrier Status</SelectItem>
              <SelectItem value="Pre-Order">Pre-Order</SelectItem>
              <SelectItem value="MIPS Send">MIPS Send</SelectItem>
              <SelectItem value="Do Not Release">Do Not Release</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">Carrier</Label>
          <Select value={filters.carrier || "all"} onValueChange={(value) => updateFilter('carrier', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              <SelectItem value="MSC">MSC</SelectItem>
              <SelectItem value="Hapag-Lloyd">Hapag-Lloyd</SelectItem>
              <SelectItem value="ONE">ONE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">PIC</Label>
          <Select value={filters.pic || "all"} onValueChange={(value) => updateFilter('pic', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All PIC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All PIC</SelectItem>
              <SelectItem value="Jan Novák">Jan Novák</SelectItem>
              <SelectItem value="Eva Svobodová">Eva Svobodová</SelectItem>
              <SelectItem value="Tomáš Dvořák">Tomáš Dvořák</SelectItem>
              <SelectItem value="Marie Černá">Marie Černá</SelectItem>
              <SelectItem value="Petr Procházka">Petr Procházka</SelectItem>
            </SelectContent>
          </Select>
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
        
        <div>
          <Button variant="outline" onClick={onClearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
      
      {/* Additional Filter Checkboxes */}
      <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
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
      </div>

    </div>
  );
}
