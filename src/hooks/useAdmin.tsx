import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      if (!user) {
        console.log('[useAdmin] No user found');
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      console.log('[useAdmin] Checking admin status for user:', user.id);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('[useAdmin] Query result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('[useAdmin] Error checking admin status:', error);
        }

        if (mounted) {
          const adminStatus = !!data;
          console.log('[useAdmin] Admin status:', adminStatus);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('[useAdmin] Unexpected error:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { isAdmin, loading };
}
