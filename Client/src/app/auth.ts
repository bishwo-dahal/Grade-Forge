const AUTH_KEY = "gradeforge:auth";
const TOKEN_KEY = "gradeforge:token";
const USER_KEY = "gradeforge:user";

type AuthSessionListener = () => void;
const authSessionListeners = new Set<AuthSessionListener>();
let authSessionTick = 0;

/** Subscribe to session writes so UI (e.g. top bar) re-renders after `setAuthenticated` / `clearAuthenticated`. */
export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  authSessionListeners.add(listener);
  return () => authSessionListeners.delete(listener);
}

export function getAuthSessionTick(): number {
  return authSessionTick;
}

function notifyAuthSession(): void {
  authSessionTick += 1;
  authSessionListeners.forEach((l) => l());
}

export interface AuthenticatedUser {
  name: string;
  email: string;
  role: string;
  profileCompleted?: boolean;
  profilePictureUrl?: string | null;
}

// NOTE: Centralized app role union used by route-guard logic.
export type AppRole = "STUDENT" | "FACULTY" | "GRADING_ASSISTANT" | "UNIVERSITY_ADMIN" | "SYSTEM_ADMIN";

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

export function isStudentRegistrationComplete(): boolean {
  const user = getAuthenticatedUser();
  if (!user) {
    return false;
  }

  if (user.role.toUpperCase() !== "STUDENT") {
    return true;
  }

  // NOTE: Legacy sessions may not have this field; treat undefined as complete until the next login refresh.
  return user.profileCompleted !== false;
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
    normalizedRole === "GRADING_ASSISTANT" ||
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
    case "GRADING_ASSISTANT":
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
  notifyAuthSession();
}

export function clearAuthenticated(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
  notifyAuthSession();
}
