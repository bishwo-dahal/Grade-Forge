import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowRight, Eye, EyeOff, ImagePlus, X } from "lucide-react";
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
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profilePicture) {
      setProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profilePicture);
    setProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

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
      const response = await signup(
        {
          name: name || email,
          email: email.trim(),
          password,
          // NOTE: Public signup is student-only; other roles are provisioned/admin-managed.
          role: "STUDENT" as const,
        },
        profilePicture,
      );

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
      markFirstTimeSignInSeen(response.email, response.role);
      queueAuthNotification(buildFirstTimeSignInMessage(response.role));
      // IMPORTANT: If profile is incomplete, force next step immediately so student can finish required fields.
      window.location.href =
        response.role.toUpperCase() === "STUDENT" && !response.profileCompleted
          ? "/complete-registration"
          : getDefaultRouteForRole(response.role);
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Sign up failed. Please try again.";
        setError(msg ?? "Sign up failed.");
      }
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

        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                {profilePreviewUrl ? (
                  <img src={profilePreviewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#2B2A2A]">Profile picture</p>
                <p className="text-[12px] text-gray-500">Optional. JPG or PNG — up to 5 MB.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2B2A2A] transition-colors hover:bg-gray-50">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      const okMime = file.type === "image/jpeg" || file.type === "image/png";
                      const okName = /\.(jpe?g|png)$/i.test(file.name);
                      if (!okMime && !okName) {
                        setError("Profile picture must be a JPG or PNG file.");
                        event.target.value = "";
                        return;
                      }
                    }
                    setProfilePicture(file);
                    event.target.value = "";
                  }}
                />
                Choose photo
              </label>
              {profilePicture ? (
                <button
                  type="button"
                  onClick={() => setProfilePicture(null)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
                  aria-label="Remove profile picture"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
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
      </form>
    </AuthSplitLayout>
  );
}
