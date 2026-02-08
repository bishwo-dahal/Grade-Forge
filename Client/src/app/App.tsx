import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="size-full bg-[#F5F2F2]">
      <RouterProvider router={router} />
    </div>
  );
}