const AUTH_KEY = "gradeforge:auth";
const TOKEN_KEY = "gradeforge:token";
const USER_KEY = "gradeforge:user";

export interface AuthenticatedUser {
  name: string;
  email: string;
  role: string;
}

// NOTE: Centralized app role union used by route-guard logic.
export type AppRole = "STUDENT" | "FACULTY" | "UNIVERSITY_ADMIN" | "SYSTEM_ADMIN";

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getAuthenticatedUser(): AuthenticatedUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthenticatedUser;
    if (!parsed?.name || !parsed?.email || !parsed?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// NOTE: Normalizes role from session so route checks use one reliable source.
export function getAuthenticatedRole(): AppRole | null {
  const user = getAuthenticatedUser();
  if (!user?.role) {
    return null;
  }

  const normalizedRole = user.role.toUpperCase();
  if (
    normalizedRole === "STUDENT" ||
    normalizedRole === "FACULTY" ||
    normalizedRole === "UNIVERSITY_ADMIN" ||
    normalizedRole === "SYSTEM_ADMIN"
  ) {
    return normalizedRole;
  }

  return null;
}

// NOTE: Defines default landing page by role to prevent cross-role dashboard access.
export function getDefaultRouteForRole(role?: string | null): string {
  switch ((role ?? "").toUpperCase()) {
    case "UNIVERSITY_ADMIN":
      return "/university-admin";
    case "FACULTY":
    case "STUDENT":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function setAuthenticated(token: string, user?: AuthenticatedUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_KEY, "true");
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthenticated(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
}
