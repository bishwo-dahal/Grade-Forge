/** GET/PATCH `/api/v1/users/me` profile payload (backend `UserProfileResponse`). */

export interface UserProfilePictureResponse {
  url?: string | null;
  presignedUrl?: string | null;
  fileUrl?: string | null;
  profilePictureUrl?: string | null;
}

export interface UserProfileResponse {
  userId: number;
  name: string;
  email: string;
  role: string;
  /** Nested DTO or, if serialized flat, a direct URL string. */
  profilePicture?: UserProfilePictureResponse | string | null;
}
