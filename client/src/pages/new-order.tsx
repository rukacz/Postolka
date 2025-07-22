import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
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

// Container schema
const containerSchema = z.object({
  containerNumber: z.string()
    .min(1, "Container number is required")
    .refine(validateContainerNumber, "Invalid container number (ISO 6346 format required)"),
  destination: z.string().optional(),
  loadingDateTime: z.string().optional(),
  dischargingDateTime: z.string().optional(),
});

// Main form schema
const newOrderSchema = z.object({
  orderType: z.enum(["Import", "Export"]),
  client: z.string().min(1, "Client is required"),
  destination: z.string().min(1, "Destination is required"),
  polPod: z.string().min(1, "POL/POD is required"),
  vessel: z.string().min(1, "Vessel is required"),
  carrier: z.string().default("MSC"),
  containerCount: z.number().min(1, "At least 1 container required"),
  containers: z.array(containerSchema),
  
  // Options
  differentDestinations: z.boolean().default(false),
  differentTimes: z.boolean().default(false),
  
  // Import specific
  blBookingNumber: z.string().optional(),
  customsClearance: z.enum(["Import", "Inland depot", "At customer", "Metrans"]).optional(),
  
  // Export specific
  vgmConfirmation: z.boolean().default(false),
  customsDocuments: z.enum(["E-mail", "On loading"]).optional(),
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

  const form = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      orderType: "Import",
      client: "",
      destination: "",
      polPod: "",
      vessel: "",
      carrier: "MSC",
      containerCount: 1,
      containers: [{ containerNumber: "" }],
      differentDestinations: false,
      differentTimes: false,
      blBookingNumber: "",
      customsClearance: "Import",
      vgmConfirmation: false,
      customsDocuments: "E-mail",
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "containers"
  });

  const watchedOrderType = form.watch("orderType");
  const watchedContainerCount = form.watch("containerCount");
  const watchedDifferentDestinations = form.watch("differentDestinations");
  const watchedDifferentTimes = form.watch("differentTimes");

  // Update containers when count changes
  const updateContainerCount = (newCount: number) => {
    const currentCount = fields.length;
    
    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        append({ containerNumber: "" });
      }
    } else if (newCount < currentCount) {
      for (let i = currentCount - 1; i >= newCount; i--) {
        remove(i);
      }
    }
  };

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
      // Simulate MSC data loading (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data update
      form.setValue("vessel", "MSC MAYA/0142E");
      form.setValue("polPod", "Hamburg");
      
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

  const createOrderMutation = useMutation({
    mutationFn: async (data: NewOrderFormData) => {
      // Convert form data to BL Summary format
      const blSummaryData = {
        blNumber: data.blBookingNumber || `AUTO-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        client: data.client,
        consignee: data.client, // Using client as consignee for now
        destination: data.destination,
        podPol: data.polPod,
        containerCount: data.containerCount,
        type: data.orderType,
        carrier: data.carrier,
        carrierStatus: "Pre-Order",
        medlogStatus: "New",
        trainScheduled: false,
        weight: "0 kg", // Default weight
      };

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
        description: "New order created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-summaries'] });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: NewOrderFormData) => {
      // Similar to create but with Draft status
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
    createOrderMutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="p-6">
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
            <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
          </div>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Fill in all required fields to create a new order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Step 1: Order Type Selection */}
                <div className="border-b pb-6">
                  <FormField
                    control={form.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Order Type *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-48">
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

                {/* Step 2: Common Fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
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

                    {!watchedDifferentDestinations && (
                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter destination" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="polPod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>POL/POD *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter port" {...field} />
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
                          <FormLabel>Vessel *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter vessel name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="carrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carrier *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
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

                    <FormField
                      control={form.control}
                      name="containerCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Containers *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 1;
                                field.onChange(count);
                                updateContainerCount(count);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Import-specific fields */}
                {watchedOrderType === "Import" && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-semibold">Import Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="blBookingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BL/Booking Number *</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="Enter BL/Booking number" {...field} />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleLoadFromMSC}
                                disabled={isLoadingFromMSC}
                                className="flex-shrink-0"
                              >
                                {isLoadingFromMSC ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Load from MSC"
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customsClearance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customs Clearance Method *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Import">Import</SelectItem>
                                  <SelectItem value="Inland depot">Inland depot</SelectItem>
                                  <SelectItem value="At customer">At customer</SelectItem>
                                  <SelectItem value="Metrans">Metrans</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Export-specific fields */}
                {watchedOrderType === "Export" && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-semibold">Export Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="vgmConfirmation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>VGM Confirmation</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Confirmed Verified Gross Mass
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customsDocuments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customs Documents Delivery *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="E-mail">E-mail</SelectItem>
                                  <SelectItem value="On loading">On loading</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Container Options */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Container Options</h3>
                  
                  <div className="flex flex-col space-y-4">
                    <FormField
                      control={form.control}
                      name="differentDestinations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Different destinations for containers</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Each container can have its own destination
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="differentTimes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Different loading/discharging times</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Each container can have individual timing
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Container Details */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Container Details</h3>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {fields.map((field, index) => (
                      <AccordionItem key={field.id} value={`container-${index}`}>
                        <AccordionTrigger>
                          Container {index + 1}
                          {form.getValues(`containers.${index}.containerNumber`) && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({form.getValues(`containers.${index}.containerNumber`)})
                            </span>
                          )}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 p-4">
                            <FormField
                              control={form.control}
                              name={`containers.${index}.containerNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Container Number * (ISO 6346)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="COSU1044551" 
                                      {...field} 
                                      className="uppercase"
                                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Format: 4 letters + 7 digits (e.g., COSU1044551)
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {watchedDifferentDestinations && (
                              <FormField
                                control={form.control}
                                name={`containers.${index}.destination`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Destination *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter destination" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {watchedDifferentTimes && watchedOrderType === "Export" && (
                              <FormField
                                control={form.control}
                                name={`containers.${index}.loadingDateTime`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Loading Date/Time *</FormLabel>
                                    <FormControl>
                                      <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {watchedDifferentTimes && watchedOrderType === "Import" && (
                              <FormField
                                control={form.control}
                                name={`containers.${index}.dischargingDateTime`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Discharging Date/Time</FormLabel>
                                    <FormControl>
                                      <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t">
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
                    {saveDraftMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Save as Draft
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={createOrderMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {createOrderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Create Order
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