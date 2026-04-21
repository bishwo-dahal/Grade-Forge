import React, { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { getToken } from "./auth";
import { getCurrentUserPreferences } from "../services/userPreferencesService";
import { applyUserAppearancePreferences } from "./appearance";

export default function App() {
  useEffect(() => {
    // Apply preferences for all roles (student/faculty/GA/admin) when signed in.
    if (!getToken()) {
      return;
    }
    getCurrentUserPreferences()
      .then((res) => applyUserAppearancePreferences(res.preferences))
      .catch(() => {
        // Ignore preference-load errors; fall back to defaults.
      });
  }, []);

  return (
    <div className="size-full bg-[#F5F2F2]">
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}