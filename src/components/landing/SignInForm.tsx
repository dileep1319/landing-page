import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

type SignInFormProps = {
  onSuccess?: () => void;
};

const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Simple password hashing function (same as registration)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const username = values.username.trim().toLowerCase();
      
      // Find user in users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (dbError || !userData) {
        toast.error("Invalid username or password. Please check your credentials.");
        return;
      }

      // Hash provided password and compare with stored hash
      const passwordHash = await hashPassword(values.password);
      
      if (passwordHash !== userData.password_hash) {
        toast.error("Invalid username or password. Please check your credentials.");
        return;
      }

      // Create anonymous Supabase session with user data in metadata
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            user_id: userData.id,
            username: username,
            name: userData.name,
            role: userData.role ?? 'user',
          }
        }
      });

      if (authError) {
        toast.error(`Session creation failed: ${authError.message}`);
        return;
      }

      if (authData.user) {
        toast.success("🎉 Welcome back!");
        form.reset();
        onSuccess?.();
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      toast.error("Sign in failed. Please try again.");
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Username
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="johndoe" 
                    className="h-12 rounded-full bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Password
                </FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    className="h-12 rounded-full bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors"
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
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By signing in, you agree to participate in the Super Bowl cashback campaign.
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
