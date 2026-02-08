import type { UserProfile } from "../types/user";

// NOTE: Centralized mock auth data so the backend team can replace it later.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const studentProfile: UserProfile = {
  id: "student-1",
  name: "Damir Filaretov",
  handle: "@alexj.edu",
  initials: "AJ",
  role: "student",
};

const facultyProfile: UserProfile = {
  id: "faculty-1",
  name: "Dr. Sarah Miller",
  handle: "@smiller.edu",
  initials: "SM",
  role: "faculty",
};

export function getStudentProfile(): Promise<UserProfile> {
  return Promise.resolve(studentProfile);
}

export function getFacultyProfile(): Promise<UserProfile> {
  return Promise.resolve(facultyProfile);
}
