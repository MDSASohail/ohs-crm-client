import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../ui/Spinner";
import { use } from "react";

// Protects routes — checks authentication and optionally checks role
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  

  // Still resolving auth state — show spinner
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not allowed — redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed — render the child route
  return <Outlet />;
};

export default ProtectedRoute;