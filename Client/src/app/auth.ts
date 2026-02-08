const AUTH_KEY = "gradeforge:auth";

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function clearAuthenticated(): void {
  sessionStorage.removeItem(AUTH_KEY);
}
