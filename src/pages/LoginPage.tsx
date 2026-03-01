import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@asterng.com');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    login(
      { email, password },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Logged in successfully',
          });
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              ASTERNG Fleet Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error.message || 'Failed to login. Please try again.'}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@asterng.com"
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

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Demo Credentials
            </p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p><span className="font-medium">Email:</span> admin@asterng.com</p>
              <p><span className="font-medium">Password:</span> password123</p>
            </div>
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
