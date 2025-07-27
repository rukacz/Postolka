import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import ContainerList from "@/components/container-list";
import StatusBadge from "@/components/status-badge";
import ChangeIndicatorDot from "@/components/change-indicator-dot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, Scissors, Edit, CheckCircle } from "lucide-react";
import { BLDetail, Container, BLSummary } from "@shared/schema";
import { BLStatus, UserGroup, CarrierStatus, MedlogStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import TrainStatusIcon from "@/components/train-status-icon";

export default function BLDetailPage() {
  const [, params] = useRoute("/bl/:blNumber");
  const [, setLocation] = useLocation();
  const blNumber = params?.blNumber;
  const { toast } = useToast();
  
  // Simulated current user group - in real app this would come from auth context
  const currentUserGroup: UserGroup = 'medlog';

  const { data: blDetail, isLoading: isLoadingDetail } = useQuery<BLDetail>({
    queryKey: ['/api/bl-details', blNumber],
    enabled: !!blNumber,
  });

  const { data: containers = [], isLoading: isLoadingContainers } = useQuery<Container[]>({
    queryKey: ['/api/containers', blNumber],
    enabled: !!blNumber,
  });

  const { data: blSummary } = useQuery<BLSummary>({
    queryKey: ['/api/bl-summaries', blNumber],
    enabled: !!blNumber,
  });

  const acknowledgeChangesMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/bl-summaries/${blNumber}/acknowledge-changes`, {
        method: 'POST',
        body: JSON.stringify({ userGroup: currentUserGroup }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Changes acknowledged",
        description: "All changes have been marked as seen.",
      });
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/bl-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-summaries', blNumber] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge changes. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcknowledgeChanges = () => {
    acknowledgeChangesMutation.mutate();
  };

  // Helper function to check if a field has changes
  const isFieldChanged = (fieldName: string): boolean => {
    if (!blSummary?.changedFields) return false;
    return blSummary.changedFields.includes(fieldName);
  };

  // Helper component for changed field styling
  const FieldWrapper = ({ fieldName, children, className = "" }: { 
    fieldName: string; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isChanged = isFieldChanged(fieldName);
    return (
      <div className={`${className} ${isChanged ? 'bg-yellow-100 border-l-4 border-yellow-400 pl-2' : ''}`}>
        {children}
      </div>
    );
  };

  const FieldLabel = ({ fieldName, children }: { fieldName: string; children: React.ReactNode }) => {
    return (
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {children}
      </label>
    );
  };

  if (!blNumber) {
    return <div>Invalid BL number</div>;
  }

  if (isLoadingDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="p-6">
          <div className="text-center">Loading BL details...</div>
        </div>
      </div>
    );
  }

  if (!blDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="p-6">
          <div className="text-center">BL detail not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="p-4">
        {/* Back Navigation */}
        <div className="mb-3">
          <Button
            variant="link"
            onClick={() => setLocation('/')}
            className="text-primary hover:text-blue-700 p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to BL List
          </Button>
        </div>

        {/* BL Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {blDetail.direction === 'Import' ? 'BL Details' : 'Booking Details'} - {blDetail.blNumber} - {blDetail.customerName}
                </h1>
                {blSummary && (() => {
                  // Calculate total changes: booking field changes + container changes
                  const bookingChangesCount = blSummary.changedFields?.length || 0;
                  
                  // Count container-level changes
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
                  
                  return totalUnseenChanges > 0 ? (
                    <div className="flex items-center space-x-2 ml-3">
                      <ChangeIndicatorDot 
                        count={totalUnseenChanges} 
                        type={changeType}
                      />
                      <span className="text-sm text-gray-600">
                        unseen change{totalUnseenChanges > 1 ? 's' : ''}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAcknowledgeChanges}
                        disabled={acknowledgeChangesMutation.isPending}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {acknowledgeChangesMutation.isPending ? "Acknowledging..." : "Acknowledge Changes"}
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Scissors className="w-4 h-4 mr-1" />
                  Split Booking
                </Button>
                <Button className="bg-primary hover:bg-blue-700" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>


          </CardContent>
        </Card>



        {/* Main Content Grid - Compact */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Delivery Information */}
          <Card className="h-fit">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              <FieldWrapper fieldName="fromLocation" className="p-1 rounded">
                <FieldLabel fieldName="fromLocation">From</FieldLabel>
                <p className="text-sm">{blDetail.fromLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.fromZone}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="destination" className="p-1 rounded">
                <FieldLabel fieldName="destination">To</FieldLabel>
                <p className="text-sm">{blDetail.toLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.toZone}</p>
              </FieldWrapper>
            </CardContent>
          </Card>

          {/* Vessel & Shipping Info */}
          <Card className="h-fit">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Vessel & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              <FieldWrapper fieldName="vesselName" className="p-1 rounded">
                <FieldLabel fieldName="vesselName">Vessel</FieldLabel>
                <p className="text-sm">{blDetail.vesselName}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="shippingLine" className="p-1 rounded">
                <FieldLabel fieldName="shippingLine">Shipping Line</FieldLabel>
                <p className="text-sm">{blDetail.shippingLine}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="eta" className="p-1 rounded">
                <FieldLabel fieldName="eta">ETA</FieldLabel>
                <p className="text-sm">{blDetail.eta}</p>
              </FieldWrapper>
            </CardContent>
          </Card>

          {/* Customer & Contact Info */}
          <Card className="h-fit">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Customer & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              <FieldWrapper fieldName="customerName" className="p-1 rounded">
                <FieldLabel fieldName="customerName">Customer</FieldLabel>
                <p className="text-sm">{blDetail.customerName}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="contactName" className="p-1 rounded">
                <FieldLabel fieldName="contactName">Contact</FieldLabel>
                <p className="text-sm">{blDetail.contactName}</p>
                <p className="text-xs text-gray-600">{blDetail.contactPhone}</p>
              </FieldWrapper>
            </CardContent>
          </Card>
        </div>

        {/* Container Management Section */}
        <Card>
          {/* Tab Navigation */}
          <Tabs defaultValue="jobs" className="w-full">
            <div className="border-b px-4 pt-3">
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="log">Log</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="jobs" className="mt-0">
              <ContainerList 
                data={containers} 
                isLoading={isLoadingContainers}
                currentUserGroup={currentUserGroup}
              />
            </TabsContent>

            <TabsContent value="notes" className="p-6">
              <div className="text-center text-gray-500">
                Notes functionality will be implemented here
              </div>
            </TabsContent>

            <TabsContent value="log" className="p-6">
              <div className="text-center text-gray-500">
                Log functionality will be implemented here
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
