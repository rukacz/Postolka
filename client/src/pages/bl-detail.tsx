import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import ContainerTable from "@/components/container-table";
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
      <div className={`${className} ${isChanged ? 'bg-yellow-100 border-l-4 border-yellow-400 pl-3' : ''}`}>
        {children}
      </div>
    );
  };

  const FieldLabel = ({ fieldName, children }: { fieldName: string; children: React.ReactNode }) => {
    return (
      <label className="text-xs font-medium text-gray-500">
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
      
      <div className="p-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="link"
            onClick={() => setLocation('/')}
            className="text-primary hover:text-blue-700 p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BL List
          </Button>
        </div>

        {/* BL Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Booking Details - {blDetail.blNumber}
                  </h1>
                  <p className="text-gray-600">{blDetail.customerName}</p>
                </div>
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
                    <div className="flex items-center space-x-2">
                      <ChangeIndicatorDot 
                        count={totalUnseenChanges} 
                        type={changeType}
                      />
                      <span className="text-sm text-gray-600">
                        {totalUnseenChanges} unseen change{totalUnseenChanges > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="flex space-x-3">
                {blSummary && (() => {
                  const bookingChangesCount = blSummary.changedFields?.length || 0;
                  const containerChangesCount = containers.reduce((total, container) => {
                    return total + (container.changedFields?.length || 0);
                  }, 0);
                  const totalUnseenChanges = bookingChangesCount + containerChangesCount;
                  
                  return totalUnseenChanges > 0 ? (
                    <Button 
                      variant="outline" 
                      onClick={handleAcknowledgeChanges}
                      disabled={acknowledgeChangesMutation.isPending}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {acknowledgeChangesMutation.isPending ? "Acknowledging..." : "Acknowledge Changes"}
                    </Button>
                  ) : null;
                })()}
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Connotes
                </Button>
                <Button variant="outline">
                  <Scissors className="w-4 h-4 mr-2" />
                  Split Booking
                </Button>
                <Button className="bg-primary hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Header Info Bar */}
            <div className="grid grid-cols-4 gap-6 py-4 border-t">
              <FieldWrapper fieldName="customerRef" className="p-2 rounded">
                <FieldLabel fieldName="customerRef">Customer Ref</FieldLabel>
                <p className="text-sm font-semibold">{blDetail.customerRef}</p>
              </FieldWrapper>
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Ref</label>
                <p className="text-sm font-semibold">{blDetail.blNumber}</p>
              </div>
              <FieldWrapper fieldName="jobType" className="p-2 rounded">
                <FieldLabel fieldName="jobType">Job Type</FieldLabel>
                <p className="text-sm font-semibold">{blDetail.jobType}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="status" className="p-2 rounded">
                <FieldLabel fieldName="status">Booking Status</FieldLabel>
                <StatusBadge status={blDetail.status as BLStatus} />
              </FieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Overview Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shipment Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-6">
              <FieldWrapper fieldName="carrierStatus" className="p-2 rounded">
                <FieldLabel fieldName="carrierStatus">Carrier Status</FieldLabel>
                {blSummary && (
                  <CarrierStatusBadge status={blSummary.carrierStatus as CarrierStatus} />
                )}
              </FieldWrapper>
              <FieldWrapper fieldName="medlogStatus" className="p-2 rounded">
                <FieldLabel fieldName="medlogStatus">Medlog Status</FieldLabel>
                {blSummary && (
                  <MedlogStatusBadge status={blSummary.medlogStatus as MedlogStatus} />
                )}
              </FieldWrapper>
              <FieldWrapper fieldName="trainScheduled" className="p-2 rounded">
                <FieldLabel fieldName="trainScheduled">Train</FieldLabel>
                {blSummary && (
                  <TrainStatusIcon isScheduled={blSummary.trainScheduled} />
                )}
              </FieldWrapper>
              <FieldWrapper fieldName="weight" className="p-2 rounded">
                <FieldLabel fieldName="weight">Weight</FieldLabel>
                <p className="text-sm font-semibold">{blSummary?.weight || '-'}</p>
              </FieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid - Compact */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Delivery Information */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <FieldWrapper fieldName="fromLocation" className="p-2 rounded">
                <FieldLabel fieldName="fromLocation">From</FieldLabel>
                <p className="text-sm">{blDetail.fromLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.fromZone}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="destination" className="p-2 rounded">
                <FieldLabel fieldName="destination">To</FieldLabel>
                <p className="text-sm">{blDetail.toLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.toZone}</p>
              </FieldWrapper>
            </CardContent>
          </Card>

          {/* Vessel & Shipping Info */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vessel & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <FieldWrapper fieldName="vesselName" className="p-2 rounded">
                <FieldLabel fieldName="vesselName">Vessel</FieldLabel>
                <p className="text-sm">{blDetail.vesselName}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="shippingLine" className="p-2 rounded">
                <FieldLabel fieldName="shippingLine">Shipping Line</FieldLabel>
                <p className="text-sm">{blDetail.shippingLine}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="eta" className="p-2 rounded">
                <FieldLabel fieldName="eta">ETA</FieldLabel>
                <p className="text-sm">{blDetail.eta}</p>
              </FieldWrapper>
            </CardContent>
          </Card>

          {/* Customer & Contact Info */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <FieldWrapper fieldName="customerName" className="p-2 rounded">
                <FieldLabel fieldName="customerName">Customer</FieldLabel>
                <p className="text-sm">{blDetail.customerName}</p>
              </FieldWrapper>
              <FieldWrapper fieldName="contactName" className="p-2 rounded">
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
            <div className="border-b px-6 pt-4">
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="log">Log</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="jobs" className="mt-0">
              <ContainerTable 
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
