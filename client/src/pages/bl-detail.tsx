import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import ContainerTable from "@/components/container-table";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, Scissors, Edit } from "lucide-react";
import { BLDetail, Container } from "@shared/schema";
import { BLStatus } from "@/lib/types";

export default function BLDetailPage() {
  const [, params] = useRoute("/bl/:blNumber");
  const [, setLocation] = useLocation();
  const blNumber = params?.blNumber;

  const { data: blDetail, isLoading: isLoadingDetail } = useQuery<BLDetail>({
    queryKey: ['/api/bl-details', blNumber],
    enabled: !!blNumber,
  });

  const { data: containers = [], isLoading: isLoadingContainers } = useQuery<Container[]>({
    queryKey: ['/api/containers', blNumber],
    enabled: !!blNumber,
  });

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Booking Details - {blDetail.blNumber}
                </h1>
                <p className="text-gray-600">{blDetail.customerName}</p>
              </div>
              <div className="flex space-x-3">
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
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Ref</label>
                <p className="text-sm font-semibold">{blDetail.customerRef}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Ref</label>
                <p className="text-sm font-semibold">{blDetail.blNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Job Type</label>
                <p className="text-sm font-semibold">{blDetail.jobType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Status</label>
                <StatusBadge status={blDetail.status as BLStatus} />
              </div>
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
              <div>
                <label className="text-xs font-medium text-gray-500">From</label>
                <p className="text-sm">{blDetail.fromLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.fromZone}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">To</label>
                <p className="text-sm">{blDetail.toLocation}</p>
                <p className="text-xs text-gray-600">{blDetail.toZone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Vessel & Shipping Info */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vessel & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div>
                <label className="text-xs font-medium text-gray-500">Vessel</label>
                <p className="text-sm">{blDetail.vesselName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Shipping Line</label>
                <p className="text-sm">{blDetail.shippingLine}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">ETA</label>
                <p className="text-sm">{blDetail.eta}</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Contact Info */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div>
                <label className="text-xs font-medium text-gray-500">Customer</label>
                <p className="text-sm">{blDetail.customerName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Contact</label>
                <p className="text-sm">{blDetail.contactName}</p>
                <p className="text-xs text-gray-600">{blDetail.contactPhone}</p>
              </div>
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
