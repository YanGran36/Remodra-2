import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Client, ClientInput } from '../../hooks/use-clients';
import { useToast } from '../../hooks/use-toast';

// Schema de validación
const clientFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type ClientFormProps = {
  client?: Client;
  onSubmit: (data: ClientInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
};

export default function ClientForm({ client, onSubmit, isSubmitting, onCancel }: ClientFormProps) {
  const { toast } = useToast();
  const [uniquenessStatus, setUniquenessStatus] = useState<{
    email?: { isUnique: boolean; message: string; existingClient?: any };
    phone?: { isUnique: boolean; message: string; existingClient?: any };
    address?: { isUnique: boolean; message: string; existingClient?: any };
  }>({});
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);

  // Formulario con valores por defecto
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: client?.firstName || "",
      lastName: client?.lastName || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      city: client?.city || "",
      state: client?.state || "",
      zip: client?.zip || "",
      notes: client?.notes || "",
    },
  });

  // Check uniqueness when email, phone, or address changes
  const checkUniqueness = async (field: string, value: string) => {
    if (!value || value.length < 3) {
      setUniquenessStatus(prev => ({ ...prev, [field]: undefined }));
      return;
    }

    setIsCheckingUniqueness(true);
    try {
      const response = await fetch('/api/protected/clients/check-uniqueness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      const result = await response.json();
      
      if (response.ok) {
        setUniquenessStatus(prev => ({
          ...prev,
          [field]: { isUnique: true, message: `${field.charAt(0).toUpperCase() + field.slice(1)} is available` }
        }));
      } else if (response.status === 409) {
        setUniquenessStatus(prev => ({
          ...prev,
          [field]: { 
            isUnique: false, 
            message: `Client already exists with this ${field}`,
            existingClient: result.existingClient
          }
        }));
      }
    } catch (error) {
      console.error('Error checking uniqueness:', error);
    } finally {
      setIsCheckingUniqueness(false);
    }
  };

  // Debounced uniqueness check
  useEffect(() => {
    const email = form.watch('email');
    const phone = form.watch('phone');
    const address = form.watch('address');

    const timeoutId = setTimeout(() => {
      if (email) checkUniqueness('email', email);
      if (phone) checkUniqueness('phone', phone);
      if (address) checkUniqueness('address', address);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('email'), form.watch('phone'), form.watch('address')]);

  const handleSubmit = (data: z.infer<typeof clientFormSchema>) => {
    // Check if there are any uniqueness conflicts
    const hasConflicts = Object.values(uniquenessStatus).some(
      status => status && !status.isUnique
    );

    if (hasConflicts) {
      toast({
        title: "Duplicate Client Detected",
        description: "A client with this information already exists. Please review the details.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="email" 
                      placeholder="email@example.com" 
                      {...field}
                      className={uniquenessStatus.email ? 
                        (uniquenessStatus.email.isUnique ? 'border-green-500' : 'border-red-500') : ''
                      }
                    />
                    {isCheckingUniqueness && field.value && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {uniquenessStatus.email && !isCheckingUniqueness && (
                      <div className="absolute right-3 top-3">
                        {uniquenessStatus.email.isUnique ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {uniquenessStatus.email && (
                  <p className={`text-sm ${uniquenessStatus.email.isUnique ? 'text-green-600' : 'text-red-600'}`}>
                    {uniquenessStatus.email.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="(123) 456-7890" 
                      {...field}
                      className={uniquenessStatus.phone ? 
                        (uniquenessStatus.phone.isUnique ? 'border-green-500' : 'border-red-500') : ''
                      }
                    />
                    {isCheckingUniqueness && field.value && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {uniquenessStatus.phone && !isCheckingUniqueness && (
                      <div className="absolute right-3 top-3">
                        {uniquenessStatus.phone.isUnique ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {uniquenessStatus.phone && (
                  <p className={`text-sm ${uniquenessStatus.phone.isUnique ? 'text-green-600' : 'text-red-600'}`}>
                    {uniquenessStatus.phone.message}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Address" 
                    {...field}
                    className={uniquenessStatus.address ? 
                      (uniquenessStatus.address.isUnique ? 'border-green-500' : 'border-red-500') : ''
                    }
                  />
                  {isCheckingUniqueness && field.value && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {uniquenessStatus.address && !isCheckingUniqueness && (
                    <div className="absolute right-3 top-3">
                      {uniquenessStatus.address.isUnique ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              {uniquenessStatus.address && (
                <p className={`text-sm ${uniquenessStatus.address.isUnique ? 'text-green-600' : 'text-red-600'}`}>
                  {uniquenessStatus.address.message}
                </p>
              )}
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP Code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about this client..." 
                  className="resize-none" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? "Update Client" : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}