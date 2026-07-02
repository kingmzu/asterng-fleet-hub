import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useUserProfile } from '@/hooks/api';
import { useRoles } from '@/hooks/api/useRoles';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, only admins, ops managers, accountants may view. Riders are redirected. */
  staffOnly?: boolean;
  /** If true, only admins may view. Everyone else redirected. */
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, staffOnly, adminOnly }: ProtectedRouteProps) => {
  const { user, isLoading } = useCurrentUser();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { isStaff, isAdmin, isRider, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  if (isLoading || (user && (rolesLoading || profileLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Approval gate — block if profile not approved (except the pending page itself)
  const approval = profile?.approval_status ?? 'pending';
  if (approval !== 'approved' && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }
  if (approval === 'approved' && location.pathname === '/pending-approval') {
    return <Navigate to={isRider && !isStaff ? '/smart-meter' : '/'} replace />;
  }

  // Riders may only access /smart-meter
  if (isRider && !isStaff && location.pathname !== '/smart-meter') {
    return <Navigate to="/smart-meter" replace />;
  }

  if (staffOnly && !isStaff) return <Navigate to="/smart-meter" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
