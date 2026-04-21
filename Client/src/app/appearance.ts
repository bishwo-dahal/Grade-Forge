import type { UserPreferences } from "../services/userPreferencesService";

function themeToMode(theme: string | undefined): "light" | "dark" | "system" {
  const t = (theme ?? "System").toLowerCase();
  if (t === "light") return "light";
  if (t === "dark") return "dark";
  return "system";
}

export function applyUserAppearancePreferences(preferences: UserPreferences | null | undefined): void {
  const appearance = preferences?.appearance ?? {};

  // Dyslexic-friendly font
  const dyslexic = appearance.dyslexicFont === true;
  document.documentElement.classList.toggle("gf-font-dyslexic", dyslexic);

  // Font size (maps to --font-size in theme.css)
  const fontSize = (appearance.fontSize ?? "Default").toLowerCase();
  const px = fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";
  document.documentElement.style.setProperty("--font-size", px);

  // Theme (uses `.dark` class already supported by theme.css)
  const mode = themeToMode(appearance.theme);
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else if (mode === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
}

