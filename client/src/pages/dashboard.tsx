import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import FilterBar from "@/components/filter-bar";
import BLTable from "@/components/bl-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, Plus } from "lucide-react";
import { Link } from "wouter";
import { BL, Container, Company, User } from "@shared/schema";
import { FilterState } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

// Extended BL type with company and user information
interface BLWithDetails extends BL {
  clientCompany?: Company;
  carrierCompany?: Company;
  picUser?: User;
  localPortInfo?: { name: string; state: string };
  locationCity?: { name: string; state: string };
}

export default function Dashboard() {
  const { hasPermission } = useAuth();
  
  // Load filters from localStorage on initialization
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      // Get saved user filters from localStorage
      const savedUserFilters = localStorage.getItem('userFilters');
      return savedUserFilters ? JSON.parse(savedUserFilters) : {};
    } catch (error) {
      console.error('Failed to load user filters:', error);
      return {};
    }
  });
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Save user filters to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save user filters to localStorage, don't save auth defaults
      const userFilters = { ...filters };
      
      // Remove any undefined values to keep localStorage clean
      Object.keys(userFilters).forEach(key => {
        if (userFilters[key as keyof FilterState] === undefined) {
          delete userFilters[key as keyof FilterState];
        }
      });
      
      if (Object.keys(userFilters).length > 0) {
        localStorage.setItem('userFilters', JSON.stringify(userFilters));
      } else {
        localStorage.removeItem('userFilters');
      }
    } catch (error) {
      console.error('Failed to save user filters:', error);
    }
  }, [filters]);

  // Fetch BLs with company and user details
  const { data: bls = [], isLoading, refetch } = useQuery<BLWithDetails[]>({
    queryKey: ['/api/bls'],
  });

  // Get all containers for filtering
  const { data: allContainers = [] } = useQuery<Container[]>({
    queryKey: ['/api/containers'],
  });

  // Get container-BL relationships for filtering
  const { data: containerInBls = [] } = useQuery({
    queryKey: ['/api/container-in-bl'],
  });

  // Get companies for filtering
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Get users for filtering
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get current user group from auth context
  const { user } = useAuth();
  const currentUserGroup = user?.companyType === 'MSC' ? 'carrier' : 'medlog';

  // Enhanced search that includes containers and trains
  const matchesMultiSelectFilter = (blValue: any, filterValue: string[] | undefined) => {
    if (!filterValue || filterValue.length === 0 || filterValue.includes('all')) {
      return true;
    }
    if (!blValue) return false; // ✅ Bezpečný access
    return filterValue.includes(blValue);
  };

  const filteredData = useMemo(() => {
    return bls.filter((bl) => {
      // Get containers for this BL using the junction table
      const blContainerIds = containerInBls
        .filter((cib: any) => cib.blId === bl.id)
        .map((cib: any) => cib.containerId) || [];
      
      const blContainers = allContainers.filter(container => 
        blContainerIds.includes(container.id)
      );

      // Get company names for search
      const clientCompany = companies.find(c => c.id === bl.client);
      const carrierCompany = companies.find(c => c.id === bl.carrier);
      const picUser = users.find(u => u.id === bl.pic);
      
      const matchesSearch = !searchValue || 
        bl.blNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        clientCompany?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        carrierCompany?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        picUser?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        // Search in container numbers
        blContainers.some(container => 
          container.containerIlu.toLowerCase().includes(searchValue.toLowerCase()) ||
          container.location?.toLowerCase().includes(searchValue.toLowerCase()) ||
          container.train?.toLowerCase().includes(searchValue.toLowerCase())
        );

      // Handle unseen changes based on change tracking fields
      const hasChanges = bl.blNumberChange || bl.picChange || bl.clientChange || 
                        bl.containerChange || bl.directionChange || bl.etaChange ||
                        bl.hasDangerousChange || bl.hasDtChange || bl.localPortChange ||
                        bl.medlogStatusChange || bl.carrierStatusChange || bl.locationChange ||
                        bl.medlogBulbChange || bl.carrierBulbChange ||
                        bl.vesselChange || bl.voyageChange;

      // MSC users can only see MSC carriers
      if (hasPermission('view_msc_carriers_only') && carrierCompany?.type !== 'MSC') {
        return false;
      }

      // Handle new checkbox filters
      // DG Filter: Check if BL has dangerous goods
      const matchesDG = !filters.dgFilter || bl.hasDangerous;

      // Only Edited Filter: Show only BLs with changes
      const matchesOnlyEdited = !filters.onlyEdited || hasChanges;

      // New Train Filter: BL with green train (has train) AND trainChange=true
      const matchesNewTrain = !filters.newTrain || 
        blContainers.some(container => container.train && container.trainChange);

      // Delivery not possible Filter: BL with red train (deliveryNotPossible=true)
      const matchesDeliveryNotPossible = !filters.deliveryNotPossible || 
        blContainers.some(container => container.deliveryNotPossible);

      // Debug logs for filters
      if (filters.newTrain) {
        console.log(`BL ${bl.blNumber} - New Train filter:`);
        console.log('- blContainers:', blContainers);
        console.log('- containers with train:', blContainers.filter(c => c.train));
        console.log('- containers with trainChange:', blContainers.filter(c => c.trainChange));
        console.log('- matchesNewTrain:', matchesNewTrain);
      }
      
      if (filters.deliveryNotPossible) {
        console.log(`BL ${bl.blNumber} - Delivery Not Possible filter:`);
        console.log('- blContainers:', blContainers);
        console.log('- containers with deliveryNotPossible:', blContainers.filter(c => c.deliveryNotPossible));
        console.log('- matchesDeliveryNotPossible:', matchesDeliveryNotPossible);
      }

      // Import Only Filter: Show only Import BLs
      const matchesImportOnly = !filters.importOnly || bl.direction === 'Import';

      // Export Only Filter: Show only Export BLs
      const matchesExportOnly = !filters.exportOnly || bl.direction === 'Export';

      // Client Filter: Check if BL matches selected client
      const matchesClient = !filters.client || filters.client.length === 0 || 
                           filters.client.includes('all') || 
                           filters.client.includes(bl.client.toString());

      // Carrier Filter: Check if BL matches selected carrier
      const matchesCarrier = !filters.carrier || filters.carrier.length === 0 || 
                            filters.carrier.includes('all') || 
                            filters.carrier.includes(bl.carrier.toString());

      // PIC Filter: Check if BL matches selected PIC
      const matchesPic = !filters.pic || filters.pic.length === 0 || 
                        filters.pic.includes('all') || 
                        filters.pic.includes(bl.pic?.toString() || '');

      // Medlog Status Filter: Check if BL matches selected medlog status
      const matchesMedlogStatus = !filters.medlogStatus || filters.medlogStatus.length === 0 || 
                                 filters.medlogStatus.includes('all') || 
                                 filters.medlogStatus.includes(bl.medlogStatus);

      // Carrier Status Filter: Check if BL matches selected carrier status
      const matchesCarrierStatus = !filters.carrierStatus || filters.carrierStatus.length === 0 || 
                                  filters.carrierStatus.includes('all') || 
                                  filters.carrierStatus.includes(bl.carrierStatus);

      // Direction Filter: Check if BL matches selected direction
      const matchesDirection = !filters.direction || filters.direction.length === 0 || 
                              filters.direction.includes('all') || 
                              filters.direction.includes(bl.direction);

      return matchesSearch && 
             matchesClient && matchesCarrier && matchesPic &&
             matchesMedlogStatus && matchesCarrierStatus && matchesDirection &&
             matchesDG && matchesOnlyEdited && matchesNewTrain && 
             matchesDeliveryNotPossible && matchesImportOnly && matchesExportOnly;
    }) || [];
  }, [bls, filters, searchValue, containerInBls, allContainers, companies, users, hasPermission]);

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
    // Clear user filters from localStorage
    try {
      localStorage.removeItem('userFilters');
    } catch (error) {
      console.error('Failed to clear user filters from localStorage:', error);
    }
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
