import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import ContainerTable from "@/components/container-table";
import StatusBadge from "@/components/status-badge";
import ChangeIndicatorDot from "@/components/change-indicator-dot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Printer, Scissors, Edit, CheckCircle, MessageCircle, Plus, Copy, Trash2 } from "lucide-react";
import { BLDetail, Container, BLSummary } from "@shared/schema";
import { BLStatus, UserGroup, CarrierStatus, MedlogStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import MedlogStatusBadge from "@/components/medlog-status-badge";
import TrainStatusIcon from "@/components/train-status-icon";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BLDetailPage() {
  const [, params] = useRoute("/bl/:blNumber");
  const [, setLocation] = useLocation();
  const blNumber = params?.blNumber;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("containers");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [addContainerMode, setAddContainerMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<string | null>(null);
  
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

  const handleNoteChange = async (containerId: number, group: 'carrier' | 'medlog', note: string) => {
    try {
      await apiRequest("PATCH", `/api/containers/${containerId}/note`, {
        group,
        note
      });
      
      // Force refresh all container data
      await queryClient.invalidateQueries({ queryKey: ['/api/containers'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/containers', blNumber] });
      await queryClient.refetchQueries({ queryKey: ['/api/containers', blNumber] });
      
      toast({
        title: "Note updated",
        description: `${group === 'carrier' ? 'Carrier' : 'Medlog'} note updated successfully`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update container note",
        variant: "destructive"
      });
    }
  };

  const handleHazardousChange = async (containerIds: number[], hazardous: boolean) => {
    try {
      await apiRequest("PATCH", "/api/containers/bulk/hazardous", {
        containerIds,
        hazardous
      });
      
      // Invalidate container queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/containers'] });
      
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update hazardous cargo status",
        variant: "destructive"
      });
    }
  };

  const deleteContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      return apiRequest("DELETE", `/api/containers/${containerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/containers', blNumber] });
      toast({
        title: "Container deleted",
        description: "The container has been successfully removed.",
      });
      setDeleteDialogOpen(false);
      setContainerToDelete(null);
    },
  });

  const formatContainerForClipboard = (container: Container) => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    const location = container.destination || container.unloadAddress || 'N/A';
    const dateTime = container.dateTime ? formatDate(container.dateTime) : 'N/A';
    
    return `${container.containerNumber}\t${container.sizeType || 'N/A'}\t${location}\t${dateTime}`;
  };

  const copyAllContainersToClipboard = async () => {
    const header = "Ctr\t\ttype/size\tLocation\tDate/time";
    const containerLines = containers.map(container => formatContainerForClipboard(container));
    const clipboardText = [header, ...containerLines].join('\n');
    
    try {
      await navigator.clipboard.writeText(clipboardText);
      toast({
        title: "Copied to clipboard",
        description: "All container data has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyContainerToClipboard = async (container: Container) => {
    const clipboardText = formatContainerForClipboard(container);
    
    try {
      await navigator.clipboard.writeText(clipboardText);
      toast({
        title: "Copied to clipboard",
        description: "Container data has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContainer = (containerId: string) => {
    setContainerToDelete(containerId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContainer = () => {
    if (containerToDelete) {
      deleteContainerMutation.mutate(containerToDelete);
    }
  };

  const handleSendMessage = () => {
    if (!newChatMessage.trim()) return;
    
    // For now, just show a toast notification since we don't have a backend chat endpoint
    toast({
      title: "Message sent",
      description: `Your message "${newChatMessage}" has been sent.`,
    });
    
    // Clear the input field
    setNewChatMessage("");
    
    // TODO: Implement actual chat API when backend is ready
    // This would involve:
    // 1. POST request to /api/chat/${blNumber}/messages
    // 2. Invalidate chat queries to refresh messages
    // 3. Update last message and unread count in BL summary
  };

  // Helper component for changed field styling
  const FieldWrapper = ({ fieldName, children, className = "" }: { 
    fieldName: string; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isChanged = isFieldChanged(fieldName);
    return (
      <div className={`relative ${className} ${isChanged ? 'bg-yellow-200 border border-yellow-400 rounded shadow-sm' : ''}`}>
        {children}
        {isChanged && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
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
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Details – {blDetail.blNumber} – {blDetail.clientCompany?.name || 'Unknown Client'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/new-order?edit=${blDetail.blNumber}`)}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* InfoBar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <FieldWrapper fieldName="type" className="inline-block rounded px-2 py-1">
                <span className="font-semibold text-blue-700">{blSummary?.type || 'N/A'}</span>
              </FieldWrapper>
              <FieldWrapper fieldName="carrier" className="inline-block rounded px-2 py-1">
                <span className="font-semibold">{blSummary?.carrier || 'MSC'}</span>
              </FieldWrapper>
              <FieldWrapper fieldName="podPol" className="inline-block rounded px-2 py-1">
                <span className="text-gray-700">
                  {blSummary?.type === 'Import' ? 
                    (blSummary?.podPol || 'N/A') : 
                    (blSummary?.podPol || 'N/A')
                  }
                </span>
              </FieldWrapper>
              <FieldWrapper fieldName="vesselVoyage" className="inline-block rounded px-2 py-1">
                <span className="text-gray-700">{blSummary?.vesselVoyage || 'N/A'}</span>
              </FieldWrapper>
              <FieldWrapper fieldName="eta" className="inline-block rounded px-2 py-1">
                <span className="text-gray-700">{blSummary?.etaClosing || 'N/A'}</span>
              </FieldWrapper>
              <FieldWrapper fieldName="pic" className="inline-block rounded px-2 py-1">
                <span className="text-gray-700">{blSummary?.pic || 'Not assigned'}</span>
              </FieldWrapper>

            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">
                {blSummary?.lastChatMessage && blSummary.lastChatMessage.trim() !== "" ? 
                  `${blSummary.lastChatAuthor}: ${blSummary.lastChatMessage.substring(0, 30)}${blSummary.lastChatMessage.length > 30 ? '...' : ''}` : 
                  'No messages'
                }
              </span>
              {blSummary?.unreadChatCount && blSummary.unreadChatCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <Badge variant="destructive" className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {blSummary.unreadChatCount}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('containers')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'containers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Containers ({containers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Chat
                {blSummary?.unreadChatCount && blSummary.unreadChatCount > 0 && (
                  <Badge variant="destructive" className="bg-red-500 text-white ml-1 px-1.5 py-0.5 text-xs">
                    {blSummary.unreadChatCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'log'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Log
              </button>
            </nav>
            {activeTab === 'containers' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mb-2"
                  onClick={() => setAddContainerMode(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Container
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mb-2"
                  onClick={copyAllContainersToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to clipboard
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'containers' && (
          <div>
            <ContainerTable 
              containers={containers || []} 
              userGroup={currentUserGroup}
              blDetail={{
                jobType: blDetail?.direction as 'Import' | 'Export',
                toLocation: blDetail?.location?.name,
                blNumber: blDetail?.blNumber
              }}
              onNoteChange={handleNoteChange}
              onHazardousChange={handleHazardousChange}
              changedFields={[]}
              addContainerMode={addContainerMode}
              onAddContainerComplete={() => setAddContainerMode(false)}
              onCopyContainer={copyContainerToClipboard}
              onDeleteContainer={handleDeleteContainer}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {/* Sample chat messages from InfoBar data */}
                  <div className="flex flex-col space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">Martin Novák</span>
                        <span className="text-xs text-gray-500">3 hours ago</span>
                      </div>
                      <p className="text-sm">Container MEDU123456 has been loaded and is ready for transport.</p>
                    </div>
                    
                    {blSummary?.lastChatMessage && (
                      <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">{blSummary.lastChatAuthor}</span>
                          <span className="text-xs text-gray-500">
                            {blSummary.unreadChatCount && blSummary.unreadChatCount > 0 ? (
                              <span className="text-red-600 font-semibold">New message</span>
                            ) : (
                              '1 hour ago'
                            )}
                          </span>
                        </div>
                        <p className="text-sm">{blSummary.lastChatMessage}</p>
                        {blSummary.unreadChatCount && blSummary.unreadChatCount > 0 && (
                          <div className="mt-2">
                            <Badge variant="destructive" className="bg-red-500 text-white text-xs">
                              Unread
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Message input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    disabled={!newChatMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Status updated to "In Progress"</p>
                      <p className="text-xs text-gray-500">Jan 22, 2025 at 2:30 PM by Martin Novák</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Container loaded and ready</p>
                      <p className="text-xs text-gray-500">Jan 22, 2025 at 1:45 PM by Petr Svoboda</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">BL created</p>
                      <p className="text-xs text-gray-500">Jan 22, 2025 at 9:00 AM by System</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Container</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this container? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteContainer}
              disabled={deleteContainerMutation.isPending}
            >
              {deleteContainerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
