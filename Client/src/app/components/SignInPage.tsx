import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "./auth/AuthSplitLayout";
import { isAuthenticated, setAuthenticated } from "../auth";
import { login } from "../../services/authService";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login({ email, password });
      setAuthenticated(response.token, {
        name: response.name,
        email: response.email,
        role: response.role,
      });
      navigate(from, { replace: true });
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
        <Link to="/signup" className="text-[#FEB05D] hover:text-[#f5a04d] underline">
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
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEB05D] focus:border-transparent"
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
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEB05D] focus:border-transparent pr-12"
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
              className="w-4 h-4 rounded border-gray-300 bg-white text-[#FEB05D] focus:ring-2 focus:ring-[#FEB05D] focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember" className="text-[13px] text-gray-600 cursor-pointer">
              Remember me
            </label>
          </div>
          <a href="#" className="text-[13px] text-[#FEB05D] hover:text-[#f5a04d]">
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#FEB05D] hover:bg-[#f5a04d] disabled:opacity-60 text-white rounded-lg text-[14px] font-semibold transition-colors mt-6"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="px-3 bg-white text-gray-500">Or sign in with</span>
          </div>
        </div>

        {/* Social Sign In Buttons */}
        {/* NOTE: Social buttons also redirect to dashboard for now. */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            disabled
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-[14px] text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#2B2A2A">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
