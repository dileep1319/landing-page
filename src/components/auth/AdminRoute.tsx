import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      
      if (error || !data.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const role = data.user.user_metadata?.role;
      setIsAdmin(role === "super_admin");
      setLoading(false);
    };

    checkAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const role = session?.user?.user_metadata?.role;
      setIsAdmin(role === "super_admin");
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

