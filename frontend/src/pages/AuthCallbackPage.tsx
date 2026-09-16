import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = ['satyamsahani293@gmail.com', 'examsform3@gmail.com', 'sahniupsc24@gmail.com'];


export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function processUser(user: any) {
      if (!mounted) return;
      const email = user.email || '';
      const userId = user.id;
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      const roleToSet = isAdmin ? 'SUPER_ADMIN' : 'WORKER';

      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (!existing) {
          await supabase.from('profiles').insert([{
            id: userId,
            email,
            role: roleToSet,
            is_active: true,
          }]);
        } else if (isAdmin && existing.role !== 'SUPER_ADMIN') {
          await supabase.from('profiles').update({ role: 'SUPER_ADMIN' }).eq('id', userId);
        }

        const finalRole = isAdmin ? 'SUPER_ADMIN' : (existing?.role || 'WORKER');
        if (finalRole === 'ADMIN' || finalRole === 'SUPER_ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (finalRole === 'EMPLOYER') {
          navigate('/employer/dashboard', { replace: true });
        } else {
          navigate('/worker/dashboard', { replace: true });
        }
      } catch (e) {
        console.error('Callback error:', e);
        if (isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/worker/dashboard', { replace: true });
        }
      }
    }

    async function handleCallback() {
      // 0. Check if this is a password recovery link
      if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
        navigate('/update-password', { replace: true });
        return;
      }

      // 1. Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await processUser(session.user);
        return;
      }

      // 2. Wait for auth state change (Google OAuth hash/code token exchange)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          subscription.unsubscribe();
          navigate('/update-password', { replace: true });
          return;
        }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
          subscription.unsubscribe();
          await processUser(currentSession.user);
        }
      });

      // 3. Fallback timeout
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 4000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: 'var(--text-main)',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '4px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 16, fontWeight: 600 }}>Logging you in as Admin...</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verifying Google credentials and setting up your session.</p>
    </div>
  );
}
