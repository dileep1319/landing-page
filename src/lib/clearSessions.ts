// Clear all existing Supabase session data for fresh profile isolation
export const clearAllSupabaseSessions = () => {
  // Clear standard Supabase keys
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('supabase.auth.') || key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear our custom profile storage
  const profileId = localStorage.getItem('browser_profile_id');
  if (profileId) {
    localStorage.removeItem(`supabase_${profileId}`);
  }
  
  console.log('Cleared all Supabase session data');
};

// Only run this once manually if needed
// clearAllSupabaseSessions();
