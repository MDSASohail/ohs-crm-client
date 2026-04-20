import { useAuth } from "./useAuth";

// Check if current user has one of the allowed roles
// Usage: const canEdit = usePermission([ROLES.ROOT, ROLES.ADMIN]);
export const usePermission = (allowedRoles = []) => {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
};