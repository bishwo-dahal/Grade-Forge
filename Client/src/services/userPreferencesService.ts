import api from "../api/axios";

export type AppearanceTheme = "Light" | "Dark" | "System";
export type AppearanceFontSize = "Small" | "Default" | "Large";
export type AppearanceDensity = "Compact" | "Comfortable" | "Spacious";

export interface UserPreferences {
  appearance?: {
    theme?: AppearanceTheme;
    fontSize?: AppearanceFontSize;
    density?: AppearanceDensity;
    dyslexicFont?: boolean;
  };
}

export interface UserPreferencesResponse {
  preferences: UserPreferences;
}

export async function getCurrentUserPreferences(): Promise<UserPreferencesResponse> {
  const { data } = await api.get<UserPreferencesResponse>("/api/v1/users/me/preferences");
  return data;
}

export async function putCurrentUserPreferences(preferences: UserPreferences): Promise<UserPreferencesResponse> {
  const { data } = await api.put<UserPreferencesResponse>("/api/v1/users/me/preferences", { preferences });
  return data;
}

