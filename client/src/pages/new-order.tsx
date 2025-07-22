import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertBLSummarySchema } from "@shared/schema";

// Form schema extending the base schema with additional validation
const newOrderSchema = insertBLSummarySchema.extend({
  client: z.string().min(1, "Client is required"),
  consignee: z.string().min(1, "Consignee is required"),  
  destination: z.string().min(1, "Destination is required"),
  podPol: z.string().min(1, "POD/POL is required"),
  containerCount: z.number().min(1, "At least 1 container required"),
  carrierStatus: z.string().min(1, "Carrier status is required"),
  medlogStatus: z.string().min(1, "Medlog status is required"),
  weight: z.string().min(1, "Weight is required"),
});

type NewOrderFormData = z.infer<typeof newOrderSchema>;

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      blNumber: "",
      date: new Date().toISOString().split('T')[0], // Today's date
      client: "",
      consignee: "", 
      destination: "",
      podPol: "",
      containerCount: 1,
      type: "Import",
      carrier: "",
      carrierStatus: "Pre-Order",
      medlogStatus: "New",
      trainScheduled: false,
      weight: ""
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: NewOrderFormData) => {
      const response = await fetch('/api/bl-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Nová objednávka byla úspěšně vytvořena.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-summaries'] });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit objednávku. Zkuste to znovu.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: NewOrderFormData) => {
    createOrderMutation.mutate(data);
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
              <span>Zpět na přehled</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Nová objednávka</h1>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
            <CardDescription>
              Vyplňte všechny povinné údaje pro vytvoření nové objednávky
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="blNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BL číslo *</FormLabel>
                        <FormControl>
                          <Input placeholder="MEDU123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klient *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte klienta" />
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
                    name="consignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Příjemce *</FormLabel>
                        <FormControl>
                          <Input placeholder="ALICE FREIGHT" {...field} />
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
                        <FormLabel>Cíl *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte destinaci" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mladá Boleslav">Mladá Boleslav</SelectItem>
                              <SelectItem value="Gan">Gan</SelectItem>
                              <SelectItem value="Ružomberok">Ružomberok</SelectItem>
                              <SelectItem value="Praha">Praha</SelectItem>
                              <SelectItem value="Ingolstadt">Ingolstadt</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="podPol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>POD/POL *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte přístav" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hamburg">Hamburg</SelectItem>
                              <SelectItem value="Bremerhaven">Bremerhaven</SelectItem>
                              <SelectItem value="Koper">Koper</SelectItem>
                              <SelectItem value="Rotterdam">Rotterdam</SelectItem>
                              <SelectItem value="Antwerp">Antwerp</SelectItem>
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
                        <FormLabel>Počet kontejnerů *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
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

                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dopravce</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte dopravce" />
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
                    name="carrierStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status dopravce *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pre-Order">Pre-Order</SelectItem>
                              <SelectItem value="MIPS Send">MIPS Send</SelectItem>
                              <SelectItem value="Do Not Release">Do Not Release</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medlogStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Medlog *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                              <SelectItem value="Changed">Changed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hmotnost *</FormLabel>
                        <FormControl>
                          <Input placeholder="25,400 kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation('/dashboard')}
                  >
                    Zrušit
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOrderMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {createOrderMutation.isPending ? (
                      <>Ukládání...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Uložit objednávku
                      </>
                    )}
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