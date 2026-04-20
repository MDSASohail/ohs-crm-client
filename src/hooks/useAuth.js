import { useSelector } from "react-redux";
import { ROLES } from "../constants/roles";

// Central hook for accessing auth state anywhere in the app
export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isLoading, error } =
    useSelector((state) => state.auth);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    // Convenience role checks
    isRoot: user?.role === ROLES.ROOT,
    isAdmin: user?.role === ROLES.ADMIN,
    isStaff: user?.role === ROLES.STAFF,
    isViewer: user?.role === ROLES.VIEWER,
    // Can this user write data?
    canWrite: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF].includes(user?.role),
    // Can this user manage settings, users, courses, institutes?
    canManage: [ROLES.ROOT, ROLES.ADMIN].includes(user?.role),
    // Only root
    isRootOnly: user?.role === ROLES.ROOT,
  };
};