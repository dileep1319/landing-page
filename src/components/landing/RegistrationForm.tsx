import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").max(15, "Phone number too long"),
});

type FormValues = z.infer<typeof schema>;

type RegistrationFormProps = {
  onSuccess?: () => void;
};

const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("🎉 Registration successful! Welcome to the campaign.");
      form.reset();
      onSuccess?.();
    } catch (err: any) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    className="h-11 rounded-lg border-border/50 focus:border-accent/50 transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    className="h-11 rounded-lg border-border/50 focus:border-accent/50 transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 123-4567" 
                    className="h-11 rounded-lg border-border/50 focus:border-accent/50 transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 btn-gold gold-glow rounded-full font-semibold text-base transition-all duration-300 hover:scale-[1.02]" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Registering...
              </div>
            ) : (
              "Register Now"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By registering, you agree to participate in the Super Bowl cashback campaign.
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;

