import { toast } from "sonner";

const AUTH_NOTIFICATION_KEY = "gradeforge:auth-notification";
const FIRST_SIGN_IN_KEY_PREFIX = "gradeforge:first-sign-in-seen";

type AuthNotificationVariant = "success" | "info";

interface AuthNotificationPayload {
  message: string;
  variant: AuthNotificationVariant;
}

type RoleName = "STUDENT" | "FACULTY" | "GRADING_ASSISTANT" | "UNIVERSITY_ADMIN" | "SYSTEM_ADMIN";

function normalizeRole(role?: string | null): RoleName {
  const value = (role ?? "").toUpperCase();
  if (value === "GRADINGASSISTANT") {
    return "GRADING_ASSISTANT";
  }
  if (value === "UNIVERSITY") {
    return "UNIVERSITY_ADMIN";
  }
  if (
    value === "STUDENT" ||
    value === "FACULTY" ||
    value === "GRADING_ASSISTANT" ||
    value === "UNIVERSITY_ADMIN" ||
    value === "SYSTEM_ADMIN"
  ) {
    return value;
  }
  return "STUDENT";
}

function getRoleLabel(role?: string | null): string {
  switch (normalizeRole(role)) {
    case "FACULTY":
      return "Faculty";
    case "GRADING_ASSISTANT":
      return "Grading Assistant";
    case "UNIVERSITY_ADMIN":
      return "University Admin";
    case "SYSTEM_ADMIN":
      return "System Admin";
    case "STUDENT":
    default:
      return "Student";
  }
}

function getFirstSignInSeenKey(email: string, role?: string | null): string {
  return `${FIRST_SIGN_IN_KEY_PREFIX}:${normalizeRole(role)}:${email.trim().toLowerCase()}`;
}

export function queueAuthNotification(message: string, variant: AuthNotificationVariant = "success"): void {
  const payload: AuthNotificationPayload = { message, variant };
  sessionStorage.setItem(AUTH_NOTIFICATION_KEY, JSON.stringify(payload));
}

export function consumeAndShowAuthNotification(): void {
  const raw = sessionStorage.getItem(AUTH_NOTIFICATION_KEY);
  if (!raw) {
    return;
  }

  sessionStorage.removeItem(AUTH_NOTIFICATION_KEY);

  try {
    const payload = JSON.parse(raw) as AuthNotificationPayload;
    if (!payload?.message) {
      return;
    }
    if (payload.variant === "info") {
      toast.info(payload.message);
      return;
    }
    toast.success(payload.message);
  } catch {
    // Ignore malformed notification payloads.
  }
}

export function buildLoginConfirmationMessage(role?: string | null): string {
  return `Login successful. Signed in as ${getRoleLabel(role)}.`;
}

export function buildLogoutConfirmationMessage(role?: string | null): string {
  return `Logged out successfully from your ${getRoleLabel(role)} account.`;
}

export function buildFirstTimeSignInMessage(role?: string | null): string {
  return `Welcome! First-time sign in confirmed for your ${getRoleLabel(role)} account.`;
}

export function isFirstTimeSignIn(email?: string | null, role?: string | null): boolean {
  if (!email?.trim()) {
    return false;
  }
  const key = getFirstSignInSeenKey(email, role);
  return localStorage.getItem(key) !== "true";
}

export function markFirstTimeSignInSeen(email?: string | null, role?: string | null): void {
  if (!email?.trim()) {
    return;
  }
  const key = getFirstSignInSeenKey(email, role);
  localStorage.setItem(key, "true");
}
