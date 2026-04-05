import React from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
  return (
    <div className="size-full bg-[#F5F2F2]">
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}