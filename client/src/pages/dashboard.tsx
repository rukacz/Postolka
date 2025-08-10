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

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({});
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: blSummaries = [], isLoading, refetch } = useQuery<BLSummary[]>({
    queryKey: ['/api/bl-summaries'],
  });

  // Get all containers for DG filtering
  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Simulated current user group - in real app this would come from auth context
  const currentUserGroup = 'medlog'; // 'carrier' | 'medlog'

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

    // Date filter logic - works as interval if both dates set, or single date if only one set
    const matchesDateFilters = (!filters.dateFilter1 && !filters.dateFilter2) ||
      blContainers.some(container => {
        if (!container.dateTime) return false;
        const containerDate = new Date(container.dateTime).toISOString().split('T')[0]; // Get YYYY-MM-DD format
        
        // If both dates are set, use as date range
        if (filters.dateFilter1 && filters.dateFilter2) {
          const fromDate = filters.dateFilter1 <= filters.dateFilter2 ? filters.dateFilter1 : filters.dateFilter2;
          const toDate = filters.dateFilter1 <= filters.dateFilter2 ? filters.dateFilter2 : filters.dateFilter1;
          return containerDate >= fromDate && containerDate <= toDate;
        }
        
        // If only one date is set, match exact date
        const targetDate = filters.dateFilter1 || filters.dateFilter2;
        return containerDate === targetDate;
      }) ||
      // Also check ETA/Closing date on BL level
      (() => {
        if (!bl.etaClosing) return false;
        try {
          const blDate = new Date(bl.etaClosing).toISOString().split('T')[0];
        
          if (filters.dateFilter1 && filters.dateFilter2) {
            const fromDate = filters.dateFilter1 <= filters.dateFilter2 ? filters.dateFilter1 : filters.dateFilter2;
            const toDate = filters.dateFilter1 <= filters.dateFilter2 ? filters.dateFilter2 : filters.dateFilter1;
            return blDate >= fromDate && blDate <= toDate;
          }
        
          const targetDate = filters.dateFilter1 || filters.dateFilter2;
          return blDate === targetDate;
        } catch (e) {
          return false;
        }
      })();

    const matchesFilters = 
      (!filters.client || bl.client === filters.client) &&
      (!filters.podPol || bl.podPol === filters.podPol) &&
      (!filters.medlogStatus || bl.medlogStatus === filters.medlogStatus) &&
      (!filters.carrierStatus || bl.carrierStatus === filters.carrierStatus) &&
      (!filters.carrier || bl.carrier === filters.carrier) &&
      (!filters.pic || bl.pic === filters.pic) &&
      matchesUnloadCity &&
      matchesDateFilters;

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

    return matchesSearch && 
           matchesFilters && 
           matchesDG && 
           matchesOnlyEdited && 
           matchesNewTrain && 
           matchesDeliveryNotPossible;
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
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
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
