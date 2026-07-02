import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoMark from '@/assets/asterng-logo-mark.png';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogin, useSignup } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'operations_manager' | 'rider';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('rider');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: login, isPending: loginPending } = useLogin();
  const { mutate: signup, isPending: signupPending } = useSignup();
  const isPending = loginPending || signupPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      signup(
        { email, password, fullName, requestedRole: role },
        {
          onSuccess: () => {
            const msg = role === 'rider'
              ? 'Your rider account is pending admin review. You can sign in once approved.'
              : 'Your account requires admin approval before you can access the system.';
            toast({ title: 'Account created', description: msg });
            setIsSignup(false);
          },
          onError: (err: any) =>
            toast({ title: 'Signup failed', description: err.message ?? 'Could not create account', variant: 'destructive' }),
        }
      );
    } else {
      login(
        { email, password },
        {
          onSuccess: () => {
            toast({ title: 'Welcome back', description: 'Logged in successfully' });
            navigate('/');
          },
          onError: (err: any) =>
            toast({ title: 'Login failed', description: err.message ?? 'Invalid email or password', variant: 'destructive' }),
        }
      );
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center">
              <img src={logoMark} alt="ASTERNG" className="h-full w-full object-contain" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              ASTERNG Fleet Hub
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup ? 'Create your account' : 'Sign in to manage your fleet'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName" type="text" placeholder="Your full name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending} required className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am signing up as</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isPending}>
                    <SelectTrigger id="role" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rider">Rider</SelectItem>
                      <SelectItem value="operations_manager">Operational Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {role === 'rider'
                      ? 'You can sign in immediately after the admin approves you.'
                      : 'Admin and Operational Manager accounts require approval from the founding admin.'}
                  </p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email" type="email" placeholder="you@asterng.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={isPending} required className="h-11" autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={isPending} required className="h-11"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={6}
              />
            </div>
            <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSignup ? 'Creating...' : 'Signing in...'}</>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-primary hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2025 ASTERNG. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
