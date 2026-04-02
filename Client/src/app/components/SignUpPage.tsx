import { useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "./auth/AuthSplitLayout";
import {
  getAuthenticatedRole,
  getDefaultRouteForRole,
  isAuthenticated,
  isStudentRegistrationComplete,
  setAuthenticated,
} from "../auth";
import { signup } from "../../services/authService";
import {
  buildFirstTimeSignInMessage,
  markFirstTimeSignInSeen,
  queueAuthNotification,
} from "../authNotifications";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    const role = getAuthenticatedRole();
    // NOTE: Incomplete student profiles are routed to completion instead of dashboard even from auth pages.
    const target = role === "STUDENT" && !isStudentRegistrationComplete()
      ? "/complete-registration"
      : getDefaultRouteForRole(role);
    return <Navigate to={target} replace />;
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // NOTE: Create the account as soon as base fields are valid so user can complete profile later.
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in first name, last name, email, and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const response = await signup({
        name: name || email,
        email: email.trim(),
        password,
        // NOTE: Public signup is student-only; other roles are provisioned/admin-managed.
        role: "STUDENT" as const,
      });

      setAuthenticated(response.token, {
        name: response.name,
        email: response.email,
        role: response.role,
        profileCompleted: response.profileCompleted,
      });
      markFirstTimeSignInSeen(response.email, response.role);
      queueAuthNotification(buildFirstTimeSignInMessage(response.role));
      // IMPORTANT: If profile is incomplete, force next step immediately so student can finish required fields.
      window.location.href =
        response.role.toUpperCase() === "STUDENT" && !response.profileCompleted
          ? "/complete-registration"
          : getDefaultRouteForRole(response.role);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Sign up failed. Please try again.";
      setError(msg ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout activeDotIndex={2}>
      {/* NOTE: Shared auth shell keeps sign-in and sign-up layouts consistent. */}
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-[13px] text-gray-600 transition-colors hover:text-[#2B2A2A]"
      >
        Back to website
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-[#2B2A2A]">Create an account</h1>
      <p className="mb-8 text-[14px] text-gray-600">
        Already have an account?{" "}
        <Link to="/signin" className="text-[#7A1226] underline hover:text-[#65101F]">
          Log in
        </Link>
      </p>

      <form className="space-y-4" onSubmit={handleSignUp}>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <label htmlFor="first-name" className="sr-only">
            First name
          </label>
          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F3549]"
          />
          <label htmlFor="last-name" className="sr-only">
            Last name
          </label>
          <input
            id="last-name"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F3549]"
          />
        </div>

        <label htmlFor="signup-email" className="sr-only">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F3549]"
        />

        <div className="relative">
          <label htmlFor="signup-password" className="sr-only">
            Password
          </label>
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9F3549]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#7A1226] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#65101F] disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-[12px] text-gray-600">
          Next step: complete your registration with major, CWID, and Canvas ID.
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="bg-white px-3 text-gray-500">Or register with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-[#2B2A2A] transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#2B2A2A">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
