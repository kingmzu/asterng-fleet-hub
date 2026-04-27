import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser, useUserProfile, useLogout } from '@/hooks/api';
import { Clock, ShieldCheck, ShieldX, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import logoMark from '@/assets/asterng-logo-mark.png';

const PendingApprovalPage = () => {
  const { user, isLoading } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Realtime: poll the profile so the user is forwarded the moment admin approves
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`profile_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ['auth', 'profile'] });
          qc.invalidateQueries({ queryKey: ['auth', 'roles'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  useEffect(() => {
    if (profile?.approval_status === 'approved') {
      navigate('/', { replace: true });
    }
  }, [profile?.approval_status, navigate]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = profile.approval_status;
  const isRejected = status === 'rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-5">
        <div className="mx-auto h-16 w-16">
          <img src={logoMark} alt="ASTERNG" className="h-full w-full object-contain" />
        </div>

        {isRejected ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Account Rejected</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your access request has been declined by the administrator. Please contact support if you believe this is an error.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-7 w-7 text-warning" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Awaiting Approval</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your <span className="font-medium text-foreground">{profile.requested_role?.replace('_', ' ') || 'account'}</span> registration is being reviewed by an administrator. You'll get access automatically once approved.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-left text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile.full_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate ml-2">{profile.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="inline-flex items-center gap-1 font-medium text-warning"><ShieldCheck className="h-3 w-3" /> Pending</span></div>
            </div>
          </>
        )}

        <Button variant="outline" className="w-full gap-2" onClick={() => logout(undefined, { onSuccess: () => navigate('/login') })}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;
