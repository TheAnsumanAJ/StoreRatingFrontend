import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Eye, EyeOff, ArrowRight, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(email.trim(), password);

      const routes = {
        SYSTEM_ADMIN: "/admin",
        NORMAL_USER: "/user",
        STORE_OWNER: "/owner",
      };

      navigate(routes[user.role] || "/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5038ff] text-white shadow-lg shadow-indigo-200">
              <Store size={25} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">RateWise</h1>
              <p className="text-sm text-slate-400">
                Store ratings platform
              </p>
            </div>
          </Link>

          <p className="text-sm font-semibold text-[#5038ff]">
            WELCOME BACK
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Sign in to RateWise
          </h2>
          <p className="mt-3 text-slate-500">
            Sign in to discover stores and share your experience.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5038ff] px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4028ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#5038ff] hover:underline"
            >
              Create an account
            </Link>
          </p>

          <p className="mt-10 text-center text-xs text-slate-400">
            By continuing, you agree to use RateWise responsibly.
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-[#f0efff] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-200/60 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-semibold text-[#5038ff]">
            <Star size={16} fill="currentColor" />
            Your opinion matters
          </span>

          <h2 className="mt-10 max-w-lg text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Discover great stores. Share honest ratings.
          </h2>

          <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
            Explore stores, compare community ratings, and help others make
            confident choices.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white bg-white/80 p-7 shadow-xl shadow-indigo-100/60 backdrop-blur">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={21} fill="currentColor" />
            ))}
          </div>
          <p className="mt-4 text-lg font-bold text-slate-800">
            Every rating builds trust.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            A simple platform connecting customers, store owners, and
            communities through transparent feedback.
          </p>
        </div>
      </section>
    </div>
  );
}
