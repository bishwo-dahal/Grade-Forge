import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "./auth/AuthSplitLayout";
import {
  getAuthenticatedRole,
  getDefaultRouteForRole,
  isAuthenticated,
  isStudentRegistrationComplete,
  setAuthenticated,
} from "../auth";
import { login } from "../../services/authService";
import {
  buildFirstTimeSignInMessage,
  buildLoginConfirmationMessage,
  consumeAndShowAuthNotification,
  isFirstTimeSignIn,
  markFirstTimeSignInSeen,
  queueAuthNotification,
} from "../authNotifications";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // NOTE: Preserve deep-link target when allowed, otherwise fall back to role default after login.
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    consumeAndShowAuthNotification();
  }, []);

  if (isAuthenticated()) {
    const role = getAuthenticatedRole();
    // NOTE: Keep already-signed-in students on the completion gate until required profile fields are saved.
    const target = role === "STUDENT" && !isStudentRegistrationComplete()
      ? "/complete-registration"
      : getDefaultRouteForRole(role);
    return <Navigate to={target} replace />;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login({ email, password });
      if (!response.token) {
        setError("Invalid response from server.");
        return;
      }
      setAuthenticated(response.token, {
        name: response.name,
        email: response.email,
        role: response.role,
        profileCompleted: response.profileCompleted,
        profilePictureUrl: response.profilePictureUrl ?? undefined,
      });
      if (isFirstTimeSignIn(response.email, response.role)) {
        markFirstTimeSignInSeen(response.email, response.role);
        queueAuthNotification(buildFirstTimeSignInMessage(response.role));
      } else {
        queueAuthNotification(buildLoginConfirmationMessage(response.role));
      }
      if (response.role?.toUpperCase() === "STUDENT" && !response.profileCompleted) {
        // IMPORTANT: Incomplete student profiles are always redirected to completion before any dashboard route.
        navigate("/complete-registration", { replace: true });
        return;
      }
      const fallbackRoute = getDefaultRouteForRole(response.role);
      const targetRoute = from && from !== "/signin" && from !== "/signup" ? from : fallbackRoute;
      navigate(targetRoute, { replace: true });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Sign in failed. Please check your email and password.";
      setError(msg ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout activeDotIndex={1}>
      {/* NOTE: Shared auth shell keeps sign-in and sign-up layouts consistent. */}

      {/* Header */}
      <h1 className="text-3xl font-bold text-[#2B2A2A] mb-2">
        Welcome back
      </h1>
      <p className="text-[14px] text-gray-600 mb-8">
        Don't have an account?{" "}
        <Link to="/signup" className="text-[#7A1226] hover:text-[#65101F] underline">
          Sign up
        </Link>
      </p>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSignIn}>
        {error && (
          <div className="py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
            {error}
          </div>
        )}
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[13px] text-gray-600 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9F3549] focus:border-transparent"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[13px] text-gray-600 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9F3549] focus:border-transparent pr-12"
            />
            {/* Accessibility: icon-only toggle needs an explicit label. */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Eye className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 bg-white text-[#7A1226] focus:ring-2 focus:ring-[#9F3549] focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember" className="text-[13px] text-gray-600 cursor-pointer">
              Remember me
            </label>
          </div>
          <a href="#" className="text-[13px] text-[#7A1226] hover:text-[#65101F]">
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#7A1226] hover:bg-[#65101F] disabled:opacity-60 text-white rounded-lg text-[14px] font-semibold transition-colors mt-6"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthSplitLayout>
  );
}
