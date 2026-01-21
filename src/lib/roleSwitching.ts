import { supabase } from './supabase';

export const switchUserRole = async (targetRole: 'user' | 'admin') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No active session');
  }
  
  // Update user metadata with new role (temporary for testing)
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      temporary_role: targetRole
    }
  });
  
  if (error) {
    throw error;
  }
  
  // Force redirect to appropriate dashboard
  if (targetRole === 'admin') {
    window.location.href = '/admin';
  } else {
    window.location.href = '/dashboard';
  }
};

export const getEffectiveRole = (user: any) => {
  // Use temporary role if set (for testing), otherwise use actual role
  return user?.user_metadata?.temporary_role || user?.user_metadata?.role || 'user';
};
