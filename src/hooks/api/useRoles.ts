import { useUserRoles } from './useAuth';

export type AppRole = 'admin' | 'operations_manager' | 'accountant' | 'rider';

export const useRoles = () => {
  const { data: roles = [], isLoading } = useUserRoles();
  const list = roles as AppRole[];
  const isAdmin = list.includes('admin');
  const isManager = list.includes('operations_manager');
  const isAccountant = list.includes('accountant');
  const isStaff = isAdmin || isManager || isAccountant;
  const isRider = list.includes('rider') || (!isStaff && list.length > 0);
  // canTrackFleet: admin, manager, accountant
  const canTrackFleet = isStaff;
  const canManagePricing = isAdmin;
  return { roles: list, isAdmin, isManager, isAccountant, isStaff, isRider, canTrackFleet, canManagePricing, isLoading };
};
