import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

if (!supabaseUrl.startsWith("https://")) {
  throw new Error("Invalid VITE_SUPABASE_URL: must start with https://");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep user logged in across refreshes within the same tab only.
    persistSession: true,
    storage: window.sessionStorage, // Use sessionStorage instead of localStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
