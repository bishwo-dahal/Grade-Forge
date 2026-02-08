const AUTH_KEY = "gradeforge:auth";
const TOKEN_KEY = "gradeforge:token";

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthenticated(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function clearAuthenticated(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}
