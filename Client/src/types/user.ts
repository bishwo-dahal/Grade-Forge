// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

export type UserRole = "student" | "faculty";

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  initials: string;
  role: UserRole;
}
