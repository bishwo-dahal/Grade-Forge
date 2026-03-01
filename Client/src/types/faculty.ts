/** Response from GET /api/v1/faculty/me */
export interface FacultyResponse {
  id?: number;
  facultyId?: number;
  userId?: number;
  name: string;
  email: string;
  department?: string;
  qualifications?: string;
  phoneNumber?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;
  role?: string;
}

/** Payload for PUT /api/v1/faculty/me */
export interface FacultyUpdateRequest {
  name?: string;
  department?: string;
  qualifications?: string;
  phoneNumber?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;
}
