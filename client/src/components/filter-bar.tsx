import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, Plus } from "lucide-react";
import { FilterState } from "@/lib/types";

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function FilterBar({ filters, onFiltersChange, onApplyFilters, onClearFilters }: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value === 'all' ? undefined : value || undefined });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="grid grid-cols-8 gap-4 items-end">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1">BL/Booking</Label>
          <Input
            type="text"
            placeholder="Enter BL number"
            value={filters.blNumber || ""}
            onChange={(e) => updateFilter('blNumber', e.target.value)}
            className="focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
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
              <SelectItem value="Hamburg">Hamburg</SelectItem>
              <SelectItem value="Bremerhaven">Bremerhaven</SelectItem>
              <SelectItem value="Koper">Koper</SelectItem>
              <SelectItem value="Rotterdam">Rotterdam</SelectItem>
              <SelectItem value="Antwerp">Antwerp</SelectItem>
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
          <Label className="text-sm font-medium text-gray-700 mb-1">Status</Label>
          <Select value={filters.status || "all"} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Attention Required">Attention Required</SelectItem>
              <SelectItem value="Issues">Issues</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
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
        
        <div className="flex space-x-2">
          <Button onClick={onApplyFilters} className="bg-primary hover:bg-blue-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" onClick={onClearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
      
      <div className="mt-3">
        <Button
          variant="link"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="text-primary text-sm font-medium p-0 h-auto"
        >
          <Plus className="w-3 h-3 mr-1" />
          More Filters
        </Button>
      </div>
    </div>
  );
}
