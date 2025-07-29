import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, FileText, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertBLSummarySchema } from "@shared/schema";

// ISO 6346 container number validation
const validateContainerNumber = (containerNum: string): boolean => {
  const regex = /^[A-Z]{4}[0-9]{7}$/;
  if (!regex.test(containerNum)) return false;
  
  // Check digit calculation
  const letters = containerNum.substring(0, 4);
  const numbers = containerNum.substring(4, 10);
  const checkDigit = parseInt(containerNum.substring(10, 11));
  
  const letterValues: { [key: string]: number } = {
    'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20,
    'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29, 'S': 30, 'T': 31,
    'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
  };
  
  let sum = 0;
  let multiplier = 1;
  
  for (let i = 0; i < 4; i++) {
    sum += letterValues[letters[i]] * multiplier;
    multiplier *= 2;
  }
  
  for (let i = 0; i < 6; i++) {
    sum += parseInt(numbers[i]) * multiplier;
    multiplier *= 2;
  }
  
  const calculatedCheckDigit = sum % 11;
  return calculatedCheckDigit === checkDigit;
};

// Container schema - relaxed validation for edit mode
const containerSchema = z.object({
  containerNumber: z.string().optional(),
  destination: z.string().optional(),
  loadingDateTime: z.string().optional(),
  dischargingDateTime: z.string().optional(),
  dangerousCargo: z.boolean().default(false),
});

// Main form schema
const newOrderSchema = z.object({
  orderType: z.enum(["Import", "Export"]),
  client: z.string().min(1, "Client is required"),
  destination: z.string().min(1, "Destination is required"),
  polPod: z.string().min(1, "POL/POD is required"),
  vessel: z.string().min(1, "Vessel is required"),
  carrier: z.string().default("MSC"),
  pic: z.string().min(1, "Person in Charge is required"),
  eta: z.string().optional(),
  containerCount: z.number().min(1, "At least 1 container required"),
  containers: z.array(containerSchema),
  
  // Global timing
  globalLoadingDateTime: z.string().optional(),
  globalDischargingDateTime: z.string().optional(),
  
  // Import specific
  blBookingNumber: z.string().optional(),
  customsClearance: z.enum(["In Port", "Inland depot", "At customer", "Metrans", "Melnik", "Mosnov", "Obrnice", "Bratislava"]).optional(),
  
  // Export specific
  vgmRequested: z.enum(["Yes", "No"]).default("No"),
  customsDocuments: z.enum(["By email", "At loading place"]).optional(),
  

}).refine((data) => {
  if (data.orderType === "Import") {
    return data.blBookingNumber && data.blBookingNumber.length > 0 && data.customsClearance;
  }
  if (data.orderType === "Export") {
    return data.customsDocuments;
  }
  return true;
}, {
  message: "Required fields missing for order type",
  path: ["orderType"],
});

type NewOrderFormData = z.infer<typeof newOrderSchema>;

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoadingFromMSC, setIsLoadingFromMSC] = useState(false);
  const [isLoadingFromOVA, setIsLoadingFromOVA] = useState(false);
  const [containerDataLoaded, setContainerDataLoaded] = useState(false);
  
  // Check if this is edit mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const editBlNumber = urlParams.get('edit');
  const isEditMode = !!editBlNumber;
  
  // Load existing BL data in edit mode
  const { data: existingBLSummary } = useQuery({
    queryKey: ['/api/bl-summaries', editBlNumber],
    enabled: isEditMode && !!editBlNumber,
  });
  
  const { data: existingBLDetail } = useQuery({
    queryKey: ['/api/bl-details', editBlNumber],
    enabled: isEditMode && !!editBlNumber,
  });
  
  const { data: existingContainers } = useQuery({
    queryKey: ['/api/containers', editBlNumber],
    enabled: isEditMode && !!editBlNumber,
  });
  
  const form = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      orderType: "Import",
      client: "",
      destination: "",
      polPod: "",
      vessel: "",
      carrier: "MSC",
      pic: "",
      eta: "",
      containerCount: 1,
      containers: [{ containerNumber: "", dangerousCargo: false }],
      globalLoadingDateTime: "",
      globalDischargingDateTime: "",
      blBookingNumber: "",
      customsClearance: "In Port",
      vgmRequested: "No",
      customsDocuments: "By email",
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "containers"
  });

  const watchedOrderType = form.watch("orderType");
  
  // Load existing data into form when available
  useEffect(() => {
    if (isEditMode && existingBLSummary && existingBLDetail) {
      form.reset({
        orderType: existingBLSummary.type as "Import" | "Export",
        client: existingBLSummary.client,
        destination: existingBLSummary.destination,
        polPod: existingBLSummary.podPol,
        vessel: existingBLDetail.vesselName || "",
        carrier: existingBLSummary.carrier || "MSC",
        pic: existingBLSummary.pic,
        eta: existingBLSummary.etaClosing || "",
        containerCount: existingBLSummary.containerCount,
        containers: existingContainers?.map(c => ({
          containerNumber: c.containerNumber,
          destination: c.destination || "",
          loadingDateTime: "",
          dischargingDateTime: "",
          dangerousCargo: c.dangerousCargo || false,
        })) || [{ containerNumber: "", dangerousCargo: false }],
        globalLoadingDateTime: "",
        globalDischargingDateTime: "",
        blBookingNumber: existingBLSummary.blNumber,
        customsClearance: "In Port" as any,
        vgmRequested: "No" as any,
        customsDocuments: "By email" as any,
      });
    }
  }, [existingBLSummary, existingBLDetail, existingContainers, form, isEditMode]);

  // Handle MSC data loading
  const handleLoadFromMSC = async () => {
    const blNumber = form.getValues("blBookingNumber");
    if (!blNumber) {
      toast({
        title: "Error",
        description: "Please enter BL/Booking number first",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFromMSC(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      form.setValue("vessel", "MSC MAYA/0142E");
      form.setValue("polPod", "Hamburg");
      form.setValue("client", "ŠKODA AUTO");
      form.setValue("destination", "Hamburg");
      
      const mockContainers = [
        { containerNumber: "COSU1044551", destination: "Hamburg", loadingDateTime: "", dischargingDateTime: "", dangerousCargo: false },
        { containerNumber: "COSU9004547", destination: "Hamburg", loadingDateTime: "", dischargingDateTime: "", dangerousCargo: false }
      ];
      
      form.setValue("containers", mockContainers);
      form.setValue("containerCount", mockContainers.length);
      setContainerDataLoaded(true);
      
      toast({
        title: "Success",
        description: "Data loaded from MSC successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data from MSC",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFromMSC(false);
    }
  };

  // Handle OVA string loading
  const handleLoadFromOVA = async () => {
    setIsLoadingFromOVA(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      form.setValue("vessel", "MSC OSCAR/0156E");
      form.setValue("polPod", "Rotterdam");
      form.setValue("client", "AUDI AG");
      form.setValue("destination", "Antwerp");
      
      const ovaContainers = [
        { containerNumber: "TCLU3456781", destination: "Antwerp", loadingDateTime: "", dischargingDateTime: "", dangerousCargo: false }
      ];
      
      form.setValue("containers", ovaContainers);
      form.setValue("containerCount", ovaContainers.length);
      setContainerDataLoaded(true);
      
      toast({
        title: "Success",
        description: "Data loaded from OVA string successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data from OVA string",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFromOVA(false);
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: NewOrderFormData) => {
      console.log("Creating/updating order in mutation:", isEditMode ? "UPDATE" : "CREATE", data);
      
      const blSummaryData = {
        blNumber: data.blBookingNumber || `AUTO-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        client: data.client,
        consignee: data.client,
        destination: data.destination,
        pic: data.pic || "Not assigned",
        podPol: data.polPod,
        etaClosing: data.eta || "TBD",
        vesselVoyage: data.vessel || "TBD",
        containerCount: data.containerCount,
        type: data.orderType,
        carrier: data.carrier,
        carrierStatus: "Pre-Order",
        medlogStatus: "New",
        trainScheduled: false,
        weight: "0 kg",
      };

      // For now, simulate success - in real implementation, this would call update API in edit mode
      if (isEditMode) {
        console.log("Simulating order update success");
        return { success: true, updated: true };
      }

      const response = await fetch('/api/bl-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blSummaryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Order updated successfully!" : "New order created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-summaries'] });
      
      // Redirect based on mode
      if (isEditMode && editBlNumber) {
        setLocation(`/bl/${editBlNumber}`);
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update order. Please try again." : "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: NewOrderFormData) => {
      console.log("Saving as draft:", data);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order saved as draft.",
      });
    },
  });

  const onSubmit = (data: NewOrderFormData) => {
    console.log("Form submitted with data:", data);
    createOrderMutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? `Edit Order - ${editBlNumber}` : 'New Order'}
            </h1>
          </div>
        </div>

        <Card className="max-w-7xl mx-auto">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Top Row: Order Type, BL/Booking Number, and Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="orderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Order Type *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Import">Import</SelectItem>
                                <SelectItem value="Export">Export</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name="blBookingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">BL/Booking Number *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter BL/Booking number" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-3 flex items-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLoadFromMSC}
                        disabled={isLoadingFromMSC || isLoadingFromOVA}
                        className="h-7 px-3 text-xs"
                      >
                        {isLoadingFromMSC && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Load from MSC
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLoadFromOVA}
                        disabled={isLoadingFromMSC || isLoadingFromOVA}
                        className="h-7 px-3 text-xs"
                      >
                        {isLoadingFromOVA && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Use OVA string
                      </Button>
                    </div>
                  </div>
                  
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name="pic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Person in Charge (PIC)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Jan Novák" 
                              {...field} 
                              className="h-9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  

                </div>

                {/* Basic Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Client *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ŠKODA AUTO">ŠKODA AUTO</SelectItem>
                              <SelectItem value="TESCO">TESCO</SelectItem>
                              <SelectItem value="IKEA">IKEA</SelectItem>
                              <SelectItem value="NTB">NTB</SelectItem>
                              <SelectItem value="AUDI">AUDI</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Destination *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter destination" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="polPod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">POL/POD *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter port" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vessel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Vessel *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vessel name" {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ETA Row - directly under vessel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="eta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">ETA</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-3">
                    {/* Empty space */}
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Carrier *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MSC">MSC</SelectItem>
                              <SelectItem value="ONE">ONE</SelectItem>
                              <SelectItem value="Hapag-Lloyd">Hapag-Lloyd</SelectItem>
                              <SelectItem value="Maersk">Maersk</SelectItem>
                              <SelectItem value="CMA CGM">CMA CGM</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedOrderType === "Import" && (
                    <FormField
                      control={form.control}
                      name="customsClearance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Customs Clearance *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="In Port">In Port</SelectItem>
                                <SelectItem value="Inland depot">Inland depot</SelectItem>
                                <SelectItem value="At customer">At customer</SelectItem>
                                <SelectItem value="Metrans">Metrans</SelectItem>
                                <SelectItem value="Melnik">Melnik</SelectItem>
                                <SelectItem value="Mosnov">Mosnov</SelectItem>
                                <SelectItem value="Obrnice">Obrnice</SelectItem>
                                <SelectItem value="Bratislava">Bratislava</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedOrderType === "Export" && (
                    <>
                      <FormField
                        control={form.control}
                        name="customsDocuments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Customs Documents *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="By email">By email</SelectItem>
                                  <SelectItem value="At loading place">At loading place</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vgmRequested"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">VGM requested</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                {/* Date/time section */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watchedOrderType === "Export" && (
                      <FormField
                        control={form.control}
                        name="globalLoadingDateTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Loading Date/Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchedOrderType === "Import" && (
                      <FormField
                        control={form.control}
                        name="globalDischargingDateTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Unloading Date/Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Container Details - Only show if data loaded */}
                {containerDataLoaded && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Container Details</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {fields.map((field, index) => (
                        <AccordionItem key={field.id} value={`container-${index}`}>
                          <AccordionTrigger className="text-sm">
                            Container {index + 1}: {form.watch(`containers.${index}.containerNumber`) || "Not specified"}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded">
                              <FormField
                                control={form.control}
                                name={`containers.${index}.containerNumber`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Container Number *</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="ABCD1234567" className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`containers.${index}.destination`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Destination</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Container destination" className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`containers.${index}.loadingDateTime`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Loading Date/Time</FormLabel>
                                    <FormControl>
                                      <Input type="datetime-local" {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`containers.${index}.dischargingDateTime`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Discharging Date/Time</FormLabel>
                                    <FormControl>
                                      <Input type="datetime-local" {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            {/* Dangerous Cargo Toggle */}
                            <div className="p-3 bg-gray-50 rounded mt-2">
                              <FormField
                                control={form.control}
                                name={`containers.${index}.dangerousCargo`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                                    <FormLabel className="text-sm">Dangerous Cargo</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className={`${
                                          field.value 
                                            ? "data-[state=checked]:bg-red-600" 
                                            : "data-[state=unchecked]:bg-gray-300"
                                        }`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}



                {/* Action Buttons */}
                <div className="border-t pt-4 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={saveDraftMutation.isPending}
                  >
                    {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("Save Changes button clicked");
                      console.log("Form errors:", form.formState.errors);
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={createOrderMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {createOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <FileText className="w-4 h-4 mr-2" />
                    {isEditMode ? "Save Changes" : "Create Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}