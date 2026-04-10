import { apiBaseURL } from "../api/axios";
import { getToken } from "../app/auth";
import { getApiErrorMessage } from "../utils/apiErrorMessage";
import type { UserProfilePictureResponse, UserProfileResponse } from "../types/userProfileApi";

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function isAllowedProfileImage(file: File): boolean {
  if (ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return /\.(jpe?g|png)$/i.test(file.name);
}

export function extractProfilePictureUrlFromResponse(response: UserProfileResponse): string | null {
  const p = response.profilePicture;
  if (p == null) {
    return null;
  }
  if (typeof p === "string") {
    const trimmed = p.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof p !== "object") {
    return null;
  }
  const c = p as UserProfilePictureResponse;
  const raw = c.url ?? c.presignedUrl ?? c.fileUrl ?? c.profilePictureUrl;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * PATCH `/api/v1/users/me` — multipart parts `name` (optional) and `file` (optional).
 * Uses `fetch` so multipart boundaries match Spring (avoids axios charset issues on some stacks).
 */
export async function patchCurrentUserProfile(options: {
  name?: string | null;
  file?: File | null;
}): Promise<UserProfileResponse> {
  const { name, file } = options;

  if (file && file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error("Profile picture must be 5 MB or smaller.");
  }
  if (file && file.size > 0 && !isAllowedProfileImage(file)) {
    throw new Error("Profile picture must be a JPG or PNG file.");
  }

  const formData = new FormData();
  if (name != null && String(name).trim() !== "") {
    formData.append("name", String(name).trim());
  }
  if (file && file.size > 0) {
    formData.append("file", file);
  }

  if (!formData.has("name") && !formData.has("file")) {
    throw new Error("Nothing to update.");
  }

  const url = `${apiBaseURL}/api/v1/users/me`;
  const token = getToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(getApiErrorMessage({ response: { data } }, "Failed to update profile."));
  }

  return data as UserProfileResponse;
}
