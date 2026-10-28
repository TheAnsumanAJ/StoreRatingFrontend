import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import api from "../services/api.js";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword.length < 8 || form.newPassword.length > 16) {
      setError("Password must contain 8–16 characters.");
      return;
    }

    if (!/[A-Z]/.test(form.newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(form.newPassword)) {
      setError("Password must contain at least one special character.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.patch("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage(response.data.message || "Password updated successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100";

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
          <LockKeyhole size={23} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Change Password
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your account password securely.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { name: "currentPassword", label: "Current Password" },
          { name: "newPassword", label: "New Password" },
          { name: "confirmPassword", label: "Confirm New Password" },
        ].map(({ name, label }) => (
          <div key={name}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {label}
            </label>

            <div className="relative">
              <input
                className={`${inputClass} pr-12`}
                type={showPasswords ? "text" : "password"}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                required
                autoComplete={
                  name === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
              />

              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500">
          Use 8–16 characters, including an uppercase letter and a special
          character.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}