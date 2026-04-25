import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/asterng-logo-full.png';
import { Input } from '@/components/ui/input';
import { useLogin, useSignup } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        { email, password, fullName },
        {
          onSuccess: () => {
            toast({
              title: 'Account Created',
              description: 'Please check your email to verify your account before signing in.',
            });
            setIsSignup(false);
          },
          onError: (err: any) => {
            toast({
              title: 'Signup Failed',
              description: err.message || 'Could not create account',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      login(
        { email, password },
        {
          onSuccess: () => {
            toast({ title: 'Success', description: 'Logged in successfully' });
            navigate('/');
          },
          onError: (err: any) => {
            toast({
              title: 'Login Failed',
              description: err.message || 'Invalid email or password',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img
                src={logo}
                alt="ASTERNG"
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Fleet Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Create your account' : 'Sign in to your account to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@asterng.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (isSignup ? 'Creating...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-primary hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            © 2025 ASTERNG. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
