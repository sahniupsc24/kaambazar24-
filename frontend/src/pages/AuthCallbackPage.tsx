import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        navigate('/login');
        return;
      }

      const userId = session.user.id;
      const email = session.user.email || '';

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile) {
        // Create profile for new Google user
        await supabase.from('profiles').insert([{
          id: userId,
          email,
          role: 'WORKER',
        }]);
        navigate('/worker/dashboard');
        return;
      }

      // Redirect based on role
      const role = profile.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'EMPLOYER') {
        navigate('/employer/dashboard');
      } else {
        navigate('/worker/dashboard');
      }
    };

    handleCallback();
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
      <p style={{ fontSize: 16, fontWeight: 600 }}>Logging you in...</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please wait while we verify your account.</p>
    </div>
  );
}
