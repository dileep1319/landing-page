import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import RegistrationForm from "./RegistrationForm";
import SignInForm from "./SignInForm";
import type { User } from "@supabase/supabase-js";

const AuthModal = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (event === 'SIGNED_IN') {
          setOpen(false);
          const role = session?.user?.user_metadata?.role;
          if (role === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      }
    );

    const onOpenSignup = () => {
      setMode('signup');
      setOpen(true);
    };
    const onOpenSignin = () => {
      setMode('signin');
      setOpen(true);
    };

    window.addEventListener("open-signup", onOpenSignup);
    window.addEventListener("open-signin", onOpenSignin);
    
    return () => {
      window.removeEventListener("open-signup", onOpenSignup);
      window.removeEventListener("open-signin", onOpenSignin);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSuccess = async () => {
    setOpen(false);
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;
    if (role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'signup' 
                ? 'Join BIG MONEY GAMING and start earning rewards' 
                : 'Sign in to your account to continue'
              }
            </DialogDescription>
          </DialogHeader>
          
          {mode === 'signup' ? (
            <RegistrationForm onSuccess={handleSuccess} />
          ) : (
            <SignInForm onSuccess={handleSuccess} />
          )}
          
          <div className="mt-6 text-center border-t border-border/30 pt-4">
            <p className="text-sm text-muted-foreground">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-accent hover:text-accent/80 font-medium transition-colors hover:underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-accent hover:text-accent/80 font-medium transition-colors hover:underline underline-offset-4"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {user && (
        <div className="fixed top-20 right-6 z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium">{user.email}</div>
              <div className="text-xs text-muted-foreground">Signed in</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthModal;
