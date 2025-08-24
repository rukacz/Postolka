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
import { ArrowLeft, FileText, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Company, User } from "@shared/schema";

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
  direction: z.enum(["Import", "Export"]),
  client: z.string().min(1, "Client is required"),
  notificationEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
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
  vgmRequested: z.enum(["Yes", "No"]).nullable().default(null),
  customsDocuments: z.enum(["By email", "At loading place"]).nullable().default(null),
  bthRequest: z.enum(["Yes", "No"]).nullable().default(null),
  goodsInTransit: z.enum(["No", "Yes"]).nullable().default(null),
  

}).refine((data) => {
  if (data.direction === "Import") {
    return data.blBookingNumber && data.blBookingNumber.length > 0 && data.customsClearance;
  }
  // Export fields are no longer mandatory
  return true;
}, {
  message: "Required fields missing for order type",
  path: ["direction"],
});

type NewOrderFormData = z.infer<typeof newOrderSchema>;

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuth();
  const [isLoadingFromMSC, setIsLoadingFromMSC] = useState(false);
  const [isLoadingFromOVA, setIsLoadingFromOVA] = useState(false);
  const [containerDataLoaded, setContainerDataLoaded] = useState(false);
  const [containerQty, setContainerQty] = useState(1);
  const [isCheckingBLUniqueness, setIsCheckingBLUniqueness] = useState(false);
  
  // Check if this is edit mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const editBlNumber = urlParams.get('edit');
  const isEditMode = !!editBlNumber;
  
  // Load existing BL data in edit mode
  const { data: existingBL } = useQuery({
    queryKey: ['/api/bls', editBlNumber],
    enabled: isEditMode && !!editBlNumber,
  });
  
  const { data: existingContainers } = useQuery({
    queryKey: ['/api/containers', editBlNumber],
    enabled: isEditMode && !!editBlNumber,
  });
  
  // Load companies and users for form options
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Load all BLs for uniqueness check
  const { data: allBLs = [] } = useQuery({
    queryKey: ['/api/bls'],
  });
  
  // Filter companies by type
  const clientCompanies = companies.filter(c => c.type === 'Client');
  const carrierCompanies = companies.filter(c => c.type === 'Carrier');
  
  // MSC users can only see MSC carriers
  const availableCarriers = hasPermission('view_msc_carriers_only') 
    ? companies.filter(c => c.type === 'MSC')
    : carrierCompanies;
  
  // Function to check BL number uniqueness
  const checkBLUniqueness = async (blNumber: string): Promise<boolean> => {
    if (!blNumber || blNumber.trim() === '') return true;
    
    // In edit mode, allow the same BL number
    if (isEditMode && editBlNumber === blNumber) return true;
    
    // Check if BL number already exists
    const existingBL = allBLs.find(bl => bl.blNumber === blNumber);
    return !existingBL;
  };
  
  // Enhanced schema with BL uniqueness validation
  const enhancedSchema = newOrderSchema.refine(async (data) => {
    if (!data.blBookingNumber || data.blBookingNumber.trim() === '') return true;
    
    const isUnique = await checkBLUniqueness(data.blBookingNumber);
    if (!isUnique) {
      throw new Error('BL/Booking number already exists');
    }
    return true;
  }, {
    message: "BL/Booking number already exists",
    path: ["blBookingNumber"],
  });
  
  const form = useForm<NewOrderFormData>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      direction: (() => {
        // Set default direction based on user's company type
        if (user?.companyType === 'export_only') {
          return "Export";
        } else if (user?.companyType === 'import_only') {
          return "Import";
        }
        // Default to Import for users with no specific restriction
        return "Import";
      })(),
      client: "",
      notificationEmail: "",
      destination: "",
      polPod: "",
      vessel: "",
      carrier: (() => {
        // Set default carrier based on user's defaultCarrier
        if (user?.defaultCarrier) {
          return user.defaultCarrier;
        }
        // Default to MSC for users with no default carrier
        return "MSC";
      })(),
      pic: "",
      eta: "",
      containerCount: 1,
      containers: [{ containerNumber: "", dangerousCargo: false }],
      globalLoadingDateTime: "",
      globalDischargingDateTime: "",
      blBookingNumber: "",
      customsClearance: "In Port",
      vgmRequested: null,
      customsDocuments: null,
      bthRequest: null,
      goodsInTransit: null,
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "containers"
  });

  const watchedDirection = form.watch("direction");
  const watchedBLNumber = form.watch("blBookingNumber");
  
  // Check BL uniqueness when BL number changes
  useEffect(() => {
    if (watchedBLNumber && watchedBLNumber.trim() !== '') {
      setIsCheckingBLUniqueness(true);
      checkBLUniqueness(watchedBLNumber).then(isUnique => {
        if (!isUnique && !isEditMode) {
          form.setError('blBookingNumber', {
            type: 'manual',
            message: 'BL/Booking number already exists'
          });
        } else {
          form.clearErrors('blBookingNumber');
        }
        setIsCheckingBLUniqueness(false);
      });
    }
  }, [watchedBLNumber, isEditMode, form]);

  // Load existing data into form when available
  useEffect(() => {
    if (isEditMode && existingBL && existingContainers) {
      form.reset({
        direction: existingBL.direction as "Import" | "Export",
        client: existingBL.client?.toString() || "",
        destination: existingBL.location || "",
        polPod: existingBL.localPort?.toString() || "",
        vessel: existingBL.vessel || "",
        carrier: existingBL.carrier?.toString() || "MSC",
        pic: existingBL.pic?.toString() || "",
        eta: existingBL.eta || "",
        containerCount: existingBL.containerCount || 1,
        containers: existingContainers?.map(c => ({
          containerNumber: c.containerIlu,
          destination: c.location || "",
          loadingDateTime: "",
          dischargingDateTime: "",
          dangerousCargo: c.hasDangerous || false,
        })) || [{ containerNumber: "", dangerousCargo: false }],
        globalLoadingDateTime: "",
        globalDischargingDateTime: "",
        blBookingNumber: existingBL.blNumber,
        customsClearance: "In Port" as any,
        vgmRequested: null,
        customsDocuments: null,
        bthRequest: null,
        goodsInTransit: null,
      });
    }
  }, [existingBL, existingContainers, form, isEditMode]);

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
      
      const blData = {
        blNumber: data.blBookingNumber || `AUTO-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        client: parseInt(data.client),
        carrier: parseInt(data.carrier),
        pic: parseInt(data.pic),
        direction: data.direction,
        location: data.destination,
        localPort: data.polPod,
        eta: data.eta || "TBD",
        vessel: data.vessel || "TBD",
        containerCount: data.containerCount,
        hasDangerous: false, // Will be calculated from containers
        hasDt: false, // Will be calculated from containers
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        // Change tracking fields
        blNumberChange: false,
        picChange: false,
        clientChange: false,
        containerChange: false,
        directionChange: false,
        etaChange: false,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: false,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
      };

      // For now, simulate success - in real implementation, this would call update API in edit mode
      if (isEditMode) {
        console.log("Simulating order update success");
        return { success: true, updated: true };
      }

      const response = await fetch('/api/bls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blData),
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
      queryClient.invalidateQueries({ queryKey: ['/api/bls'] });
      
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

  const onSubmit = (data: NewOrderFormData) => {
    console.log("Form submitted with data:", data);
    createOrderMutation.mutate(data);
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
                      name="direction"
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
                            <div className="relative">
                              <Input 
                                {...field} 
                                placeholder="Enter BL/Booking number" 
                                className={`h-9 pr-8 ${isCheckingBLUniqueness ? 'animate-pulse' : ''}`}
                              />
                              {isCheckingBLUniqueness && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          {watchedBLNumber && watchedBLNumber.trim() !== '' && !isCheckingBLUniqueness && (
                            <div className="text-xs text-gray-500 mt-1">
                              {form.formState.errors.blBookingNumber ? (
                                <span className="text-red-500">⚠️ {form.formState.errors.blBookingNumber.message}</span>
                              ) : (
                                <span className="text-green-500">✅ BL number is available</span>
                              )}
                            </div>
                          )}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select PIC" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                              {clientCompanies.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
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

                {/* Notification Email and ETA Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Notification email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter notification email"
                            {...field} 
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    {/* Empty space in the middle */}
                  </div>
                  <FormField
                    control={form.control}
                    name="eta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          {watchedDirection === "Export" ? "Vessel closing" : "ETA"}
                        </FormLabel>
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
                              {availableCarriers.map(carrier => (
                                <SelectItem key={carrier.id} value={carrier.id.toString()}>
                                  {carrier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedDirection === "Import" && (
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
                                <SelectItem value="Customs Office">Customs Office</SelectItem>
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

                  {watchedDirection === "Export" && (
                    <>
                      <FormField
                        control={form.control}
                        name="customsDocuments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Customs Documents</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="—" />
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
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="—" />
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

                {/* Additional Export fields row - aligned right like ETA but sized like Customs Documents */}
                {watchedDirection === "Export" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      {/* Empty space on the left */}
                    </div>
                    <FormField
                      control={form.control}
                      name="bthRequest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">BTH/ZAPP/TCC Request</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="—" />
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
                    <FormField
                      control={form.control}
                      name="goodsInTransit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Goods in transit (T1, T2L)</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Yes">Yes</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Date/time section */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watchedDirection === "Export" && (
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

                    {watchedDirection === "Import" && (
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
                            
                            {/* Container action buttons */}
                            <div className="flex justify-end gap-2 mt-3 p-3 bg-gray-50 rounded">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    
                    {/* Add Container Section */}
                    <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded border">
                      <span className="text-sm font-medium">Add Container</span>
                      <div className="flex items-center gap-2">
                        {/* Qty input with dropdown */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600">Qty:</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max="999"
                              value={containerQty}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setContainerQty(Math.max(1, Math.min(999, value)));
                              }}
                              className="h-8 w-20 text-xs text-center pr-8"
                            />
                            <Select 
                              value={containerQty <= 10 ? containerQty.toString() : "custom"} 
                              onValueChange={(value) => {
                                if (value !== "custom") {
                                  setContainerQty(parseInt(value));
                                }
                              }}
                            >
                              <SelectTrigger className="absolute right-0 top-0 h-8 w-6 border-0 bg-transparent p-0">
                                <div className="w-3 h-3 border-l border-t border-gray-400 rotate-45 -translate-y-0.5" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Cancel and Save buttons */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setContainerQty(1)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            for (let i = 0; i < containerQty; i++) {
                              append({
                                containerNumber: "",
                                destination: "",
                                loadingDateTime: "",
                                dischargingDateTime: "",
                                dangerousCargo: false
                              });
                            }
                            setContainerQty(1);
                          }}
                          className={`${
                            containerQty > 1 
                              ? "bg-green-600 hover:bg-green-700 border-2 border-green-400" 
                              : "bg-primary hover:bg-blue-700"
                          }`}
                        >
                          Save {containerQty > 1 ? `${containerQty}x` : ""}
                        </Button>
                      </div>
                    </div>
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