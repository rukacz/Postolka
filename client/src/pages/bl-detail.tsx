import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import ContainerList from "@/components/container-list";
import StatusBadge from "@/components/status-badge";
import ChangeIndicatorDot from "@/components/change-indicator-dot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Printer, Scissors, Edit, CheckCircle, MessageCircle } from "lucide-react";
import { BLDetail, Container, BLSummary } from "@shared/schema";
import { BLStatus, UserGroup, CarrierStatus, MedlogStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import TrainStatusIcon from "@/components/train-status-icon";
import { useState } from "react";

export default function BLDetailPage() {
  const [, params] = useRoute("/bl/:blNumber");
  const [, setLocation] = useLocation();
  const blNumber = params?.blNumber;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("containers");
  const [newChatMessage, setNewChatMessage] = useState("");
  
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
      
      <div className="p-6">
        {/* Header with Back Button and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Button>
{/* Change indicator removed for now - will be shown in InfoBar instead */}
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Details – {blDetail.blNumber} – {blDetail.customerName}
            </h1>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Scissors className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/new-order?edit=${blDetail.blNumber}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {blSummary?.hasChanges && (
              <Button 
                onClick={handleAcknowledgeChanges}
                disabled={acknowledgeChangesMutation.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Acknowledge Changes
              </Button>
            )}
          </div>
        </div>

        {/* InfoBar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="font-semibold">{blSummary?.carrier || 'MSC'}</span>
              <span className="text-gray-700">
                {blSummary?.type === 'Import' ? 
                  (blSummary?.podPol || 'N/A') : 
                  (blSummary?.podPol || 'N/A')
                }
              </span>
              <span className="text-gray-700">{blSummary?.vesselVoyage || 'N/A'}</span>
              <span className="text-gray-700">{blSummary?.etaClosing || 'N/A'}</span>
              <span className="text-gray-700">{blSummary?.pic || 'Not assigned'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">
                {blSummary?.lastChatMessage ? 
                  `${blSummary.lastChatAuthor}: ${blSummary.lastChatMessage.substring(0, 30)}${blSummary.lastChatMessage.length > 30 ? '...' : ''}` : 
                  'No messages'
                }
              </span>
              {blSummary?.unreadChatCount && blSummary.unreadChatCount > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {blSummary.unreadChatCount}
                </Badge>
              )}
            </div>
          </div>
        </div>



        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
              {blSummary?.unreadChatCount && blSummary.unreadChatCount > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white ml-1 px-1.5 py-0.5 text-xs">
                  {blSummary.unreadChatCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
          </TabsList>

          <TabsContent value="containers" className="mt-4">
            <ContainerList 
              data={containers} 
              isLoading={isLoadingContainers}
              currentUserGroup={currentUserGroup}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {/* Mock chat messages - in real app these would come from API */}
                  <div className="flex flex-col space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">Martin Novák</span>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-sm">Container MEDU123456 has been loaded and is ready for transport.</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">Petr Svoboda</span>
                        <span className="text-xs text-gray-500">1 hour ago</span>
                      </div>
                      <p className="text-sm">Potvrzeno. ETA updated to 14:30.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // Handle send message
                        setNewChatMessage("");
                      }
                    }}
                  />
                  <Button onClick={() => setNewChatMessage("")}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">Booking Created</p>
                        <p className="text-sm text-gray-600">Initial booking created by Martin Novák</p>
                      </div>
                      <span className="text-xs text-gray-500">3 days ago</span>
                    </div>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">Status Changed</p>
                        <p className="text-sm text-gray-600">Status updated to "In Transit"</p>
                      </div>
                      <span className="text-xs text-gray-500">2 days ago</span>
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">Container Loaded</p>
                        <p className="text-sm text-gray-600">Container MEDU123456 loaded onto vessel</p>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
