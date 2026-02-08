import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";
import { isAuthenticated } from "./auth";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
