import React, { useEffect, useReducer } from "react";
import { Outlet, useLocation } from "react-router";
import { getAuthenticatedRole, subscribeAuthSession } from "./auth";
import { formatDocumentTitle } from "./documentTitle";

/**
 * Root layout: updates `document.title` on every navigation and auth change.
 * Pattern: `{page} · {Role} · Grade Forge` when signed in with a known role.
 */
export function DocumentTitleRoot() {
  const location = useLocation();
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeAuthSession(() => bump()), []);

  useEffect(() => {
    const role = getAuthenticatedRole();
    document.title = formatDocumentTitle(location.pathname, role);
  }, [location.pathname, location.search, bump]);

  return <Outlet />;
}
