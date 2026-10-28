import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.name.trim().length < 20 || form.name.trim().length > 60) {
      setError("Name must contain between 20 and 60 characters.");
      return;
    }

    if (form.address.trim().length > 400) {
      setError("Address cannot exceed 400 characters.");
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(form.password)) {
      setError(
        "Password must be 8–16 characters and contain an uppercase letter and a special character."
      );
      return;
    }

    setSubmitting(true);

    try {
      await signup(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.address.trim()
      );

      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create your account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-5 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link to="/login" className="mb-8 flex items-center gap-3">
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
          JOIN RATEWISE
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-3 text-slate-500">
          Create an account to explore stores and submit ratings.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={20}
              maxLength={60}
              value={form.name}
              onChange={updateField}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              20–60 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              required
              maxLength={400}
              rows={3}
              value={form.address}
              onChange={updateField}
              placeholder="Enter your address"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Maximum 400 characters
            </p>
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
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={16}
                value={form.password}
                onChange={updateField}
                placeholder="Create a strong password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-[#5038ff] focus:ring-4 focus:ring-indigo-50"
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
            <p className="mt-1 text-xs text-slate-400">
              8–16 characters, at least one uppercase letter and one special
              character.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5038ff] px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4028ed] disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#5038ff] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
