// One-time migration to clean up old sessions and set up profile isolation
export const runOneTimeMigration = () => {
  const migrationKey = 'supabase_profile_migration_v1';
  
  // Check if migration already ran
  if (localStorage.getItem(migrationKey)) {
    return; // Already migrated
  }
  
  console.log('Running one-time Supabase profile migration...');
  
  // Clear old Supabase session data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('supabase.auth.') || key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Mark migration as complete
  localStorage.setItem(migrationKey, 'true');
  console.log('Migration complete - old sessions cleared');
};
