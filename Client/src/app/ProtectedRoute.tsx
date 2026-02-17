import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";
import { getAuthenticatedRole, getDefaultRouteForRole, isAuthenticated } from "./auth";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  // NOTE: Role gate ensures users cannot manually open routes for other dashboards.
  if (allowedRoles && allowedRoles.length > 0) {
    const role = getAuthenticatedRole();
    if (!role) {
      return <Navigate to="/signin" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={getDefaultRouteForRole(role)} replace />;
    }
  }

  return <>{children}</>;
}
