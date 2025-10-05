import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function checkAdminStatus() {
      if (!user) {
        console.log('[useAdmin] No user found');
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      console.log('[useAdmin] Checking admin status for user:', user.id, 'Attempt:', retryCount + 1);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('[useAdmin] Query result:', { data, error, hasData: !!data });

        if (error && error.code !== 'PGRST116') {
          console.error('[useAdmin] Error checking admin status:', error);
          
          // Retry on error if we haven't exceeded max retries
          if (retryCount < maxRetries && mounted) {
            retryCount++;
            console.log('[useAdmin] Retrying admin check...');
            setTimeout(() => checkAdminStatus(), 500);
            return;
          }
        }

        if (mounted) {
          const adminStatus = !!data;
          console.log('[useAdmin] Setting admin status to:', adminStatus);
          setIsAdmin(adminStatus);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useAdmin] Unexpected error:', error);
        
        // Retry on unexpected error
        if (retryCount < maxRetries && mounted) {
          retryCount++;
          console.log('[useAdmin] Retrying after error...');
          setTimeout(() => checkAdminStatus(), 500);
          return;
        }
        
        if (mounted) {
          setIsAdmin(false);
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
