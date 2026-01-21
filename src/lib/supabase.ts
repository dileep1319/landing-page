import { createClient } from "@supabase/supabase-js";
import { runOneTimeMigration } from "./migration";

// Run one-time migration to clean up old sessions
runOneTimeMigration();

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

// Create profile-specific storage to ensure isolation between Chrome profiles
const createProfileStorage = () => {
  // Generate a unique identifier for this browser profile
  const getProfileId = () => {
    // Check for existing profile ID
    let profileId = localStorage.getItem('browser_profile_id');
    if (!profileId) {
      // Create new profile ID
      profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('browser_profile_id', profileId);
    }
    return profileId;
  };
  
  const profileId = getProfileId();
  const storageKey = `supabase_${profileId}`;
  
  return {
    getItem: (key: string) => {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return null;
        const parsed = JSON.parse(data);
        return parsed[key] || null;
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        const data = localStorage.getItem(storageKey) || '{}';
        const parsed = JSON.parse(data);
        parsed[key] = value;
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
    },
    removeItem: (key: string) => {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return;
        const parsed = JSON.parse(data);
        delete parsed[key];
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
    }
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: createProfileStorage(),
  },
});
