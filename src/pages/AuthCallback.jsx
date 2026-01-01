import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/customSupabaseClient';
import { useToast } from '../hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: 'Authentication Error',
            description: error.message || 'Failed to complete authentication',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        if (data.session) {
          toast({
            title: 'Success',
            description: 'Successfully signed in!',
          });
          navigate('/dashboard');
        } else {
          toast({
            title: 'Authentication Error',
            description: 'No session found',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        toast({
          title: 'Authentication Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;