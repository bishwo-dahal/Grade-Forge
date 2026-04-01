import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { AuthSplitLayout } from "./auth/AuthSplitLayout";
import {
  clearAuthenticated,
  getAuthenticatedRole,
  getAuthenticatedUser,
  getDefaultRouteForRole,
  getToken,
  isAuthenticated,
  isStudentRegistrationComplete,
  setAuthenticated,
} from "../auth";
import { completeStudentRegistration } from "../../services/authService";
import {
  buildLogoutConfirmationMessage,
  consumeAndShowAuthNotification,
  queueAuthNotification,
} from "../authNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const MAJOR_OPTIONS = ["Computer Science", "Software Engineering", "Data Science"] as const;

export default function CompleteStudentRegistrationPage() {
  const navigate = useNavigate();
  const [major, setMajor] = useState("");
  const [cwid, setCwid] = useState("");
  const [canvasUserId, setCanvasUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const role = getAuthenticatedRole();
  const user = getAuthenticatedUser();

  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  if (role !== "STUDENT") {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  if (isStudentRegistrationComplete()) {
    return <Navigate to="/dashboard" replace />;
  }

  const studentName = useMemo(() => user?.name?.trim() || "Student", [user?.name]);

  useEffect(() => {
    consumeAndShowAuthNotification();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!major.trim() || !cwid.trim() || !canvasUserId.trim()) {
      setError("Major, CWID, and Canvas ID are required.");
      return;
    }

    setLoading(true);

    try {
      await completeStudentRegistration({
        cwid: cwid.trim(),
        major: major.trim(),
        canvasUserId: canvasUserId.trim(),
      });

      const token = getToken();
      if (token && user) {
        // NOTE: Keep existing session identity and only mark completion status after backend confirms profile save.
        setAuthenticated(token, { ...user, profileCompleted: true });
      }

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to complete registration. Please try again.";
      setError(msg ?? "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    queueAuthNotification(buildLogoutConfirmationMessage(role));
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <AuthSplitLayout activeDotIndex={2}>
      <p className="mb-2 text-[14px] text-[#5D667A]">Welcome, {studentName}</p>
      <h1 className="mb-2 text-3xl font-bold text-[#2B2A2A]">Complete your registration</h1>
      <p className="mb-8 text-[14px] text-gray-600">
        Add your student profile details to continue to your dashboard.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>}

        <div>
          <label htmlFor="complete-major" className="mb-1.5 block text-[13px] font-medium text-[#2B2A2A]">
            Major
          </label>
          <select
            id="complete-major"
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FEB05D]"
          >
            <option value="">Select your major</option>
            {MAJOR_OPTIONS.map((majorOption) => (
              <option key={majorOption} value={majorOption}>
                {majorOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="complete-cwid" className="mb-1.5 block text-[13px] font-medium text-[#2B2A2A]">
            CWID
          </label>
          <input
            id="complete-cwid"
            type="text"
            value={cwid}
            onChange={(event) => setCwid(event.target.value)}
            placeholder="Enter your CWID"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FEB05D]"
          />
        </div>

        <div>
          <label htmlFor="complete-canvas-id" className="mb-1.5 block text-[13px] font-medium text-[#2B2A2A]">
            Canvas ID
          </label>
          <input
            id="complete-canvas-id"
            type="text"
            value={canvasUserId}
            onChange={(event) => setCanvasUserId(event.target.value)}
            placeholder="Enter your Canvas ID"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FEB05D]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-[#FEB05D] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#f5a04d] disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue to dashboard"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-[13px] text-gray-600">
        <button
          type="button"
          onClick={() => setIsLogoutDialogOpen(true)}
          className="text-[#FEB05D] underline hover:text-[#f5a04d]"
        >
          Sign out
        </button>
      </div>
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out before completing registration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={handleLogout}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthSplitLayout>
  );
}
