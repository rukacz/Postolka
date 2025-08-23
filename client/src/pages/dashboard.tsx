import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import FilterBar from "@/components/filter-bar";
import BLTable from "@/components/bl-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, Plus } from "lucide-react";
import { Link } from "wouter";
import { BLSummary, Container } from "@shared/schema";
import { FilterState } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { getDefaultFilters } = useAuth();
  
  // Load default filters from localStorage and auth context on initialization
  const { getDefaultFilters, user } = useAuth();
  const STORAGE_KEY = `defaultFilters:v1:${user?.id ?? "anon"}`;
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const authDefaults = getDefaultFilters();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return authDefaults;
      const parsed = JSON.parse(saved);
      // uživatel má prioritu, nové klíče doplní defaulty
      return { ...authDefaults, ...parsed };
    } catch {
      return authDefaults;
    }
  });
  
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Update filters when user changes (e.g., after login/logout)
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setFilters(prevFilters => ({ ...getDefaultFilters(), ...prevFilters }));
    }
  }, [getDefaultFilters]);

  const { data: blSummaries = [], isLoading, refetch } = useQuery<BLSummary[]>({
    queryKey: ['/api/bl-summaries'],
  });

  // Get all containers for DG filtering
  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Get current user group from auth context instead of hardcoded value
  const { user } = useAuth();
  const currentUserGroup = user?.orgRole === 'msc' ? 'carrier' : 'medlog';

  // Enhanced search that includes containers and trains
  const filteredData = blSummaries.filter(bl => {
    const blContainers = allContainers.filter(container => container.blNumber === bl.blNumber);
    
    const matchesSearch = !searchValue || 
      bl.blNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      bl.client.toLowerCase().includes(searchValue.toLowerCase()) ||
      bl.destination.toLowerCase().includes(searchValue.toLowerCase()) ||
      // Search in container numbers
      blContainers.some(container => 
        container.containerNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        container.destination?.toLowerCase().includes(searchValue.toLowerCase()) ||
        container.unloadAddress?.toLowerCase().includes(searchValue.toLowerCase()) ||
        // Search in train names
        container.trainName?.toLowerCase().includes(searchValue.toLowerCase())
      );

    // Get containers for this BL to check city and date filters (already defined above for search)
    
    // Un/Load City filter - check destinations and unload addresses of containers
    const matchesUnloadCity = !filters.unloadCity || 
      bl.destination?.toLowerCase().includes(filters.unloadCity.toLowerCase()) ||
      blContainers.some(container => 
        container.destination?.toLowerCase().includes(filters.unloadCity?.toLowerCase() || '') ||
        container.unloadAddress?.toLowerCase().includes(filters.unloadCity?.toLowerCase() || '')
      );

    // Un/Load Date filter - check container date/time within range
    const matchesUnloadDateRange = (!filters.unloadDateFrom && !filters.unloadDateTo) ||
      blContainers.some(container => {
        if (!container.dateTime) return false;
        const containerDate = new Date(container.dateTime).toISOString().split('T')[0]; // Get YYYY-MM-DD format
        const fromDate = filters.unloadDateFrom;
        const toDate = filters.unloadDateTo;
        
        return (!fromDate || containerDate >= fromDate) && 
               (!toDate || containerDate <= toDate);
      });

    // Helper function to check multiselect filters
    const matchesMultiSelectFilter = (filterValue: string | string[] | undefined, blValue: string | null) => {
      if (!filterValue || !blValue) return !filterValue;
      if (Array.isArray(filterValue)) {
        return filterValue.length === 0 || filterValue.includes(blValue);
      }
      return filterValue === blValue;
    };

    const matchesFilters = 
      matchesMultiSelectFilter(filters.client, bl.client) &&
      matchesMultiSelectFilter(filters.podPol, bl.podPol) &&
      matchesMultiSelectFilter(filters.medlogStatus, bl.medlogStatus) &&
      matchesMultiSelectFilter(filters.carrierStatus, bl.carrierStatus) &&
      matchesMultiSelectFilter(filters.carrier, bl.carrier) &&
      matchesMultiSelectFilter(filters.pic, bl.pic) &&
      matchesUnloadCity &&
      matchesUnloadDateRange;

    // Handle unseen changes 
    const unseenChangesCount = currentUserGroup === 'medlog' ? (bl.unseenChangesMedlog || 0) : (bl.unseenChangesCarrier || 0);

    // Handle new checkbox filters
    // DG Filter: Check if any containers for this BL have dangerous cargo
    const hasDangerousGoods = blContainers.some(container => container.dangerousCargo);
    const matchesDG = !filters.dgFilter || hasDangerousGoods;

    // Only Edited Filter: Show only BLs with unseen changes
    const matchesOnlyEdited = !filters.onlyEdited || unseenChangesCount > 0;

    // New Train Filter: Check for train-related changes (simplified - check if train is scheduled)
    const matchesNewTrain = !filters.newTrain || bl.trainScheduled;

    // Delivery not possible Filter: For imports where train departure after delivery date
    const matchesDeliveryNotPossible = !filters.deliveryNotPossible || (
      bl.type === 'Import' && 
      blContainers.some(container => {
        if (!container.trainName || !container.trainEtd || !container.dateTime) return false;
        const trainDate = new Date(container.trainEtd);
        const deliveryDate = new Date(container.dateTime);
        return trainDate.getTime() > deliveryDate.getTime();
      })
    );

    // Import Only Filter: Show only Import BLs
    const matchesImportOnly = !filters.importOnly || bl.type === 'Import';

    // Export Only Filter: Show only Export BLs
    const matchesExportOnly = !filters.exportOnly || bl.type === 'Export';

    return matchesSearch && 
           matchesFilters && 
           matchesDG && 
           matchesOnlyEdited && 
           matchesNewTrain && 
           matchesDeliveryNotPossible &&
           matchesImportOnly &&
           matchesExportOnly;
  });

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);



  const handleClearFilters = () => {
    setFilters({});
    setSearchValue("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      
      <div className="p-6">
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Shipment Overview</h2>
            <span className="text-sm text-gray-500">
              Showing {startIndex + 1}-{endIndex} of {totalItems} results
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/new-order">
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        <BLTable data={paginatedData} isLoading={isLoading} currentUserGroup={currentUserGroup} />

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">per page</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-gray-600 hover:bg-gray-50"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={currentPage === page ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="text-gray-600 hover:bg-gray-50"
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-gray-600 hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
