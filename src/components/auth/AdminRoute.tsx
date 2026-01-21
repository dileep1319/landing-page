import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { logoutIfStale, touchLastSeen } from "@/lib/sessionTimeout";

export default function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      await logoutIfStale(supabase);
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      
      if (error || !data.user) {
        setIsAdmin(false);
        setHasUser(false);
        setLoading(false);
        return;
      }

      const role = data.user.user_metadata?.role;
      setIsAdmin(role === "super_admin");
      setHasUser(true);
      setLoading(false);
    };

    checkAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const role = session?.user?.user_metadata?.role;
      setIsAdmin(role === "super_admin");
      setHasUser(!!session?.user);
      setLoading(false);
    });

    const onActivity = () => touchLastSeen();
    touchLastSeen();
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onActivity);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
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
    // If not logged in, go to landing page. If logged in but not admin, go to user dashboard.
    return <Navigate to={hasUser ? "/dashboard" : "/"} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

